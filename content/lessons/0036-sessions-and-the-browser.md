---
title: Sessions, cookies and browser security
summary: How sites remember you, how the same-origin policy protects you, and what CORS actually does.
month: 6
minutes: 35
builds: set secure cookie flags and explain the same-origin policy
source: MDN, Same-origin policy | https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy
words: session, same-origin policy, JWT
---
HTTP has no memory. Each request stands alone, so how does a site know you're still logged in? The answer creates a whole class of attacks, and the browser has built-in rules to contain them.

@term session = A server-side record of a logged-in user, tied to the browser by a token.
@term session ID = The random value that identifies a session, usually stored in a cookie.
@term JWT (JSON Web Token) = A signed token carrying claims about a user.
@term same-origin policy = The browser rule stopping one site's scripts from reading another site's data.
@term origin = The combination of scheme, host and port that defines a site to a browser.
@term CORS (cross-origin resource sharing) = A way for a server to let specific other origins read its responses.
@term XSS (cross-site scripting) = Injecting script into a page so it runs in other users' browsers.
@term CSRF (cross-site request forgery) = Tricking a logged-in browser into sending a request the user didn't intend.

## Sessions

1. You log in, and the server creates a **session** and generates a long random **session ID**.
2. The server sends it in a `Set-Cookie` header.
3. Your browser attaches it to every later request to that site.

@flow Login > Set-Cookie: session=x7f... > Browser stores it > Cookie sent on every request

So that cookie **is** your login. Whoever holds it is you, with no password needed. Protecting it is the point of everything below.

?? Why is a session cookie so valuable?
+ Whoever holds it is logged in
- It contains the user's real password
- It can only be used once
- It stores the server's private key
=> The cookie stands in for the login, so stealing it skips the password.

## Cookie flags

```http
Set-Cookie: session=x7f3k9...; HttpOnly; Secure; SameSite=Lax; Path=/
```

| Flag | Effect | Blocks |
|---|---|---|
| `HttpOnly` | JavaScript can't read the cookie | Theft through XSS |
| `Secure` | Sent over HTTPS only | Theft on the network |
| `SameSite=Lax` or `Strict` | Not sent on most cross-site requests | Much of CSRF |

The [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) adds more: regenerate the ID at login, and expire sessions.

?? An attacker can run JavaScript on your site through a flaw. Which flag stops that script from reading the session cookie?
+ `HttpOnly`, which hides it from scripts
- `Secure`, which hides it from scripts
- `SameSite`, which hides it from scripts
- `Path`, which hides it from scripts
=> `HttpOnly` removes the cookie from `document.cookie`. It doesn't fix the XSS, but it limits the harm.

## Sessions vs tokens

| | Server session | JWT |
|---|---|---|
| Where's the state? | On the server | Inside the signed token |
| Revoking it | Delete the record | Hard until it expires |
| Risk | Session store is a target | Bad signature checks, tokens that live too long |

A **JWT** has three parts, `header.payload.signature`, each Base64URL-encoded. **The payload isn't encrypted**: anyone can read it. Paste one into [jwt.io](https://jwt.io/). The signature only proves it hasn't been changed. The rules are in [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519).

?? Is a JWT's payload secret?
+ No, anyone can read it
- Yes, it's always strongly encrypted
- Yes, only browsers read it
- No, it's never sent anywhere
=> It's only encoded. The signature proves that it wasn't changed.

## Same-origin policy

Imagine you're logged in to your bank, and you open `evil.example` in another tab. Why can't its JavaScript read your balance?

Because of the [same-origin policy](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy). Scripts can only read responses from their own **origin**: scheme, host and port must all match.

| URL | Same origin as `https://shop.example`? |
|---|---|
| `https://shop.example/cart` | Yes |
| `http://shop.example` | No: scheme differs |
| `https://api.shop.example` | No: host differs |
| `https://shop.example:8443` | No: port differs |

::: trap The policy stops reading, not sending
A page on `evil.example` can still **send** a request to your bank, and your browser may attach the cookie. It just can't read the reply. That gap is what CSRF exploits, and `SameSite` cookies narrow it.
:::

?? Do `https://api.shop.example` and `https://shop.example` share an origin?
+ No, because the host differs
- Yes, because both use HTTPS
- Yes, because they share domains
- No, because the port differs
=> Scheme, host and port must all match exactly.

## CORS

Sometimes a front end on `app.example` legitimately needs an API on `api.example`. **CORS** lets a server relax the policy:

```http
Access-Control-Allow-Origin: https://app.example
Access-Control-Allow-Credentials: true
```

CORS never adds protection: it only loosens the default. The classic bug is a server that reflects whatever `Origin` it's sent while allowing credentials. Then any site can read logged-in users' data. Details on [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

?? Which statement about CORS is correct?
+ It relaxes the same-origin policy for chosen origins
- It stops other websites from sending any requests
- It encrypts all responses between two different origins
- It replaces the need for authentication on APIs
=> The default is that scripts can't read cross-origin responses. CORS is the server saying who may. Misconfiguring it opens data up.

?! A stolen session cookie lets an attacker in without a password. List three protections that reduce that risk, and how each helps.
