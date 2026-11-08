---
title: OAuth security
summary: Where OAuth deployments go wrong, explained by design decision. Redirect validation, state, PKCE, token handling, consent abuse, and what current best practice requires.
level: advanced
side: defence
minutes: 45
attack: T1528, T1550.001
needs: 0042-oauth-oidc-saml, 11-02-authentication-mechanics
pair: 11-04-saml-attacks, 04-06-authentication-and-jwt-attacks
source: RFC 9700, Best Current Practice for OAuth 2.0 Security | https://www.rfc-editor.org/rfc/rfc9700
words: redirect URI, DPoP, consent phishing
---
OAuth is a framework more than a protocol, with many optional parts. That flexibility is where its failures come from. Lesson 42 taught the authorization code flow and PKCE. This module goes through the decisions that an implementer must get right, why each exists, and what [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), the current best practice, tells you to do.

@term redirect URI = The address to which an authorization server sends the user and their code after approval.
@term DPoP = Demonstrating Proof of Possession: binding an OAuth token to a key held by the client.
@term refresh token rotation = Issuing a new refresh token on each use, and revoking the chain if an old one reappears.

## Concept

### Fundamentals: what each parameter defends

The authorization code flow passes a short-lived code through the browser, then swaps it for tokens on a back channel. Each parameter answers a specific risk.

| Parameter | Defends against |
|---|---|
| `redirect_uri` | Codes and tokens being sent elsewhere |
| `state` | CSRF on the callback |
| `code_challenge` (PKCE) | A stolen code being redeemed |
| `nonce` (OIDC) | ID token replay |
| `scope` | Excess access |
| `aud` in tokens | Using a token at the wrong service |

### Redirect URIs

If an authorization server accepts loose matches, then the code might go somewhere the client never intended. Wildcards, prefix matching, and open redirects on a trusted domain are the usual causes. So **RFC 9700 requires exact string matching**.

### The implicit flow is dead

The old implicit flow returned tokens in a URL fragment, exposing them to browser history, referrers and scripts. RFC 9700 says that clients shouldn't use it, and [OAuth 2.1](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/) drops it, together with the password grant. Use the code flow with PKCE for all clients, including single-page apps.

### PKCE for everyone

PKCE was created for mobile apps. It's now recommended for all clients, because it also stops authorization code injection: the code is useless without the secret verifier.

### Advanced: tokens and consent

**Bearer tokens.** Whoever holds one can use it, like cash. So keep access tokens short-lived, and validate the signature, issuer, audience and expiry at every API. [JWT mistakes](/modules/04-06-authentication-and-jwt-attacks/) are a common cause of failures here.

**Sender-constrained tokens.** [DPoP](https://www.rfc-editor.org/rfc/rfc9449) and mutual TLS tie a token to a key, so that a stolen token alone doesn't work.

**Refresh token rotation** detects theft: if a used token reappears, the server revokes the family.

**Browser apps.** Storing tokens in `localStorage` exposes them to any XSS. The Backend-for-Frontend pattern keeps tokens on a server, and gives the browser a secure session cookie.

**Consent phishing.** Here no password is stolen. A user is shown a real consent screen from their real provider, for a malicious app that wants "read your mail". Once granted, access continues even after a password reset, and MFA doesn't help. Microsoft and others have tracked this as a real campaign type ([T1528](https://attack.mitre.org/techniques/T1528/)). The defence is administrative: restrict who can grant consent, and review what has been granted.

**Mix-up and confused clients.** When a client uses several authorization servers, it must check which one is responding. RFC 9207's `iss` parameter helps.

?? What does the `state` parameter protect against?
+ Cross-site request forgery on the callback
- Password guessing at the login page
- Malware stealing the browser's saved cookies
- Replay of an expired refresh token
=> `state` ties the response to the browser session that began the flow, so an attacker can't inject their own.

## Threat model

Attackers want tokens, because tokens bypass passwords and MFA. Key paths include [stealing application tokens](https://attack.mitre.org/techniques/T1528/) and [using them](https://attack.mitre.org/techniques/T1550/001/) as alternate authentication. Malicious or over-privileged apps also give long-lasting access that normal account resets don't remove, so it's a persistence risk.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [OAuth Security Workshop materials](https://oauth.secworkshop.events/) | Current research | Staying up to date |
| Burp with its OAuth labs | Practice on legal targets | Learning, via PortSwigger |
| Keycloak | Self-hosted identity server | A safe test lab |
| Entra app consent reports | Lists granted apps | Reviewing your tenant |
| `jwt.io`, `step crypto jwt` | Decode tokens | Debugging your own tokens |

## Defence

- **Use exact redirect URI matching,** and no wildcards.
- **Use the code flow with PKCE,** for every client.
- **Keep tokens short-lived,** and rotate refresh tokens.
- **Validate `aud`, `iss`, `exp` and the signature** on every API call.
- **Grant minimal scopes.** Avoid broad ones such as full mailbox access.
- **Restrict user consent.** Require admin approval for risky permissions.
- **Audit third-party apps** regularly, and revoke what's unused.
- **Use a library** certified for OIDC, not your own parser.

**Detection.** Watch for new consent grants, apps with high-risk scopes, tokens used from unexpected places, and a refresh token being replayed.

## Pitfalls

- **"OAuth is for login."** OAuth is authorisation. OIDC adds authentication. Treating an access token as proof of identity is a classic bug.
- **Skipping `state` because PKCE exists.** Follow current guidance for your client type.
- **Storing tokens in `localStorage`.**
- **Trusting `email` from a token blindly.** Verify the issuer, and whether the email is verified.
- **Assuming a password reset ends the access.** Revoke tokens and app grants too.

?? Why must redirect URIs match exactly?
+ Loose matching can send codes to attackers
- Browsers refuse any address with query strings
- Exact matching makes the login page faster
- Authorization servers store only one URL ever
=> If a pattern can be satisfied by another page, the code can land somewhere that the client doesn't control.

## Exercise

::: law Lab only
Use your own Keycloak server, or PortSwigger's free OAuth labs. Never test a real identity provider or someone else's application.
:::

1. Run Keycloak in Docker, and create a client for a small test app. Walk through the code flow, using your browser's developer tools.
2. Try a slightly different redirect URI, and read the error.
3. Remove `state` from your client, and explain what's now possible.
4. Enable PKCE as required, and see the failure when the verifier is wrong.
5. Complete the [OAuth labs on Web Security Academy](https://portswigger.net/web-security/oauth).
6. In a test Microsoft 365 tenant, read which apps hold consent.

?! Staff report that a "PDF viewer" app asked for mailbox access, and some approved it. Write your response plan, including why password resets won't be enough.

## Further reading

- [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700), best current practice.
- [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636), PKCE.
- [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449), DPoP.
- [OAuth 2.1 draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/).
- [OAuth for Browser-Based Apps](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/).
