---
title: XSS in depth
summary: Why output encoding depends on context, how DOM XSS differs, what modern frameworks do and don't protect, and how to remove the class with safe sinks and Trusted Types.
level: intermediate
side: defence
minutes: 45
attack: T1059.007, T1185
needs: 0047-keeping-input-out-of-the-code, 04-01-browser-defences-and-csp
pair: 04-01-browser-defences-and-csp, 04-05-client-side-attacks
source: OWASP Cross Site Scripting Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
words: source and sink, output context, DOM XSS
---
Cross-site scripting has topped the CWE Top 25 for years. Its stakes are simple: script running in your origin can do anything that the user can, and read anything they can see. Lesson 47 taught "encode on output". This module explains why that isn't one rule but several, and why the strongest fixes work by removing dangerous APIs altogether.

@term output context = The place in a page where data lands, which decides how it must be encoded.
@term DOM XSS = Cross-site scripting that happens in client-side code, without the server's response containing the attack.
@term source and sink = Where untrusted data enters a program, and the dangerous function that it reaches.

## Concept

### Fundamentals: three flavours

| Type | Where the flaw is | Data stored? |
|---|---|---|
| Reflected | Server echoes input | No |
| Stored | Server keeps it, and serves it to others | Yes |
| DOM-based | Client-side JavaScript | Maybe never reaches the server |

Stored XSS is usually the worst, as every viewer gets it with no lure, including admins.

### Encoding depends on context

A browser runs several parsers: HTML, attributes, URLs, CSS, JavaScript. Each treats different characters as special.

| Context | Needs |
|---|---|
| HTML body | HTML entity encoding |
| Quoted attribute | Attribute encoding |
| URL parameter | Percent encoding, plus a check on the scheme |
| JavaScript value | Avoid it. Pass data through `data-` attributes or JSON |
| CSS | Avoid it |

So one encoding function isn't enough. HTML-encoding a value inside a `<script>` block does nothing useful. Equally, a value in an `href` needs its scheme checked, as a `javascript:` URL is an HTML-safe string, and it still runs. That's why auto-escaping template engines, which know their context, are much safer than manual encoding.

### DOM XSS

Here, the server may be innocent. A script reads from a **source** such as `location.hash`, and writes to a **sink**.

| Sources | Dangerous sinks |
|---|---|
| `location`, `document.referrer` | `innerHTML`, `outerHTML` |
| `postMessage` data | `document.write` |
| Stored client data | `eval`, `setTimeout` with a string |
| | `element.src`, `href` with user data |

Safe alternatives usually exist: `textContent` rather than `innerHTML`. Server-side scanners rarely see these flaws, because the traffic never reaches them.

### Frameworks

React, Vue and Angular escape by default, which removed a great deal of XSS. The danger is now in escape hatches.

| Framework | Escape hatch |
|---|---|
| React | `dangerouslySetInnerHTML` |
| Vue | `v-html` |
| Angular | `bypassSecurityTrustHtml` |

Dangerous URLs in attributes and server-rendered data blocks also need care.

### Advanced: rich content and impact

**When you must accept HTML,** such as in a comment editor, use a maintained sanitiser like [DOMPurify](https://github.com/cure53/DOMPurify), and keep it updated. Regex filters always fail. **Mutation XSS** shows why: browsers rewrite markup while parsing, so something that looks safe to a sanitiser can change after insertion.

**Trusted Types** make sinks reject plain strings, which is why Google reports them as a strong way of removing DOM XSS at scale. See [Browser defences](/modules/04-01-browser-defences-and-csp/).

**Impact isn't only `alert(1)`.** With script in your origin, an attacker can read pages, make authenticated requests, and bypass [CSRF tokens](/courses/0048-access-control-that-holds/). HttpOnly stops direct cookie theft, yet a script can simply act as the user. The [British Airways breach](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2020/10/ico-fines-british-airways-20m-for-data-breach-affecting-more-than-400-000-customers/) showed what a script on a payment page can do.

?? Why does XSS encoding depend on context?
+ Each output context parses data differently
- Browsers reject encoded data over HTTP
- Servers must encrypt data per user
- Databases store HTML in separate tables
=> A character that's harmless in HTML may be syntax inside a script or URL, so encoding has to match the parser.

## Threat model

Attackers use XSS to hijack sessions ([T1185](https://attack.mitre.org/techniques/T1185/)), run script ([T1059.007](https://attack.mitre.org/techniques/T1059/007/)), steal data, or plant phishing on a trusted domain. Stored XSS in an admin panel is the prize, for instance through a support ticket that an admin reads. Third-party scripts are XSS by consent: they run with full access.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| DOMPurify | Sanitises HTML | Rich text |
| ESLint security plugins | Flag dangerous sinks | Development |
| CodeQL, Semgrep | Trace sources to sinks | CI |
| CSP reports | Show blocked scripts | Production |
| Burp's DOM Invader | Tests DOM flows | Authorised tests, and labs |
| [Web Security Academy](https://portswigger.net/web-security/cross-site-scripting) | Free labs | Legal practice |

## Defence

- **Use a framework with auto-escaping,** and search for escape hatches.
- **Use safe DOM APIs:** `textContent`, `setAttribute` on safe attributes.
- **Allow-list URL schemes** for user-supplied links.
- **Sanitise rich HTML** with a maintained library, on output.
- **Enforce a strict CSP and Trusted Types.**
- **Set `HttpOnly` and `SameSite` on cookies.**
- **Limit third-party scripts,** and pin them with SRI.

**Detection.** CSP violation reports are a cheap sensor, and lesson 50 covered log patterns. Stored payloads may also appear in admin panels, so review those.

## Pitfalls

- **Input filtering as the fix.** What's safe depends on where it ends up.
- **Stripping `<script>`.** That's only one of many routes.
- **"React makes us immune."**
- **Encoding twice,** which garbles the output and invites hacks around it.
- **Treating self-XSS or admin-only XSS as harmless.** It can combine with CSRF.

?? What do Trusted Types protect?
+ Dangerous DOM sinks from plain strings
- Cookies from being read by JavaScript
- Uploads from containing hidden macro code
- Passwords from being stored in logs
=> Sinks accept only typed values from approved policies, so unsafe strings can't reach them by accident.

## Exercise

::: law Lab only
Use your own apps and PortSwigger's labs. Testing for XSS on live sites without permission can be illegal.
:::

1. Write a small page that puts a query value into `innerHTML`. Change it to `textContent`, and explain the difference.
2. In a template, place one value in a body, an attribute, a URL and a script block. Decide what each one needs.
3. Add DOMPurify to a comment box, and read its configuration options.
4. Enforce Trusted Types in report-only mode on your app, and fix what it flags.
5. Search one React project for `dangerouslySetInnerHTML`, and judge each use.
6. Complete three labs on Web Security Academy.

?! A team says "our CSP blocks inline scripts, so XSS isn't a concern". Write a reply explaining what's still at risk.

## Further reading

- [OWASP XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html).
- [OWASP DOM based XSS Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/DOM_based_XSS_Prevention_Cheat_Sheet.html).
- [Web Security Academy on XSS](https://portswigger.net/web-security/cross-site-scripting).
- [Trusted Types](https://web.dev/articles/trusted-types).
- [CWE-79](https://cwe.mitre.org/data/definitions/79.html).
