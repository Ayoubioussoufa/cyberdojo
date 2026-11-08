---
title: SSRF in depth
summary: When your server makes requests for an attacker. Why filters fail, why cloud metadata raised the stakes, and the network-level design that makes the class far less dangerous.
level: advanced
side: defence
minutes: 45
attack: T1190, T1552.005
needs: 0049-apis-uploads-and-outbound-requests, 01-05-dns-in-depth
pair: 10-01-aws-attack-paths, 11-01-formal-access-models
source: OWASP SSRF Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html
words: SSRF, egress proxy, blind SSRF
---
A server sits inside your network, with access that outsiders lack. If an attacker can make it send a request of their choosing, they borrow that position. It's a [confused deputy](/modules/11-01-formal-access-models/) over HTTP. OWASP folded SSRF into Broken Access Control in 2025, and CWE ranks it in the Top 25. Lesson 49 gave you the idea. Now for why it's hard to fix at the application layer.

@term blind SSRF = SSRF in which the attacker doesn't see the response, and must infer results.
@term egress proxy = A controlled outbound gateway through which a service must send its requests.

## Concept

### Fundamentals: where it comes from

Any feature that fetches a URL can be a door: webhooks, link previews, image import, PDF generators, single sign-on metadata and file converters. Some don't look like URL features at all. A PDF renderer fetches images, and an [XML parser](/modules/04-03-injection-beyond-sql/) can fetch external entities.

| Target of the borrowed position | Why it's valuable |
|---|---|
| Cloud metadata service | Temporary credentials |
| Internal admin panels | Often no authentication |
| `localhost` services | Trust local callers |
| Internal networks | Reconnaissance |
| Other protocols | Some client libraries speak more than HTTP |

### Why cloud raised the stakes

Metadata endpoints answer without authentication to anything on the instance. So an SSRF might return cloud credentials, turning a small web bug into cloud account access, as in the 2019 [Capital One](/modules/10-01-aws-attack-paths/) case. **IMDSv2** requires a `PUT` to get a session token, with a hop limit, which blocks most simple SSRF. Google requires a header, `Metadata-Flavor: Google`, and Azure a header too.

### Why filters fail

Block-lists don't work, since one address has many spellings, and validation can differ from use.

| Failure | Why |
|---|---|
| Alternative encodings | An IP can be written in decimal, octal, IPv6 and more |
| Redirects | An allowed host sends the client elsewhere |
| DNS rebinding | A name resolves differently at check and at use |
| Parser differences | The validator and client read the URL differently |
| Open redirects | A trusted domain [forwards you anywhere](/modules/04-05-client-side-attacks/) |

[Orange Tsai's research](https://blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf) showed how differences between URL parsers can undo filters. The lesson: validating a string isn't validating a connection.

### Advanced: defence by design

Effective defence is layered, and the strongest layers aren't in the application.

1. **Don't take a URL at all,** where you can. Accept an ID that maps to a known destination.
2. **Allow-list** domains and schemes, if a URL is needed. Permit only `https`.
3. **Resolve, check, then connect to that same IP.** This stops rebinding. Reject private, loopback and link-local ranges, after resolving.
4. **Disable redirects,** or check each hop.
5. **Isolate the fetcher.** Run URL fetching in a separate service, with no credentials, and in its own network segment.
6. **Force egress through a proxy.** An **egress proxy** enforces the allow-list outside your application, so that a bug in the app can't bypass it. Tools like [smokescreen](https://github.com/stripe/smokescreen) exist for this.
7. **Protect internal services.** Require authentication on them, so that being "inside" means nothing, in line with [Zero Trust](/modules/07-07-zero-trust-in-depth/).

For **blind SSRF**, nothing returns to the attacker, yet internal services can still be hit. Treat it as serious.

?? Why do block-lists fail against SSRF?
+ Addresses have many forms and redirects exist
- Block-lists can only ever hold IPv6 addresses
- Servers can't read the requested URL string
- Firewalls always remove them after each reboot
=> An attacker needs one spelling or hop that the list misses, whereas a defender would have to foresee them all.

## Threat model

SSRF is often used to [exploit a public application](https://attack.mitre.org/techniques/T1190/), and then to [reach the metadata API](https://attack.mitre.org/techniques/T1552/005/). In microservice systems, one fetcher may reach many internal APIs. CWE-918 is in the Top 25, and attackers scan for webhooks and import features.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| smokescreen | Egress proxy | Controlling fetchers |
| Semgrep, CodeQL | Trace URLs into HTTP clients | Review |
| VPC Flow Logs | Show server egress | Detection |
| GuardDuty | Flags credential misuse | Cloud detection |
| Burp Collaborator | Finds blind flaws | Authorised tests, and labs |
| [Web Security Academy](https://portswigger.net/web-security/ssrf) | Free labs | Legal practice |

## Defence

- **Enforce IMDSv2,** and block metadata from containers.
- **Deny all egress by default** on servers.
- **Route required outbound traffic through a proxy** with an allow-list.
- **Authenticate internal services.**
- **Use a dedicated, low-privilege fetcher.**
- **Apply the design steps above** in any fetch feature.

**Detection.** Watch for web servers contacting `169.254.169.254`, or making requests to internal ranges, and for metadata credentials used outside your network.

## Pitfalls

- **Validating before DNS resolution only.**
- **Forgetting IPv6 and redirects.**
- **Blocking only `localhost`.** Internal ranges and link-local addresses matter.
- **Assuming internal means safe.**
- **Treating blind SSRF as harmless.**

?? Which design stops SSRF reaching internal systems?
+ An egress proxy with a strict allow-list
- A longer session timeout for all users
- A stronger password on the web server
- A cookie flagged as HttpOnly and Secure
=> Enforcement sits outside the application, so a bug in URL handling can't reach what the proxy refuses.

## Exercise

::: law Lab only
Use your own local services, and PortSwigger's labs. Don't try to reach metadata or internal systems on anyone else's server.
:::

1. Build a small "preview a URL" endpoint in a VM, with a fake metadata service on `localhost`.
2. Add a block-list, and try alternative spellings of the address in your own tests. Note which get through.
3. Replace it with resolve-then-pin, and an allow-list.
4. Put `smokescreen` in front of the fetcher, and deny all else.
5. In your AWS lab, enforce IMDSv2, and show what changes.
6. Complete two SSRF labs on Web Security Academy.

?! Your product needs a webhook feature that lets customers enter any URL. Design it so that an SSRF can't hurt you.

## Further reading

- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html).
- [CWE-918](https://cwe.mitre.org/data/definitions/918.html).
- [A New Era of SSRF](https://blackhat.com/docs/us-17/thursday/us-17-Tsai-A-New-Era-Of-SSRF-Exploiting-URL-Parser-In-Trending-Programming-Languages.pdf).
- [AWS on IMDSv2](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html).
- [Web Security Academy on SSRF](https://portswigger.net/web-security/ssrf).
