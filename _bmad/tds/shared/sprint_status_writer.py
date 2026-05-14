"""TDS sprint-status writer — atomic, ruamel.yaml-preserving round-trip.

Per ADR-0010, this is the ONLY path that writes BMAD-canonical
`_bmad/bmm/sprint-status.yaml`. The TS-runtime spawns this subprocess for
every `tds state set` and indirect sprint-status flips from
`tds story update` / `tds epic create-bridge-from-retros`.

Contract:
  --path <abs-path>     target file
  --key <story-key>     BMAD-canonical key (e.g. `1-3-plant-data-model`,
                        `epic-2`, `bridge-1-2`)
  --status <enum>       BMAD enum value (`backlog | ready-for-dev |
                        in-progress | review | done | optional`); other
                        values pass through (TDS doesn't enforce the enum
                        at write — that's a CI guard's job).
  --append              Allow creating a new key (default: only set on
                        existing keys). Used by `tds epic create-bridge-from-retros`
                        to add bridge-<from>-<to> entries.
  --insert-before <k>   When --append is creating a new key, insert it
                        before existing key <k> (instead of appending at
                        the end). If <k> doesn't exist, falls back to
                        append. Used to keep bridge-N-(N+1) ordered above
                        epic-(N+1) in sprint-status.
  --comment <text>      Attach a human-readable YAML comment line above
                        the new key (analogue to BMAD's `# Epic N:
                        <title>` comments). Prefixed with one blank line
                        for readability. Applied only on first creation.

Behaviour:
  * Reads the file with ruamel.yaml typ='rt' + preserve_quotes=True.
  * Mutates only `development_status[<key>]`. Comments, quoting,
    insertion order, blank lines preserved bytewise (sub-spike 1
    confirmed 4/5 fixtures pass).
  * Atomically replaces the file via tempfile + os.replace +
    os.fsync(parent_dir).
  * If `<key>` does not exist in development_status — exits 1.
  * If `development_status` block missing — exits 3 (PRECONDITION).

Exit codes match the TDS error registry (see _docs/spec/registry/error-codes.yaml):
  0 success
  1 USAGE / key not found
  3 PRECONDITION / development_status missing
  5 RUNTIME / I/O failure
"""
from __future__ import annotations

import argparse
import os
import sys
import tempfile

from ruamel.yaml import YAML


def _split_eol_and_leading(token_value: str) -> tuple[str | None, str | None]:
    """Split a CommentToken value that may contain EOL+leading combined.

    Round-trip outputs `<key>: <value> # EOL_text\\n\\n  # leading...\\n` as a
    single token where EOL и leading-of-next-key sit one after another.
    Detection: token contains `\\n\\n  # ` separator AND content after
    separator looks like comment lines.

    Returns:
        (eol_part_or_None, leading_part_or_None)
        - leading_part includes leading `\\n\\n` (blank line) prefix.
        - eol_part is everything before that separator.
        - If only one type detected — other is None.
    """
    # Find blank-line separator с leading whitespace + #.
    import re
    m = re.search(r"\n\n\s*#", token_value)
    if m is None:
        # Single chunk — classify by leading char.
        if token_value.startswith("\n"):
            return None, token_value
        return token_value, None
    sep_pos = m.start()
    eol_part = token_value[:sep_pos]  # without trailing \n
    leading_part = token_value[sep_pos:]  # starts с \n\n
    if not eol_part:
        eol_part = None
    return eol_part, leading_part


def _strip_comment_prefix(text: str) -> str:
    """Strip `# ` line prefixes for re-emission via yaml_set_comment_before_after_key
    (which adds them back). Normalizes leading newlines к одной — иначе при
    multi-call insert chain blank lines накапливаются (each call re-attaches
    с +1 leading \\n).
    """
    # Collapse multiple leading newlines в один.
    body = text.lstrip("\n")
    lines = body.rstrip("\n").split("\n")
    out = []
    for line in lines:
        s = line.strip()
        if s.startswith("# "):
            out.append(s[2:])
        elif s.startswith("#"):
            out.append(s[1:])
        else:
            out.append(s)
    # Prepend single `\n` для single blank line separation от prev key.
    return "\n" + "\n".join(out)


def _atomic_replace(target: str, content: bytes) -> None:
    target_dir = os.path.dirname(os.path.abspath(target)) or "."
    fd, tmp = tempfile.mkstemp(prefix=".sprint-status.", suffix=".tmp",
                               dir=target_dir)
    try:
        with os.fdopen(fd, "wb") as f:
            f.write(content)
            f.flush()
            os.fsync(f.fileno())
        os.replace(tmp, target)
        # fsync the parent directory so the rename is durable across
        # power-cut. POSIX-only; on Windows os.open of a directory raises,
        # so we guard.
        if os.name == "posix":
            dir_fd = os.open(target_dir, os.O_RDONLY)
            try:
                os.fsync(dir_fd)
            finally:
                os.close(dir_fd)
    except Exception:
        try:
            os.unlink(tmp)
        except FileNotFoundError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--path", required=True)
    parser.add_argument("--key", required=True)
    parser.add_argument("--status", required=True)
    parser.add_argument("--append", action="store_true",
                        help="Create the key if it does not exist yet "
                             "(default: refuse with exit 1).")
    parser.add_argument("--insert-before", default=None,
                        help="On --append, insert new key before this "
                             "existing key (falls back to append if "
                             "target absent).")
    parser.add_argument("--comment", default=None,
                        help="Human-readable comment line attached above "
                             "the new key on first creation.")
    parser.add_argument("--inline-comment", default=None,
                        help="Trailing inline comment attached на той же "
                             "строке как `<key>: <value>` (mirror'ит pattern "
                             "других epic stories: `12-1-foo: done   # full "
                             "description`). Применяется на set И на insert.")
    parser.add_argument("--touch-timestamp", action="store_true",
                        help="Refresh top-level `last_updated:` field if "
                             "present (opt-in to preserve bytewise "
                             "roundtrip in tests + η-spike fixtures).")
    args = parser.parse_args()

    if not os.path.exists(args.path):
        print(f"sprint-status.yaml not found: {args.path}", file=sys.stderr)
        return 5

    yaml = YAML(typ="rt")
    yaml.preserve_quotes = True
    yaml.width = 4096
    yaml.indent(mapping=2, sequence=4, offset=2)

    try:
        with open(args.path, "rb") as f:
            data = yaml.load(f)
    except Exception as exc:  # noqa: BLE001
        print(f"failed to parse sprint-status.yaml: {exc}", file=sys.stderr)
        return 5

    if data is None or "development_status" not in data:
        print("sprint-status.yaml is missing the 'development_status' block",
              file=sys.stderr)
        return 3

    dev = data["development_status"]
    is_new_key = args.key not in dev
    if is_new_key:
        if not args.append:
            print(f"key {args.key!r} not found in development_status",
                  file=sys.stderr)
            return 1

    if is_new_key and args.insert_before and args.insert_before in dev:
        # Bridge-insert flow с full preservation of target's leading
        # comments (e.g. `# ── Epic 13 ──` heading block) AND inline EOL
        # comments на bridge stories.
        #
        # Сложность: ruamel.yaml stores 3 different things в одном
        # ca.items[X][2] slot — leading-of-next-key, EOL-of-X-value, OR
        # combined «EOL + blank line + leading» после round-trip из
        # YAML где они оба хранятся sequentially после X's value line.
        # Naive insert/copy логика trashes одно из двух.
        #
        # Approach:
        #   1. Normalize: scan existing slots, split combined tokens
        #      into separate EOL и leading-of-next, store leading
        #      на target_key.[1] (programmatic API slot, separate
        #      from [2]). После этого ОБЕ работают independently.
        #   2. Capture target's leading (now consistently на
        #      ca.items[insert_before][1] либо в combined-token
        #      detected on prev_key.[2]) before insert.
        #   3. Insert key.
        #   4. Re-attach captured leading via yaml_set_comment_before_after_key
        #      on insert_before — write на insert_before.[1] (separate
        #      slot from [2] used by EOL).
        keys = list(dev.keys())
        idx = keys.index(args.insert_before)
        prev_key = keys[idx - 1] if idx > 0 else None

        # Step 1: Normalize prev_key.[2] if it contains combined EOL+leading.
        captured_leading_text = None
        if prev_key is not None and prev_key in dev.ca.items:
            existing = dev.ca.items[prev_key][2]
            if existing is not None:
                eol_part, leading_part = _split_eol_and_leading(existing.value)
                if leading_part is not None:
                    captured_leading_text = leading_part
                    if eol_part is not None:
                        # Restore EOL-only on prev_key.
                        existing.value = eol_part
                    else:
                        # No EOL — clear slot entirely.
                        dev.ca.items[prev_key][2] = None

        # Also check if target already has programmatic leading в [1].
        if captured_leading_text is None and args.insert_before in dev.ca.items:
            existing_target_leading = dev.ca.items[args.insert_before][1]
            if existing_target_leading:
                # Reconstruct text from list of CommentTokens.
                pieces = []
                for ct in existing_target_leading:
                    pieces.append(ct.value)
                captured_leading_text = "".join(pieces)
                dev.ca.items[args.insert_before][1] = None

        # Step 2: Insert.
        dev.insert(idx, args.key, args.status)

        # Step 3: Re-attach captured leading к target via [1] slot.
        if captured_leading_text:
            cleaned = _strip_comment_prefix(captured_leading_text)
            dev.yaml_set_comment_before_after_key(
                args.insert_before, before=cleaned, indent=2,
            )
    else:
        dev[args.key] = args.status

    if is_new_key and args.comment:
        # Prefix one blank line so the comment block visually separates
        # the new bridge from the prior epic group (matches `# Epic N:`
        # convention used by BMAD-native bmad-create-epic).
        dev.yaml_set_comment_before_after_key(
            args.key, before=f"\n{args.comment}", indent=2,
        )

    if args.inline_comment:
        # EOL trailing comment на той же строке как `<key>: <value>`. Используется
        # для bridge stories: short slugified key + full title в EOL comment
        # mirror'ит pattern остальных epic stories. Column auto-aligned ruamel'ом.
        dev.yaml_add_eol_comment(args.inline_comment, args.key, column=0)

    # Refresh top-level `last_updated` field — only when caller
    # opts in via --touch-timestamp. Default off keeps bytewise
    # roundtrip stable for η-spike fixtures + future migration
    # tests. CLI subcommands that flip sprint-status as part of a
    # workflow step (state set, story update, branch start) pass
    # the flag; raw `tds state set` for diagnostics or fixture
    # work does not.
    if args.touch_timestamp and "last_updated" in data:
        from datetime import datetime, timezone
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        data["last_updated"] = f"{ts} {args.key}: {args.status}"

    import io
    buf = io.BytesIO()
    yaml.dump(data, buf)
    _atomic_replace(args.path, buf.getvalue())
    return 0


if __name__ == "__main__":
    sys.exit(main())
