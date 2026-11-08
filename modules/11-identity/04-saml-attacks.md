---
title: SAML security
summary: Why XML signatures make SAML so easy to get wrong, what a stolen signing key means for a whole organisation, and how to harden and monitor federation.
level: advanced
side: defence
minutes: 40
attack: T1606.002, T1552.004
needs: 0042-oauth-oidc-saml
pair: 11-03-oauth-attacks
source: OWASP SAML Security Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html
words: assertion, canonicalisation, token-signing key
---
SAML holds up single sign-on in much of the corporate world. Its security rests on one idea: a service trusts a signed statement from an identity provider. So only two big things can go wrong. The service might check the signature badly, or the signing key might be stolen. Both have happened at a serious scale.

@term SAML assertion = A signed XML statement from an identity provider, about who a user is.
@term canonicalisation = Converting XML into one standard form, so that it can be signed and verified.
@term token-signing key = The private key an identity provider uses to sign assertions.

## Concept

### Fundamentals: trust in one signature

In SP-initiated SSO, a service provider sends a user to the identity provider, and the user comes back with a signed **assertion**. The service checks the signature, the audience, the time window and the recipient, then logs the user in.

@flow User visits service > Redirect to identity provider > User authenticates > Signed assertion returns > Service validates and logs in

### Why XML is hard

XML can express the same meaning in different byte forms: attribute order, whitespace, comments. So **canonicalisation** normalises it before signing. The signature references just one element, by ID, rather than the whole document. This creates a gap between two pieces of code: the one that *verifies* and the one that *reads the user's name*.

If they look at different elements, a signature can be valid while the application reads something else. That class is **XML signature wrapping**, which [Somorovsky and others](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/somorovsky) found across many frameworks in 2012.

The same gap reappears in new forms. In 2018, [Duo Security reported](https://duo.com/blog/duo-finds-saml-vulnerabilities-affecting-multiple-implementations) that libraries handled XML comments inside a username differently from the signature code. Parser differences reappeared in the 2024 [ruby-saml flaw](https://github.blog/security/sign-in-as-anyone-bypassing-saml-sso-authentication-with-parser-differentials/). Root cause is always the same: the validated data and the used data aren't the same data.

### Assertions need more than a signature

| Check | Without it |
|---|---|
| Audience | An assertion for another app is accepted |
| Recipient, Destination | A token is replayed elsewhere |
| NotBefore, NotOnOrAfter | Old tokens work |
| InResponseTo | Unsolicited responses work |
| One-time use | Replay within the time window |
| Signature covers the assertion | Unsigned parts can be changed |

### Advanced: when the signing key is lost

An identity provider is the root of trust for everything federated. If its **token-signing key** is stolen, an attacker can create valid assertions for anyone, for any app, without touching the identity provider again, and with no MFA. MITRE calls this forging SAML tokens ([T1606.002](https://attack.mitre.org/techniques/T1606/002/)), and it was seen in the [SolarWinds campaign](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-008a).

Because forged assertions come directly to the service, the identity provider never logs them. That gives defenders the key detection: **a service login with no matching identity provider authentication**.

So treat AD FS servers and signing keys as Tier 0. Many organisations have moved from on-premises AD FS to cloud identity, largely to remove this kind of risk. See [Hybrid identity](/modules/11-05-hybrid-and-workload-identity/).

**XXE** is a related risk: an XML parser that processes external entities could expose files. Disable those in any parser.

?? Why is a stolen token-signing key so serious?
+ It can mint valid assertions for anyone
- It reveals every user's password in clear
- It disables the service provider's firewall rules
- It deletes the identity provider's audit logs
=> Services trust the signature, so whoever holds the key can sign in as any user, and MFA never comes into it.

## Threat model

An attacker with admin rights on an identity provider can steal the key, and create long-lived access to all connected services. So one server's compromise reaches every SaaS application. Stolen keys are [private key](https://attack.mitre.org/techniques/T1552/004/) theft in general, and rotating them needs careful coordination with each service provider.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| SAML-tracer browser add-on | Shows SAML messages | Debugging your own SSO |
| `xmlsec1` | Verifies XML signatures | Checking by hand |
| Keycloak, SimpleSAMLphp | Test identity providers | A lab |
| SIEM correlation | Matches SP and IdP logs | Detecting forgery |
| Certificate monitoring | Alerts on signing changes | Federation hygiene |

## Defence

- **Use a maintained library,** and keep it patched. Never parse SAML by hand.
- **Validate fully:** signature, audience, destination, time, and replay.
- **Read identity only from the signed element** that you verified.
- **Reject comments and DTDs,** and disable external entities.
- **Protect signing keys** in an HSM, and rotate them on a schedule.
- **Protect identity servers as Tier 0.**
- **Prefer OIDC** for new applications, as JSON has far less parsing ambiguity.
- **Correlate logs** between the IdP and services.
- **Watch for new trusted certificates** or federation changes.

## Pitfalls

- **"The signature's valid, so it's safe."** Valid over which element?
- **Checking only the signature.** Audience and time checks matter too.
- **Long assertion lifetimes.** They widen the replay window.
- **Trusting IdP logs alone.** Forged assertions never appear there.
- **Forgetting key rotation.** A stolen key stays useful until it's replaced everywhere.

?? What's the root cause of signature wrapping flaws?
+ Validated XML differs from the processed XML
- The signing certificate expired a year ago
- The service provider only uses HTTP/2 connections
- The assertion contains too many user attributes
=> One part of the code checks the signature, and another reads a different element. The two views don't match.

## Exercise

::: law Lab only
Use Keycloak and a test application in your own lab, or PortSwigger's legal labs. Don't test real SSO deployments.
:::

1. Set up Keycloak as an identity provider, and a small service provider app.
2. Log in with SAML-tracer open. Find the assertion, its signature, audience and time window.
3. Decode it, and verify the signature by hand with `xmlsec1`.
4. Change the audience configuration on the service, and show that login fails.
5. Export logs from both sides, and write a query that lists service logins with no IdP event in the prior five minutes.

?! Your AD FS server was compromised. Write what you'd do beyond rebuilding it, and explain why just rebuilding isn't enough.

## Further reading

- [OWASP SAML Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SAML_Security_Cheat_Sheet.html).
- [On Breaking SAML](https://www.usenix.org/conference/usenixsecurity12/technical-sessions/presentation/somorovsky).
- [Sign in as anyone](https://github.blog/security/sign-in-as-anyone-bypassing-saml-sso-authentication-with-parser-differentials/), GitHub's account of a parser differential.
- [CISA on detecting post-compromise cloud activity](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-008a).
- [ATT&CK T1606.002](https://attack.mitre.org/techniques/T1606/002/).
