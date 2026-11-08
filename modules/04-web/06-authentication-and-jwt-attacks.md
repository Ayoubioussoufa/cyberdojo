---
title: Authentication and JWT security
summary: Building login that holds up. Reset flows, account enumeration, session handling, and the JWT verification mistakes that keep turning into authentication bypasses.
level: intermediate
side: defence
minutes: 45
attack: T1078, T1606.001
needs: 0036-sessions-and-the-browser, 11-02-authentication-mechanics
pair: 11-03-oauth-attacks
source: OWASP Authentication Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html
words: account enumeration, JWT verification, session rotation
---
Authentication sits at seventh place in the OWASP Top 10:2025, and it's usually not the login form that fails. It's everything around it: password reset, remember-me, session handling and token verification. This module walks through those parts, and shows what a safe implementation does at each step.

@term account enumeration = Learning which usernames exist from differences in an application's behaviour.
@term session rotation = Issuing a new session ID when privileges change, such as at login.
@term JWKS (JSON Web Key Set) = A published set of public keys used to verify signed tokens.

## Concept

### Fundamentals: the whole authentication surface

| Flow | Common failure | Safe behaviour |
|---|---|---|
| Login | Different errors reveal valid users | One generic message, similar timing |
| Registration | "Email already in use" | Send an email instead of showing it |
| Password reset | Predictable or reusable token | Random, single-use, short-lived, hashed |
| Change email or password | No re-authentication | Require the current password |
| Remember me | Long-lived guessable cookie | Random token, rotated, stored hashed |
| Logout | Client-only | Server-side invalidation |
| MFA | Can be skipped by another path | Enforced at the server on every route |

### Session handling

**Rotate the session ID at login.** If you don't, an ID that was set before login remains valid after, which is **session fixation**. Use long random IDs from a CSPRNG, keep them in `Secure`, `HttpOnly`, `SameSite` cookies, and expire them on the server. The [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) covers this.

### Password reset done right

1. Accept the request, and always show the same message.
2. Generate at least 128 bits of random token. Store only its hash.
3. Email a link built from a configured base URL, and **never from the `Host` header**, because that header can be forged and could point the link at someone else's site.
4. Expire quickly, use once, and invalidate other tokens and sessions.

### JWTs

A JWT is a signed claim set: `header.payload.signature`. Signed isn't encrypted, so anyone can read it. Almost all JWT disasters come from verification. [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725), JWT Best Current Practices, lists the classes.

| Mistake | Why it matters | Safe practice |
|---|---|---|
| Trusting the token's `alg` | The token chooses its own check | Fix the algorithm on the server |
| Accepting `none` | No signature at all | Reject it |
| Mixing HMAC and RSA | A public key could be misused as an HMAC secret | One key, one algorithm |
| Weak HMAC secret | Can be guessed offline | At least 256 random bits |
| Trusting `kid`, `jku`, `x5u` | The token may pick its own key | Look up keys only from your allow-listed set |
| Skipping `exp`, `aud`, `iss` | Valid tokens work in the wrong place | Check every claim |

### Advanced: choosing session or token

| | Server sessions | Stateless JWT |
|---|---|---|
| Revocation | Instant | Hard |
| Storage | Server | Client |
| Scaling | Needs a shared store | Easy |
| Size | Small cookie | Larger |

For a normal web app, server sessions are usually the better choice. The main trade-off of stateless tokens is revocation: a logged-out JWT stays valid until it expires. So keep lifetimes short, and use a refresh flow, or a deny-list, which reintroduces state. See [lesson 36](/courses/0036-sessions-and-the-browser/).

**Rate limits and lockouts.** Lock on failures per account and per source, using progressive delays. Permanent lockouts allow someone else to lock users out. Bot detection and breached-password checks help against [stuffing](/modules/11-02-authentication-mechanics/).

?? Why pin the algorithm when verifying a JWT?
+ The token's own header can't be trusted
- Libraries run faster with a fixed algorithm
- Users must choose one algorithm at login
- Tokens without it can't contain any claims
=> The header is attacker-controlled input, so it must not decide how the token is checked.

## Threat model

Attackers want [valid accounts](https://attack.mitre.org/techniques/T1078/), or to [forge web credentials](https://attack.mitre.org/techniques/T1606/001/). Reset flows are especially attractive: they're rarely tested, and a mistake there gives full takeover, MFA included.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Vetted libraries | Handle verification | Always |
| `jwt.io` | Decodes tokens | Your own tokens only |
| Rate-limit middleware | Slows guessing | Every auth route |
| Have I Been Pwned API | Finds breached passwords | Signup and reset |
| [Web Security Academy](https://portswigger.net/web-security/authentication) | Free labs | Legal practice |

## Defence

- **Use a mature auth library or identity provider** instead of building your own.
- **Fix the JWT algorithm and key** in configuration.
- **Validate `iss`, `aud`, `exp` and `nbf`.**
- **Make all failure responses uniform.**
- **Rotate sessions** at login and when privilege changes.
- **Build reset links from configuration.**
- **Invalidate sessions** on password change.
- **Log auth events:** failures, resets, MFA changes.

**Detection.** Watch for resets followed by logins from a new location, MFA changes right after a reset, and tokens with unknown `kid` values.

## Pitfalls

- **Storing tokens in `localStorage`,** where any XSS can read them.
- **Treating base64 as encryption.** Don't put secrets in JWTs.
- **Long-lived JWTs with no revocation plan.**
- **Timing leaks.** Skipping the password hash for unknown users reveals who exists.
- **MFA checked only in the UI.** Enforce it in the API.

?? What makes a password reset token safe?
+ It's random, single-use and it expires quickly
- It's the user's email address in Base64
- It's sent only to the user's browser
- It's stored in plain text on servers
=> Tokens must be unguessable, and short-lived. Storing a hash also means that a database leak doesn't hand out resets.

## Exercise

::: law Lab only
Build these flows in your own app, and use PortSwigger's labs for testing. Don't test login pages of real services.
:::

1. Build a small login in Flask. Time responses for a valid and an invalid username. Fix any difference.
2. Implement password reset following the four steps above.
3. Verify a JWT with PyJWT, fixing the algorithm. Show with a test that a token signed with another key, or with `none`, is rejected.
4. Rotate the session ID at login, and show the before and after.
5. Add rate limiting to login, and write a test.
6. Complete three authentication labs on Web Security Academy.

?! Review a login flow that you know. List each way to bypass it, including reset, remember-me, API and mobile routes.

## Further reading

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html).
- [OWASP Forgot Password Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html).
- [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725), JWT best practices.
- [Web Security Academy on JWT](https://portswigger.net/web-security/jwt).
