---
title: OAuth, OIDC and SAML
summary: Sign in with another service, understood: access tokens versus ID tokens, the authorization code flow, and PKCE.
month: 7
minutes: 60
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

The diagram becomes easier to hold once you've seen the actual messages. There are four, and you can watch the first two in your browser's address bar the next time you use "Sign in with…".

**1. The app sends your browser to the provider**, with what it wants in the query string:

```
https://idp.example/authorize
  ?response_type=code
  &client_id=notes-app
  &redirect_uri=https://app.example/callback
  &scope=openid%20profile
  &state=k3Jx9aQ
  &code_challenge=E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM
  &code_challenge_method=S256
```

| Parameter | Meaning |
|---|---|
| `response_type=code` | "Give me a code", which selects this flow |
| `client_id` | Which app is asking. It was registered with the provider beforehand |
| `redirect_uri` | Where to send the user back. It must match what the app registered |
| `scope` | The permissions requested. `openid` is the one that asks for a login |
| `state` | A random value the app made up for this one attempt |
| `code_challenge` | The PKCE hash, explained in the next section |

**2. After you log in, the provider sends your browser back** to the app:

```
https://app.example/callback?code=SplxlOBeZQQYbYS6WxSbIA&state=k3Jx9aQ
```

The app first checks that `state` is the value it sent. If it isn't, somebody else started this, and the app stops. That check is what prevents an attacker from pushing their own code into your session.

**3. The app's server calls the provider directly**, with the code and its proof:

```
POST https://idp.example/token
grant_type=authorization_code&code=SplxlOBeZQQYbYS6WxSbIA
&redirect_uri=https://app.example/callback&client_id=notes-app
&code_verifier=dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk
```

**4. The provider answers with the tokens**, as JSON:

```json
{
  "token_type": "Bearer",
  "expires_in": 3600,
  "access_token": "eyJhbGciOi…",
  "refresh_token": "8xLOxBtZp8",
  "id_token": "eyJhbGciOi…"
}
```

`expires_in` is in seconds, so this access token lasts an hour. From then on the app calls the API with the header `Authorization: Bearer eyJhbGciOi…`. "Bearer" means what it says: whoever bears the token is served, and that's why tokens are worth stealing.

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

The values in the messages above are the worked example from the RFC, so you can check them. The secret, called the **code verifier**, is `dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk`. Its **challenge** is the SHA-256 of that text, written in Base64URL with the `=` padding removed: `E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM`. The challenge travels through the browser in step 1, where it may be seen. The verifier appears only in step 3, on a direct connection. Seeing the challenge doesn't help a thief, because a hash can't be turned back into its input.

@code pkce-challenge

?? What does PKCE protect against?
+ A stolen authorization code being redeemed by others
- A user choosing a weak password at login
- A malicious app asking for too many scopes
- A server keeping refresh tokens for too long
=> Only the app that started the flow knows the original secret, so an intercepted code is useless.

## Consent and scopes

Apps ask for **scopes**, and you click Allow. That click is the attack surface. **Consent phishing** tricks a user into approving a malicious app, which then reads their mail through a valid token. No password stolen, and MFA doesn't help, because the user approved it.

Read a consent screen the way you'd read a `sudo` prompt. A calendar app that asks for `calendar.read` is asking for what it needs. One that asks for `mail.read` and `offline_access` wants your mailbox, and it wants to keep the access while you're away, because `offline_access` is the scope that grants a refresh token.

Review what you've already approved. In a Google account it's under **Security → Your connections to third-party apps**. In Microsoft 365 an administrator sees every grant under **Entra ID → Enterprise applications**. Removing an app there revokes its tokens, which is the response to consent phishing. Changing the password does nothing, because the app never had it.

?? Why doesn't MFA stop consent phishing?
+ The user approved it themselves
- MFA only works on SMS
- The app steals the password
- Consent screens turn MFA off
=> The app holds a valid token that the user granted, so no login is being faked.

## SAML

SAML does SSO with signed XML assertions passed through the browser. It's older, heavier and still everywhere in enterprises. The concept is the same: an identity provider vouches for you to a service. Its risks centre on validating signatures properly.

A SAML assertion, with the long values cut out, shows the same ideas you've just met in OIDC:

```xml
<Assertion>
  <Issuer>https://idp.example</Issuer>
  <Subject><NameID>ana@corp.example</NameID></Subject>
  <Conditions NotBefore="2026-11-15T09:00:00Z" NotOnOrAfter="2026-11-15T09:05:00Z">
    <AudienceRestriction><Audience>https://app.example</Audience></AudienceRestriction>
  </Conditions>
  <Signature>…</Signature>
</Assertion>
```

Who issued it, who it's about, when it's valid, which service it's for, and a signature over the whole thing. A service that accepts an assertion must check all five. Every serious SAML flaw comes down to one of those checks being skipped or done on the wrong part of the document.

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

The first row is a string comparison, and it's worth writing once to see how easy it is to get wrong. An address that merely starts with the registered one can belong to someone else entirely.

@code redirect-allowed

The second row is about the ID token's contents. An ID token is a JWT, so its payload is readable, and three of its claims must be checked by every app that receives one:

| Claim | Meaning | The app checks that |
|---|---|---|
| `iss` | Issuer: who made the token | It's the provider the app uses |
| `aud` | Audience: who the token is for | It's the app's own `client_id` |
| `exp` | Expiry, in seconds since 1970 | It's still in the future |
| `sub` | Subject: the user's stable ID at that provider | Nothing: this is the answer the app wanted |

A token with a valid signature and the wrong `aud` is a genuine token that was issued to some other app. Accepting it means that any app the user has ever logged in to can log in as them here.

@code id-token-problems

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

## Review a login flow

Three things you notice while reviewing an application's sign-in. Decide what each means before you read the choices.

?? The app's authorization request has no `state` parameter. What can't the app do?
+ Tell its own logins from forged ones
- Ask the provider for an ID token
- Send the user back after their login
- Keep the access token for an hour
=> `state` ties the response to the request the app really made. Without it, an attacker can feed the app a response that the user never asked for.

?? The app is registered with `https://app.example/callback`. A request arrives asking to redirect to `https://app.example.evil.example/callback`. What should the provider do?
+ Refuse, because the address must match exactly
- Accept, because the address starts the same
- Accept, because the path is the same
- Refuse, because the address uses plain HTTPS
=> The host there is `app.example.evil.example`, which belongs to whoever owns `evil.example`. Only an exact match is safe.

?? An ID token arrives with a valid signature, and its `aud` is `calendar-app`. Your app's client ID is `notes-app`. What do you do?
+ Reject it: another app was its audience
- Accept it: the signature is still valid
- Accept it: the user is still real
- Reject it: the signature must be forged
=> The token is genuine, and it isn't for you. The audience check is what stops one app's tokens from being replayed at another.

?! Explain the difference between OAuth and OIDC in two sentences, using your own analogy.
