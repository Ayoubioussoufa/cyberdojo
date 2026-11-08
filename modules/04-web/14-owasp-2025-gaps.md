---
title: The rest of the OWASP Top 10
summary: Four categories the course only named. Security misconfiguration, data integrity failures, logging that doesn't alert, and code that fails unsafely when something goes wrong.
level: intermediate
side: defence
minutes: 40
attack: T1190, T1562.002
needs: 0046-how-web-applications-fail
pair: 04-13-testing-workflow-burp
source: OWASP Top 10:2025 | https://top10.owasp.org/2025/
words: fail closed, misconfiguration, integrity failure
---
Lesson 46 mapped the OWASP Top 10:2025, and later lessons taught most of it in depth. Four categories were left as table rows. They're less glamorous than injection, and they cause a great many real breaches. Here they are, with what to actually do about each.

@term fail closed = Denying access or stopping when something goes wrong, rather than carrying on.
@term fail open = Allowing access when a check fails or errors.

## Concept

### A02: Security Misconfiguration

[A02:2025](https://top10.owasp.org/2025/A02_2025-Security_Misconfiguration/) moved up to second place. A secure product, badly configured, is an insecure product. Software has many settings, defaults favour convenience, and modern stacks multiply them.

| Common failure | Why it happens |
|---|---|
| Default accounts | Nobody changed them |
| Debug mode in production | It helped during development |
| Directory listing, exposed `.git` | A web server default |
| Verbose errors | Stack traces reveal internals |
| Permissive CORS | Quick fix to a browser error |
| Unneeded features enabled | Nobody removed them |
| Open cloud storage | See [AWS](/modules/10-01-aws-attack-paths/) |

**Fix it as a process.** Build a hardened baseline, apply it automatically through [infrastructure as code](/modules/10-07-iac-and-policy-as-code/), and scan for drift. Environments should be identical, except for their credentials.

### A08: Software or Data Integrity Failures

[A08:2025](https://top10.owasp.org/2025/A08_2025-Software_or_Data_Integrity_Failures/) is about trusting code or data with no proof of its integrity.

- Updates with no signature checks.
- Scripts loaded from a CDN with no [Subresource Integrity](/modules/04-01-browser-defences-and-csp/).
- [Insecure deserialization](/modules/04-09-deserialization/).
- Cookies or files that the client can alter and the server trusts.

The principle: verify before trusting. Sign what you ship, check what you receive, and don't let a client hold state that you haven't authenticated.

### A09: Logging and Alerting Failures

Renamed in 2025 to [Security Logging and Alerting Failures](https://top10.owasp.org/2025/A09_2025-Security_Logging_and_Alerting_Failures/), with the word *alerting* stressing that a log nobody reads protects nothing.

**What to log:** logins and failures, access control denials, input validation failures on sensitive routes, admin actions, and high-value transactions. Record who, what, when, where and the outcome.

**What not to log:** passwords, tokens, card numbers, or personal data beyond what's needed. Logs get wider access than production, so secrets there leak. Also encode log entries, so that user input can't fake lines, which is log injection.

**Then alert.** Lesson 58 covers detection engineering. Test by simulating an attack, as in [Purple teaming](/modules/08-03-purple-teaming/).

### A10: Mishandling of Exceptional Conditions

[A10:2025](https://top10.owasp.org/2025/A10_2025-Mishandling_of_Exceptional_Conditions/) is new. It covers code that behaves badly when something unexpected happens: an exception that's swallowed, a null, a timeout, a full disk, a failed dependency. Security assumptions often hold only on the happy path.

**The dangerous pattern is failing open.**

```python
try:
    allowed = auth_service.check(user)
except Exception:
    allowed = True        # the outage became a bypass
```

A check that can't complete must deny. Other cases: a transaction that half-completes, a lock not released, an error page that leaks data, or an attacker who triggers an exception on purpose, to skip a step.

### Advanced: patterns that help

| Pattern | Effect |
|---|---|
| Fail closed | Errors deny |
| Global exception handler | One safe error response |
| Transactions | All or nothing |
| Timeouts and retries with limits | Stops hangs |
| Fault injection tests | Shows real behaviour under failure |
| Chaos engineering | Tests resilience on purpose |

Test unhappy paths deliberately. Most test suites don't ask "what happens if the auth service is down?"

?? What does A10:2025 focus on?
+ Code failing unsafely when something goes wrong
- Encryption keys shorter than 128 bits long
- Browsers running very old versions of JavaScript
- Servers hosted outside of the customer's country
=> The category is about errors and unusual states, where checks may be skipped.

## Threat model

Misconfiguration is usually the easy way to [exploit a public application](https://attack.mitre.org/techniques/T1190/). Logging failures mean that attackers stay unseen for longer, and some will [impair logging](https://attack.mitre.org/techniques/T1562/002/) deliberately. Exceptional conditions give a deliberate path: an attacker sends malformed input precisely to reach a poorly tested error branch.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| CIS Benchmarks, OpenSCAP | Hardening baselines | Configuration |
| ZAP, Nuclei | Find exposed files and settings | Scanning |
| Semgrep | Finds empty `catch` blocks | Code review |
| Toxiproxy | Injects network faults | Testing failure |
| SIEM | Alerts | Logging |
| SRI and Sigstore | Integrity checks | Dependencies |

## Defence

- **Automate hardening,** and scan for drift.
- **Disable debug,** and remove sample apps.
- **Use generic errors for users,** and log detail on the server.
- **Sign and verify** code and updates.
- **Log security events,** and test that alerts fire.
- **Fail closed** in every authorisation path.
- **Review `catch` blocks** in security code.
- **Test failure modes,** on purpose.

## Pitfalls

- **Logging without alerting.**
- **Logging secrets by accident.** Check your debug statements.
- **Swallowing exceptions** to keep a build passing.
- **Different settings in staging and production.** Flaws hide in the difference.
- **Assuming that the framework's default is safe.**

?? What makes security logging fail in practice?
+ Events get recorded, yet nobody gets alerted
- Log files are usually far too short
- Alerts always contain the attacker's real name
- Servers can't write to a local disk
=> A log that no one sees doesn't help, which is why OWASP put alerting into the category's name.

## Exercise

::: law Lab only
Do this on your own app and VM.
:::

1. Run ZAP's baseline scan on your app, and fix each misconfiguration finding.
2. Turn off debug mode. Add a global error handler, and show that a stack trace no longer leaks.
3. Add SRI to one external script.
4. Log a failed login with who, when and where, without the password. Send it to your SIEM, and add an alert.
5. Write a test that makes your auth dependency raise an exception, and check that access is denied.
6. Use Semgrep to find empty `except` or `catch` blocks.

?! Take a production outage you've heard about. How could the same failure have become a security problem? Write the fail-closed design.

## Further reading

- [OWASP Top 10:2025](https://top10.owasp.org/2025/).
- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html).
- [OWASP Error Handling Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html).
- [NIST SP 800-92](https://csrc.nist.gov/pubs/sp/800/92/final).
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks).
