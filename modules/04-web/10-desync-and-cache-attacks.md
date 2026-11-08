---
title: HTTP desync and cache security
summary: When two servers disagree about one request. Why request smuggling exists, how web caches can be poisoned or tricked, and the architecture choices that close both.
level: advanced
side: defence
minutes: 40
attack: T1190
needs: 0035-how-the-web-works, 01-03-tcp-internals
pair: 04-11-logic-flaws-and-races
source: PortSwigger Research, HTTP Desync Attacks | https://portswigger.net/research/http-desync-attacks-request-smuggling-reborn
words: request smuggling, cache key, web cache deception
---
A modern request passes through a CDN, a load balancer and an application server. Each one parses HTTP on its own, so any disagreement between them becomes a security issue. This class of flaw lives between systems, which is why ordinary code review won't find it. James Kettle's research made it mainstream, and his PortSwigger papers are the primary reading.

@term request smuggling = Sending a request that a front-end and a back-end server parse differently, so that part of it is treated as a separate request.
@term cache key = The parts of a request that a cache uses to decide whether two requests are the same.
@term web cache poisoning = Getting a cache to store a harmful response, then serve it to other users.
@term web cache deception = Tricking a cache into storing another user's private page.

## Concept

### Fundamentals: where a request ends

HTTP/1.1 sends requests one after another on a shared connection, and offers two ways of saying where each one ends: `Content-Length` and `Transfer-Encoding`. To save resources, front-ends reuse connections to back-ends, so that requests from different users share one stream.

If the two servers disagree on the boundary, some bytes that the front-end saw as part of one request get read by the back-end as the start of the next. That next request may belong to someone else. That's **request smuggling**, also called HTTP desync. The consequences include bypassing front-end security rules, and mixing one user's response with another's.

[RFC 9112](https://www.rfc-editor.org/rfc/rfc9112) says how to handle a message with both headers, yet real software has differed on details such as whitespace and obfuscated headers.

### HTTP/2 doesn't end this

HTTP/2 frames messages by length, so it has no such ambiguity, *end to end*. The danger is **downgrade**: a front-end speaks HTTP/2 to clients, then rewrites to HTTP/1.1 for the back-end. That translation can reintroduce the problem. Kettle's [HTTP/2 research](https://portswigger.net/research/http2) documented this, and his 2025 work argued that [HTTP/1.1 must die](https://portswigger.net/research/http1-must-die), because such ambiguity keeps recurring upstream.

### Caches

A cache stores a response and reuses it for requests with the same **cache key**, usually method, host and path.

Two different problems can follow.

**Cache poisoning.** Inputs that aren't in the key, but still affect the response, are called *unkeyed*. If a header changes the page, yet isn't part of the key, a response shaped by one person's header may be served to everybody. [Practical Web Cache Poisoning](https://portswigger.net/research/practical-web-cache-poisoning) explored this.

**Cache deception.** Here, the cache and the application disagree on what a URL is. A cache may store anything that looks like a static file, whereas the application may ignore the suffix and return a user's private page. A later visitor can then fetch that cached private page. [Omer Gil](https://omergil.blogspot.com/2017/02/web-cache-deception-attack.html) described this in 2017.

### Advanced: thinking in parsers

These are all **parser differentials**, the same family as [SAML flaws](/modules/11-04-saml-attacks/) and [SSRF filter bypasses](/modules/04-07-ssrf-in-depth/). Whenever two components read the same bytes, ask: do they agree? The defence is to reduce the number of parsers, normalise at the edge, and reject ambiguity instead of guessing.

?? What causes request smuggling?
+ Two servers disagree on where requests end
- Browsers send cookies over an old protocol
- Caches keep pages for too many days
- Clients use the wrong TLS certificate chain
=> The boundary is ambiguous, so bytes meant for one request get treated as the start of another.

## Threat model

Attackers probe public sites with [application exploits](https://attack.mitre.org/techniques/T1190/), using timing differences to find a desync. Impact can reach all users of a site, since shared connections and shared caches sit in front of them. Cache flaws can spread a stored attack quickly, as one poisoned response serves thousands.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| HTTP Request Smuggler (Burp) | Detects desync | Authorised tests, labs |
| Param Miner (Burp) | Finds unkeyed inputs | Authorised tests, labs |
| CDN logs | Show cache hits and keys | Investigating |
| `curl -v` | Shows cache headers | Checking your own site |
| [Web Security Academy](https://portswigger.net/web-security/request-smuggling) | Free labs | Legal practice |

## Defence

**Desync:**

- Use HTTP/2 or HTTP/3 end to end, including to back-ends.
- Avoid downgrading to HTTP/1.1 where you can.
- Have the front-end normalise requests, and reject ambiguous ones.
- Disable back-end connection reuse if you can't fix the mismatch.
- Keep proxies and servers patched, and use the same parsing rules.

**Caches:**

- Cache only what you intended: mark private pages with `Cache-Control: private` or `no-store`.
- Cache by content type, not by file extension.
- Include in the key every input that changes a response, or drop those inputs.
- Don't reflect unvalidated headers such as `X-Forwarded-Host`.
- Separate static assets onto their own host.

**Detection.** Watch for unexpected 400s or timeouts from back-ends, requests with both length headers, and private content cached on a CDN.

## Pitfalls

- **"We use HTTP/2."** Only at the edge, perhaps.
- **Testing on production carelessly.** Desync probes can affect real users' responses, so test in a safe environment.
- **Trusting a WAF in front.** The WAF may be one of the parsers that disagrees.
- **Caching authenticated pages by path.**
- **Assuming the CDN handles it.** Its defaults may not match your app.

?? What's an unkeyed input?
+ Data that changes responses, but not keys
- A password field with no form label
- A header the browser forgets to send
- A cookie encrypted without any session key
=> The cache treats two different requests as identical, so one response can be served for both.

## Exercise

::: law Lab only
Use PortSwigger's labs, or your own proxy and app in Docker. Don't probe live sites: desync testing can disturb other users' traffic.
:::

1. Run Nginx with caching in front of a small app. Read the `X-Cache` header on two requests.
2. Make the app reflect `X-Forwarded-Host` in a link, cache the page, and see what the next visitor gets. Then fix it.
3. Add a private page, and try fetching it with a fake `.css` suffix. Fix that with `Cache-Control`.
4. Read the first section of "HTTP Desync Attacks", and draw how two servers split one stream.
5. Complete one lab each on request smuggling and cache poisoning.

?! You run a site behind a CDN. List which headers and settings you'd review to reduce both of these risks.

## Further reading

- [HTTP Desync Attacks](https://portswigger.net/research/http-desync-attacks-request-smuggling-reborn).
- [HTTP/1.1 Must Die](https://portswigger.net/research/http1-must-die).
- [Practical Web Cache Poisoning](https://portswigger.net/research/practical-web-cache-poisoning).
- [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112), HTTP/1.1.
- [Web Security Academy on web cache poisoning](https://portswigger.net/web-security/web-cache-poisoning).
