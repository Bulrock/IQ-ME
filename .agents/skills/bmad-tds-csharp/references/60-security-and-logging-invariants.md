# C# security + logging invariants

> **Priority:** P1.
> **Gate level:** hard для production-path secret/PII handling;
> advisory для general logging hygiene.
> **Load trigger:** story adds OR changes:
> - logging statements (`ILogger<T>.LogX(...)`, `Console.WriteLine`,
>   `Serilog`, NLog);
> - sensitive-value handling (passwords, API tokens, connection
>   strings, JWT, OAuth secrets, PII fields);
> - cryptographic comparison (string-equality on tokens / signatures);
> - URL construction from user input (potential SSRF);
> - new exception path that might leak stack-trace contents к user.
> **Evidence level:** external-source (OWASP Logging Cheat Sheet,
> OWASP Top-10 A09 «Security Logging Failures» + ASVS V7) +
> multi-project lesson (recurring «raw token logged» findings).

## Rule 1 — no raw secrets / PII / tokens / connection strings в logs

Production logs must never contain:

- Passwords (plain или hashed — hashes still attack-useful).
- API tokens / OAuth bearer / JWT (entire string, even partial без
  masking).
- Connection strings (often include credentials embedded).
- Private keys / certificates.
- Personal identifiers: SSN / passport / national ID / full credit
  card.
- Email addresses в bulk / unmasked в high-trust paths.
- Session tokens / refresh tokens.

**Anti-pattern (silent leak):**

```csharp
_logger.LogInformation("User {Email} authenticated с token {Token}",
    user.Email, token);
// → token appears verbatim в log storage, log aggregator, на disk.
```

**Correct (mask at boundary):**

```csharp
_logger.LogInformation("User {EmailMasked} authenticated с token {TokenLast4}",
    Mask.Email(user.Email),     // "a***e@example.com"
    Mask.LastN(token, 4));       // "***************XyZ9"
```

## Rule 2 — Shared `Mask` utility, не per-call inline masking

Inline masking (`token.Substring(token.Length - 4)`) duplicates,
drifts (one call uses 4 chars, another 6), and bypasses central
audit. Use one masking module project-wide:

```csharp
// /Common/Logging/Mask.cs
public static class Mask
{
    public static string LastN(string? value, int n = 4) =>
        string.IsNullOrEmpty(value) || value.Length <= n
            ? "***"
            : new string('*', value.Length - n) + value[^n..];

    public static string Email(string? value)
    {
        if (string.IsNullOrEmpty(value) || !value.Contains('@'))
            return "***";
        var parts = value.Split('@', 2);
        var local = parts[0];
        var maskedLocal = local.Length <= 2
            ? "***"
            : $"{local[0]}***{local[^1]}";
        return $"{maskedLocal}@{parts[1]}";
    }

    public static string ConnectionString(string? value) =>
        // Strip Password=...; / Pwd=...; — regex on standard
        // connection-string syntax.
        Regex.Replace(value ?? "", @"(Password|Pwd)=[^;]+",
                      "$1=***", RegexOptions.IgnoreCase);
}
```

**Anti-patterns:**

- Per-call `token.Substring(...)` reinvention — drift inevitable.
- Conditional masking based on log level — Debug log в production
  still leaks if запросторщёт.
- `value.Take(4)` style truncation — sometimes shows the wrong end
  of the secret (first 4 chars of a JWT include header alg only;
  last 4 of JWT signature тоже attacker-useful).

## Rule 3 — Timing-safe comparison для tokens / signatures / MACs

Standard string-equality (`==`, `String.Equals`, `Equals(StringComparison.
Ordinal)`) short-circuits on first mismatch — timing leak обнаружает
the matching prefix length к attacker. Use `CryptographicOperations.
FixedTimeEquals`:

```csharp
// Wrong (timing-leaky):
if (providedToken == storedToken) { ... }

// Right (constant-time):
var providedBytes = Encoding.UTF8.GetBytes(providedToken);
var storedBytes = Encoding.UTF8.GetBytes(storedToken);
if (CryptographicOperations.FixedTimeEquals(providedBytes, storedBytes))
{ ... }
```

Apply for:
- HMAC signature verification (webhook secret check).
- API key validation.
- Session token comparison.
- Password reset token comparison.

(`BCrypt.Net` / `Argon2` already use constant-time internally —
fine.)

## Rule 4 — SSRF validation на user-supplied URLs

When constructing HTTP requests against URLs that originate from
user input (webhooks, image-fetch APIs, federation endpoints), validate:

- Scheme is `https` only (no `http` / `file` / `gopher` / `data`).
- Host resolves к public IP, не RFC1918 (`10.*`, `192.168.*`,
  `172.16-31.*`), не loopback (`127.*`, `::1`), не link-local
  (`169.254.*`), не AWS metadata (`169.254.169.254`).
- DNS resolution result re-checked against allowlist on every
  request (TOCTOU — DNS can flip between validation и actual fetch).

```csharp
public static class SsrfGuard
{
    public static void EnsureSafeUri(Uri uri)
    {
        if (uri.Scheme != Uri.UriSchemeHttps)
            throw new InvalidOperationException("HTTPS only");
        var addresses = Dns.GetHostAddresses(uri.Host);
        foreach (var addr in addresses)
        {
            if (IsPrivate(addr) || IsLoopback(addr))
                throw new InvalidOperationException("Internal addr blocked");
        }
        // Note: TOCTOU still possible at HttpClient send-time.
        // Mitigation: custom SocketsHttpHandler.ConnectCallback re-
        // checks address before connecting.
    }
}
```

## Rule 5 — Exception messages для security-sensitive paths

Exception text returned к user must not include:

- Stack trace (production setting `IncludeErrorDetail = false`).
- File paths / connection strings / config values.
- SQL query text containing parameter values.
- Token / secret / hash content (even partial).

Pattern: throw с rich context internally (logged через `_logger.
LogError(ex, ...)`), но return к caller via generic `ProblemDetails`
с opaque correlation ID:

```csharp
try { ... }
catch (Exception ex)
{
    var correlationId = Guid.NewGuid();
    _logger.LogError(ex, "Auth failed for user {UserId}, корреляция: {CorrelationId}",
        userId, correlationId);
    return Problem(
        title: "Authentication error",
        detail: $"Reference: {correlationId}",  // opaque — safe.
        statusCode: 401);
}
```

User gets opaque correlation ID; support engineer correlates к log
entry via internal lookup.

## Rule 6 — Repeated invariants enforced through arch-tests pragmatically

When a security/logging invariant has been violated multiple times
(пример: «service-X.SendMessage logs token unmasked» — caught на
review, fixed, recurred), promote it к arch-test enforcement:

```csharp
[Fact]
public void NoLoggerCalls_PassRawTokenParameter()
{
    var violations = new List<string>();
    foreach (var file in Directory.GetFiles("src", "*.cs",
                                             SearchOption.AllDirectories))
    {
        var content = File.ReadAllText(file);
        // Naive regex catches `_logger.Log*(... token ...` without
        // surrounding Mask.* call. Refine за false positives.
        var match = Regex.Matches(content,
            @"_logger\.\w+\([^;]*\btoken\b[^;]*\)");
        foreach (Match m in match)
        {
            if (!m.Value.Contains("Mask.")) violations.Add($"{file}: {m.Value}");
        }
    }
    violations.Should().BeEmpty();
}
```

**When to use arch-tests:**

- Invariant fired ≥2 times historically (multi-project-validated).
- False-positive cost low (regex tightly bounded).
- Roslyn analyzer overkill (custom analyzer wins after >3 invariants
  consolidate, не для one-off).

**Don't preemptively enforce every possible rule** — bikeshedding;
prefer code review для first 2 occurrences, then arch-test.

## Detection (review checklist)

- [ ] Logging statements с secret / token / PII parameters — masked
      via `Mask.*` utility?
- [ ] Token / signature / MAC comparisons use `CryptographicOperations.
      FixedTimeEquals`?
- [ ] User-supplied URLs validated против SSRF (scheme + DNS
      allowlist + TOCTOU-mitigation `ConnectCallback`)?
- [ ] Exception responses к caller — opaque correlation ID, no
      stack trace / paths / config values?
- [ ] Repeated invariant violations — promoted к arch-test after
      ≥2 historical breaches?

## Related

- `references/15-clean-code-csharp.md` — exception over `null`,
  constructor DI.
- OWASP Logging Cheat Sheet: <https://cheatsheetseries.owasp.org/
  cheatsheets/Logging_Cheat_Sheet.html>.
- OWASP Top 10 A09 «Security Logging Failures».
- ASVS V7 Logging requirements.
- `System.Security.Cryptography.CryptographicOperations` docs (MS).
