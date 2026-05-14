# iOS / Swift — recommended `.claude/settings.local.json` allow patterns

Copy-paste в свой `.claude/settings.local.json` (под `permissions.allow`)
чтобы pre-approve typical iOS dev-cycle commands. Patterns — Claude Code
prefix-matching, `*` в конце = «любые args».

```json
{
  "permissions": {
    "allow": [
      "Bash(xcodebuild *)",
      "Bash(xcodebuild build *)",
      "Bash(xcodebuild test *)",
      "Bash(xcodebuild clean *)",
      "Bash(xcodebuild archive *)",
      "Bash(xcrun *)",
      "Bash(xcrun simctl *)",
      "Bash(xcrun xctrace *)",
      "Bash(swift build *)",
      "Bash(swift test *)",
      "Bash(swift run *)",
      "Bash(swift package *)",
      "Bash(swift --version)",
      "Bash(pod install *)",
      "Bash(pod install)",
      "Bash(pod update *)",
      "Bash(pod update)",
      "Bash(fastlane *)",
      "Bash(swiftlint *)",
      "Bash(swiftformat *)"
    ]
  }
}
```

## Simulator helpers

```json
{
  "permissions": {
    "allow": [
      "Bash(xcrun simctl boot *)",
      "Bash(xcrun simctl shutdown *)",
      "Bash(xcrun simctl install *)",
      "Bash(xcrun simctl launch *)",
      "Bash(xcrun simctl list *)",
      "Bash(open -a Simulator)"
    ]
  }
}
```

## Известные ограничения

Claude Code permission engine — **strict prefix match**:

- Wildcards `*` работают **в конце** pattern'а или в command body
  (`xcodebuild test *` matches `xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,...'`).
- Wildcards в **середине / начале** не работают.
- **Compound chains** (`xcodebuild build | xcpretty`) каждая unique
  string. См. Шаг 4e в `bmad-tds-execute-story` SKILL.md — recommended
  избегать compound. Рекомендация: использовать `xcbeautify` через
  pipe-aware allow или standalone post-process через файл.

## Альтернатива: shell rc / direnv

```sh
# .envrc (project-root)
export DEVELOPER_DIR="/Applications/Xcode.app/Contents/Developer"
```

`xcode-select` устанавливает default Xcode globally; tool-version
конфликты лучше через `direnv` с локальным override чем inline
`DEVELOPER_DIR=... xcodebuild`.
