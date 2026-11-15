---
title: Sessions, cookies and browser security
summary: How sites remember you, how the same-origin policy protects you, and what CORS actually does.
month: 6
minutes: 60
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

@seq Browser | Server
Browser > Server: Log in with a password
Server > Browser: Set-Cookie: session=x7f...
Browser > Server: Next request, with the cookie
Server > Browser: I know this session: it's you

So that cookie **is** your login. Whoever holds it is you, with no password needed. Protecting it is the point of everything below.

Look at your own. Log in to any site, press F12, and open **Application → Cookies** in Chrome or **Storage → Cookies** in Firefox. Each row is one cookie, with its name, its value and a column for each flag you'll meet in the next section. Then type `document.cookie` in the **Console** tab. You'll see fewer cookies than in the table: the missing ones are hidden from scripts on purpose.

From the terminal, `curl` can keep cookies in a file the way a browser keeps them in memory:

```
curl -i -c jar.txt https://httpbin.org/cookies/set/session/abc123     save what the server sets
curl -b jar.txt https://httpbin.org/cookies                           send it back
```

The first response contains a `Set-Cookie` line, and the second request carries a `Cookie` line with the same value. That exchange, repeated on every click, is all that "being logged in" means.

Because the ID is the login, it has to be impossible to guess. A good one comes from a cryptographic random source and is long: in Python, `secrets.token_urlsafe(32)` gives 43 random characters. An ID that counts upwards, or that's built from the username and the time, can be predicted, and then nobody needs to steal it. Three more rules complete the picture: issue a fresh ID at login so that one planted before login is worthless, expire sessions after a period of no use, and delete the server's record at logout so the cookie stops working even if someone kept a copy.

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

The flags are just words in a header, so a program can check them. Scanners that grade a site's cookies do exactly what you're about to write.

@code missing-cookie-flags

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

Prove it to yourself. This is a complete token:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmEiLCJyb2xlIjoidXNlciIsImV4cCI6MTc5NDAwMDAwMH0.c2lnbmF0dXJl
```

Split it at the dots and Base64-decode the middle part, and you get `{"sub":"ana","role":"user","exp":1794000000}`: who the token is for, a role, and an expiry time in seconds since 1970. No key was needed. So two rules follow. Never put anything secret in a JWT. And the server must check the signature on every request, because anyone can also write a payload that says `"role":"admin"`, and the signature is the only thing that shows the server didn't issue it.

Base64URL drops the `=` padding that normal Base64 puts at the end, so a decoder has to add it back until the length is a multiple of four.

@code jwt-payload

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

The comparison is mechanical, which means you can write it. One detail matters: a URL with no port uses the default for its scheme, so `https://shop.example` and `https://shop.example:443` are the same origin.

@code same-origin

::: trap The policy stops reading, not sending
A page on `evil.example` can still **send** a request to your bank, and your browser may attach the cookie. It just can't read the reply. That gap is what CSRF exploits, and `SameSite` cookies narrow it.
:::

Here is CSRF step by step, because it explains why the flags exist. You're logged in to your bank. In another tab you open a page that contains a hidden form addressed to the bank's transfer URL, and a script submits it. Your browser sends the request, and it attaches the bank's cookie because the request goes to the bank. The bank sees a valid session and a valid transfer. The attacker never saw your cookie and never read a reply.

Two defences close it. `SameSite=Lax` tells the browser not to attach the cookie to that kind of cross-site request. A **CSRF token** is a second random value that the bank puts in its own forms and checks on every change: the other site can't read the bank's pages, so it can't know the token.

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

You can test your own API for that bug in one line. Send an origin you made up, and read what comes back:

```
curl -i -H "Origin: https://not-my-site.example" https://api.example/profile
```

If the response says `Access-Control-Allow-Origin: https://not-my-site.example` together with `Access-Control-Allow-Credentials: true`, the server trusts everyone. A correct server answers with one of the origins on its own fixed list, or with no CORS header at all.

?? Which statement about CORS is correct?
+ It relaxes the same-origin policy for chosen origins
- It stops other websites from sending any requests
- It encrypts all responses between two different origins
- It replaces the need for authentication on APIs
=> The default is that scripts can't read cross-origin responses. CORS is the server saying who may. Misconfiguring it opens data up.

## Audit a login response

This is what one site sends back after a successful login. Read it as a reviewer would.

```http
HTTP/1.1 200 OK
Set-Cookie: session=1042; Path=/
Access-Control-Allow-Origin: https://not-my-site.example
Access-Control-Allow-Credentials: true
```

?? Which weakness can you see in the session ID itself?
+ It's short and resembles a counter
- It's sent in a header line
- It's set for the whole site
- It's returned with a 200 status
=> `1042` suggests the previous user got 1041. An ID must be long and random, or an attacker can simply try the neighbouring numbers.

?? The `Set-Cookie` line has no `Secure` flag. What does that allow?
+ The cookie can travel over plain HTTP
- The cookie can be read by scripts
- The cookie can never expire at all
- The cookie can be sent across sites
=> Without `Secure`, the browser also sends the cookie on unencrypted requests, where anyone on the network path can copy it. Reading by scripts is what `HttpOnly` controls.

?? A user edits their JWT payload from `"role":"user"` to `"role":"admin"`. What stops this working?
+ The server checks the signature every time
- The payload is encrypted with a key
- The browser refuses to send edited tokens
- The token is too long to edit
=> Anyone can read and rewrite the payload. The signature no longer matches the new content, so a server that verifies it rejects the token. A server that skips the check accepts it.

::: try Inspect a real session
1. Log in to a site you use, open the cookie table in DevTools, and find the session cookie. Note which of `HttpOnly`, `Secure` and `SameSite` it has.
2. Type `document.cookie` in the Console and confirm that the `HttpOnly` cookies are missing.
3. Run the two `curl` lines with the cookie jar and find the `Set-Cookie` and `Cookie` headers with `-v`.
4. Decode the sample JWT above by hand in Python or in [CyberChef](https://gchq.github.io/CyberChef/). Use made-up tokens only: a real one is a live credential.
:::

?! A stolen session cookie lets an attacker in without a password. List three protections that reduce that risk, and how each helps.
