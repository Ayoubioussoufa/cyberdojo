---
title: OAuth, OIDC and SAML
summary: Sign in with another service, understood: access tokens versus ID tokens, the authorization code flow, and PKCE.
month: 7
minutes: 35
builds: explain the authorization-code flow with PKCE without notes
source: OAuth 2.0 Simplified, Aaron Parecki | https://www.oauth.com/
words: OAuth, OpenID Connect, PKCE
---
"Sign in with Google", "Allow this app to read your calendar". These are the protocols behind modern login, and their misconfiguration is behind many modern breaches. The ideas are simple once you've separated two questions: **who are you?** and **what may this app do?**

@term OAuth 2.0 = A standard for granting an app limited access to a resource without sharing a password.
@term OpenID Connect (OIDC) = A layer on OAuth 2.0 that adds login: it tells an app who the user is.
@term SAML = An older XML-based standard for single sign-on, common in enterprises.
@term identity provider (IdP) = The service that authenticates users, such as Entra ID or Okta.
@term OAuth access token (access tokens) = A credential that lets an app call an API.
@term refresh token = A long-lived credential used to get new access tokens.
@term ID token = A token that tells an app who logged in.
@term PKCE = A proof that stops a stolen authorization code from being used by anyone else.
@term consent = A user's approval of what an app may access.
@term OAuth scope (scopes) = A named permission that an app requests, such as read:calendar.

## The hotel key card

You check in at reception with your passport (authentication), and you're given a key card that opens your room and the gym, until Friday. The door doesn't need your passport. **OAuth** is the key card: limited, temporary, and not your password.

- **OAuth 2.0** is about **authorization**: what may this app do?
- **OIDC** adds **authentication**: who is this user?

| Token | Answers | Given to | Rule |
|---|---|---|---|
| **ID token** | Who logged in? | The app | A signed JWT the app reads |
| **Access token** | May this call proceed? | The API | Short-lived |
| **Refresh token** | Can I get a new access token? | The app | Long-lived, so guard it carefully |

?? Which token tells an app who logged in?
+ The ID token, a signed JWT
- The access token, for the API
- The refresh token, which is long-lived
- The session cookie, for the browser
=> Access tokens are for APIs. Using one as proof of login is a classic mistake.

## The authorization code flow

The flow you need to know, drawn by hand:

@seq You | App | Identity provider | API
You > App: Click "Log in"
App > You: Redirect to the provider
You > Identity provider: Log in and consent
Identity provider > You: Redirect with a one-time code
You > App: The code
App > Identity provider: Code + proof
Identity provider > App: Tokens
App > API: Access token

The clever part: the browser only sees a short-lived **code**, and the tokens are fetched directly by the app, away from the browser.

?? Why does the browser only see a short-lived code?
+ Tokens stay away from the browser
- The code is easier to remember
- Browsers can't display very long tokens
- It makes the page load faster
=> The app swaps the code for tokens directly, so they don't pass through the browser.

## PKCE

What if someone intercepts that code? [PKCE](https://www.rfc-editor.org/rfc/rfc7636) stops them.

1. The app invents a random secret and sends its **hash** with the first request.
2. When swapping the code for tokens, it sends the **original secret**.
3. The provider hashes it and compares.

A thief with only the code can't produce the secret. The [OAuth 2.0 Security Best Current Practice](https://www.rfc-editor.org/rfc/rfc9700) recommends PKCE for all clients.

?? What does PKCE protect against?
+ A stolen authorization code being redeemed by others
- A user choosing a weak password at login
- A malicious app asking for too many scopes
- A server keeping refresh tokens for too long
=> Only the app that started the flow knows the original secret, so an intercepted code is useless.

## Consent and scopes

Apps ask for **scopes**, and you click Allow. That click is the attack surface. **Consent phishing** tricks a user into approving a malicious app, which then reads their mail through a valid token. No password stolen, and MFA doesn't help, because the user approved it.

?? Why doesn't MFA stop consent phishing?
+ The user approved it themselves
- MFA only works on SMS
- The app steals the password
- Consent screens turn MFA off
=> The app holds a valid token that the user granted, so no login is being faked.

## SAML

SAML does SSO with signed XML assertions passed through the browser. It's older, heavier and still everywhere in enterprises. The concept is the same: an identity provider vouches for you to a service. Its risks centre on validating signatures properly.

?? What does SAML share with OIDC?
+ An identity provider vouches for you
- Both rely entirely on Kerberos tickets
- Both send passwords to every site
- Both only work on Windows machines
=> The format differs, with XML in SAML and JSON tokens in OIDC, but the idea is the same.

## Common failures

| Failure | What it allows |
|---|---|
| Redirect URI not strictly checked | Codes or tokens sent to the attacker |
| Using an access token as proof of login | Tokens meant for another app get accepted |
| Long-lived tokens in browser storage | XSS steals them |
| Weak checks on JWT signatures | Forged tokens |

@term token theft = Stealing a session or access token so that the attacker skips login and MFA entirely.

?? An attacker steals a valid access token from a logged-in session. Why doesn't MFA stop them?
+ The login already happened, so the token suffices
- MFA only ever protects accounts belonging to administrators
- Tokens contain the user's password in clear text
- Access tokens can't ever be revoked by anyone
=> MFA guards the moment of login. A stolen token skips that step, which is why token theft has grown.

::: try Practise
Draw the flow by hand until you don't need notes. Then decode a test JWT at [jwt.io](https://jwt.io/). Don't paste real tokens into websites.
:::

?! Explain the difference between OAuth and OIDC in two sentences, using your own analogy.
