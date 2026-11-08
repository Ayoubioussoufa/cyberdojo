---
title: Browser defences and CSP
summary: The headers that turn a browser into your ally. Content Security Policy, HSTS, cookie settings, isolation headers and Trusted Types, and how to deploy them without breaking a site.
level: foundation
side: defence
minutes: 45
attack: T1185
needs: 0036-sessions-and-the-browser, 0047-keeping-input-out-of-the-code
pair: 04-04-xss-in-depth
source: MDN, Content Security Policy | https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP
words: Content Security Policy, HSTS, Subresource Integrity
---
Secure coding should stop a flaw from existing. Browser defences assume that one got through anyway, and they limit what it can do. A handful of response headers can turn a serious bug into a blocked request, and they cost almost nothing to send. The hard part is deploying them on a real site without breaking it.

@term Content Security Policy = A response header telling the browser which sources of content a page may use.
@term HSTS (HTTP Strict Transport Security) = A header telling browsers to use only HTTPS for a site.
@term Subresource Integrity = A hash on a script or stylesheet tag, so that a browser rejects it if the file changes.
@term nonce-based CSP = A policy that lets only scripts carrying a fresh, per-response random value run.

## Concept

### Fundamentals: the header toolbox

| Header | Stops |
|---|---|
| `Content-Security-Policy` | Unapproved scripts and content |
| `Strict-Transport-Security` | HTTP downgrade |
| `X-Content-Type-Options: nosniff` | Browsers guessing content types |
| `Referrer-Policy` | URL leakage to other sites |
| `Permissions-Policy` | Unneeded browser features |
| `Cross-Origin-Opener-Policy` | Window-reference attacks |
| `Cross-Origin-Resource-Policy` | Other sites loading your resources |
| `Set-Cookie` flags | Theft and cross-site sending |

### CSP

CSP states what a page may load. Early policies listed trusted hosts.

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example
```

This approach has a known weakness. [Google research](https://research.google/pubs/csp-is-dead-long-live-csp-on-the-insecurity-of-whitelists-and-the-future-of-content-security-policy/) found that most allow-list policies could be bypassed, because allowed hosts often serve something usable, such as a JSONP endpoint.

A **strict CSP** is the current recommendation: each page gets a fresh random nonce, and only tags carrying it can run.

```
Content-Security-Policy:
  script-src 'nonce-R4nd0m' 'strict-dynamic';
  object-src 'none';
  base-uri 'none'
```

`strict-dynamic` lets a trusted script load others. `object-src` and `base-uri` close old side doors. Never use `unsafe-inline` for scripts, as it removes most of the protection.

### HSTS

Once a browser sees HSTS, it refuses plain HTTP for that site, for as long as the header says. The first visit remains exposed, so the **preload list** ships your domain in browsers themselves. Be careful: it's hard to undo, and it applies to subdomains.

### Advanced: Trusted Types and isolation

**Trusted Types** tackle DOM XSS at the root. When enforced, dangerous sinks such as `innerHTML` refuse plain strings, and accept only values produced by a named policy. So all risky assignments pass through one reviewable place.

```
Content-Security-Policy: require-trusted-types-for 'script'
```

**Cross-origin isolation** came after [Spectre](/modules/15-05-microarchitectural-attacks/). `COOP` and `COEP` place a page in its own process group, which also unlocks powerful features such as `SharedArrayBuffer`.

**Subresource Integrity** pins third-party scripts by hash, so that a compromised CDN can't change them unnoticed. That's relevant for the [Magecart-style](/modules/12-06-sector-compliance/) skimming that PCI DSS now addresses.

**Reporting.** CSP has a **report-only** mode, and that's what makes deployment safe. Violations are sent to an endpoint that you choose, so you see what would break, and you may even see real attacks.

?? What does a strict CSP mainly limit?
+ Which scripts the browser may run
- Which users may log on today
- Which databases the server may use
- Which cookies the server may set
=> It's a browser-side rule on what code a page can run, so injected scripts without the nonce don't execute.

## Threat model

These headers don't stop a server-side flaw. They reduce the effect of client-side ones, such as stored XSS leading to [browser session hijacking](https://attack.mitre.org/techniques/T1185/). Attackers look for gaps: `unsafe-inline`, wildcards, missing `object-src`, or a page with no policy on the same origin.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Browser developer tools | Show headers and CSP errors | Daily use |
| [CSP Evaluator](https://csp-evaluator.withgoogle.com/) | Reviews a policy | Before deploying |
| [Mozilla Observatory](https://developer.mozilla.org/en-US/observatory) | Grades your headers | A quick check |
| securityheaders.com | Same | Public sites |
| Report endpoint | Collects violations | Rolling out CSP |

## Defence

1. **Start in report-only mode** with a strict policy.
2. **Collect reports** for a few weeks, and fix what they show.
3. **Add nonces** through your template layer.
4. **Enforce it,** and keep the reporting on.
5. **Add HSTS,** starting with a short `max-age`.
6. **Set cookies** with `Secure`, `HttpOnly`, `SameSite=Lax` or `Strict`, and the `__Host-` prefix.
7. **Pin third-party scripts** with SRI, or self-host them.

## Pitfalls

- **`unsafe-inline` to make it work.** The policy then stops very little.
- **A static nonce.** It must change per response.
- **Allow-listing a big CDN.** Anyone's file there may be usable.
- **Forgetting error pages.** Each response needs headers.
- **Treating CSP as your XSS fix.** It's a safety net.
- **HSTS on a domain whose subdomains aren't ready for HTTPS.**

?? Why prefer nonces over host allow-lists in CSP?
+ Allowed hosts can still serve abusable scripts
- Nonces make every page load much faster
- Browsers ignore host lists on HTTPS sites
- Allow-lists can't contain more than one entry
=> Trusting a whole host trusts everything on it. A nonce trusts only the tags that you generated for this response.

## Exercise

::: law Lab only
Test your own site or a local app. Reading a public site's response headers is fine, but don't probe it further.
:::

1. Run a small Flask app. Check its headers using `curl -I`.
2. Add a strict CSP in report-only mode, with a report endpoint. Load the page, and read the reports.
3. Add a per-request nonce to your template, then enforce the policy.
4. Add an inline script without a nonce, and confirm that it's blocked in the console.
5. Run your policy through CSP Evaluator.
6. Add SRI to one third-party script, and change a byte to see it fail.

?! A marketing team wants to add five third-party tags to your payment page. Write how CSP and SRI would change that conversation.

## Further reading

- [MDN on CSP](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP).
- [Strict CSP guide](https://web.dev/articles/strict-csp).
- [Trusted Types](https://web.dev/articles/trusted-types).
- [OWASP HTTP Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html).
- [HSTS preload](https://hstspreload.org/).
