---
title: Client-side web security
summary: Beyond XSS. Clickjacking, open redirects, postMessage, WebSockets and prototype pollution, each with the browser behaviour behind it and the simple check that closes it.
level: intermediate
side: defence
minutes: 40
attack: T1185
needs: 0036-sessions-and-the-browser, 04-04-xss-in-depth
pair: 04-04-xss-in-depth
source: Web Security Academy, Client-side topics | https://portswigger.net/web-security/all-topics
words: clickjacking, open redirect, prototype pollution
---
A growing share of application logic runs in the browser, so it has grown its own family of flaws. Each one comes from the same idea: the browser did exactly what it was told, by someone who shouldn't have been able to tell it. Most fixes here are short, once you know where to look.

@term clickjacking = Tricking a user into clicking something on a hidden page, layered under a visible one.
@term open redirect = An endpoint that sends users to any address given in a parameter.
@term prototype pollution = Changing a JavaScript object's prototype, which alters the behaviour of other objects.
@term WebSocket = A protocol that gives a long-lived, two-way connection between a browser and a server.

## Concept

### Fundamentals: the same-origin policy's edges

Lesson 36 taught the same-origin policy. These flaws sit at its edges, in places where it allows something by design: framing other sites, navigating to anywhere, sending cross-document messages, and opening cross-site sockets.

### Clickjacking

A page can load another inside a transparent frame. The victim thinks they're clicking one thing, and they're really clicking your "delete account" button underneath. The attack needs no script in your page.

The fix is to refuse to be framed.

```
Content-Security-Policy: frame-ancestors 'none'
X-Frame-Options: DENY
```

`SameSite` cookies add a second layer, because a framed cross-site page won't carry the session.

### Open redirects

An endpoint such as `/go?url=` that sends users anywhere gives phishers your trusted domain in a link. It also helps in chains: [OAuth redirect checks](/modules/11-03-oauth-attacks/) and [SSRF filters](/modules/04-07-ssrf-in-depth/) can be defeated by one.

**Fix:** map short IDs to fixed destinations, or allow only relative paths on your own site. Parsing URLs by hand is unreliable, so use a proper URL parser, and compare the host with an allow-list.

### postMessage

`window.postMessage` lets documents from different origins talk. It's a deliberate hole, so both ends must be careful.

```javascript
window.addEventListener("message", (e) => {
  if (e.origin !== "https://app.example") return;   // always check
  render(e.data);                                   // and treat as untrusted
});
```

When sending, name the target origin instead of `*`. When receiving, check `event.origin`, and validate the data. A handler that writes into `innerHTML` turns this into [DOM XSS](/modules/04-04-xss-in-depth/).

### WebSockets

A WebSocket starts as an HTTP upgrade, with cookies attached, and then stays open. Browsers don't apply the same-origin policy to the handshake. So a server must check the `Origin` header, or a malicious site may open a socket with the user's cookies, known as cross-site WebSocket hijacking. It's CSRF with a two-way channel. Authenticate at connect time, authorise each message, and rate limit too.

### Advanced: prototype pollution

In JavaScript, objects inherit from `Object.prototype`. If code recursively merges user-supplied JSON into an object, a key such as `__proto__` can change the prototype that all objects share. Later code reading an unset property then sees the polluted value. In the browser, this can lead to XSS, and on the server in Node.js, it may affect logic or reach code execution, depending on what reads the value.

**Fix:** use `Map`, or `Object.create(null)`, for dictionaries, block `__proto__`, `constructor` and `prototype` keys, keep merge libraries updated, and validate input against a schema. `Object.freeze(Object.prototype)` is a strong hardening step, where your dependencies allow it.

?? What stops clickjacking?
+ Refusing to be framed by other sites
- Encrypting every button on the sign-in page
- Renaming each form field on every request
- Compressing the page's scripts before sending them
=> `frame-ancestors` tells the browser not to render your page inside another site, which removes the overlay.

## Threat model

Attackers use these flaws to act as the user in their [browser session](https://attack.mitre.org/techniques/T1185/), to phish through a trusted domain, or to chain into bigger bugs. Rich single-page apps and embedded widgets increase the surface, as do third-party scripts that add their own `message` listeners.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Browser developer tools | Show listeners and frames | Reviewing a page |
| ESLint plugins | Flag missing origin checks | Development |
| Burp DOM Invader | Tests message handlers and pollution | Authorised tests |
| `npm audit`, Snyk | Find vulnerable merge libraries | Dependencies |
| CSP Evaluator | Checks `frame-ancestors` | Header review |

## Defence

- **Send `frame-ancestors 'none'`** unless framing is a feature.
- **Avoid redirects driven by user input.**
- **Check `event.origin`,** and treat message data as untrusted.
- **Validate `Origin` on WebSocket upgrades,** and authorise each message.
- **Use `Map` for user-controlled keys,** and block prototype keys.
- **Set `SameSite`** on session cookies.
- **Add confirmation steps** for sensitive actions.

## Pitfalls

- **Checking origin with `indexOf` or `endsWith`.** `app.example.evil.com` may pass a naive check.
- **`postMessage(data, "*")`.** It sends data to whoever is there.
- **Treating open redirects as low risk.** They're often part of a chain.
- **Authorising a WebSocket once.** Permissions can change during a long connection.
- **Assuming JSON is safe to merge.** `__proto__` arrives through JSON too.

?? Why must a `postMessage` handler check `event.origin`?
+ Any window may send it a message
- Browsers delete messages that lack a hash
- Only servers can read the message body
- Messages are otherwise sent without any encryption
=> Without the check, a page that you never intended to trust can drive your handler.

## Exercise

::: law Lab only
Use your own pages on localhost, or PortSwigger's labs. Don't test real sites.
:::

1. Serve a page on two local ports, and try to frame one from the other. Add `frame-ancestors`, and confirm that it's blocked.
2. Write a redirect endpoint. Fix it with an allow-list, and test some tricky URLs with your URL parser.
3. Build a `postMessage` handler, first without an origin check. Show the difference from a second origin, then fix it.
4. In Node.js, write a recursive merge. Show that `{"__proto__": {"x": 1}}` affects a new object in a test, then fix it.
5. Add an `Origin` check to a local WebSocket server.

?! Choose one flaw from this module that you'd call "low severity" alone. Describe how it could join a chain to become serious.

## Further reading

- [OWASP Clickjacking Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Clickjacking_Defense_Cheat_Sheet.html).
- [OWASP Unvalidated Redirects Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html).
- [OWASP Prototype Pollution Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Prototype_Pollution_Prevention_Cheat_Sheet.html).
- [MDN on postMessage](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).
- [OWASP WebSocket Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/WebSocket_Security_Cheat_Sheet.html).
