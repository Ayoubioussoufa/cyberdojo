---
title: Authentication mechanics
summary: How TOTP and passkeys really work, why only some MFA resists phishing, how account takeover looks in logs, and why the recovery path is often the weakest link.
level: intermediate
side: defence
minutes: 50
attack: T1110.003, T1110.004, T1621, T1539
needs: 0041-identity-and-access, 03-04-hash-function-internals
pair: 03-10-password-cracking, 16-01-social-engineering, 11-05-hybrid-and-workload-identity
source: NIST SP 800-63B-4 | https://pages.nist.gov/800-63-4/sp800-63b.html
words: TOTP, WebAuthn, phishing resistance
---
Lesson 41 said that passkeys beat SMS. This module shows why, from the mechanism up. Once you've seen how each factor works, a simple question sorts them all: if a user types their credentials into a perfect fake site, what does the attacker get to keep?

@term TOTP = Time-based one-time password: a code computed from a shared secret and the current time.
@term WebAuthn = The web standard that lets a site authenticate users with public-key credentials.
@term phishing resistance = The property that a credential can't be used on a site other than the real one.
@term session token = The value proving that a login already happened, usually stored in a cookie.

## Concept

### Fundamentals: how TOTP works

[RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) builds on HOTP. Server and app share a secret. Both compute:

```
TOTP = truncate(HMAC-SHA1(secret, floor(unix_time / 30)))
```

So a code lasts 30 seconds, and needs no network. That's why your phone can do it in flight mode. The weaknesses follow from the design: the secret is shared, so a server breach exposes it, and a code typed into a fake site can be relayed in real time.

### How WebAuthn works

[FIDO2 and WebAuthn](https://www.w3.org/TR/webauthn-3/) use public keys.

@flow Site sends a random challenge > Authenticator checks the origin > Signs with a private key > Site verifies with the public key

Three things matter here. The private key **never leaves** the device, or a synced passkey provider's protected store. Each key pair is **per site**. And the browser includes the **origin** in what gets signed, so a signature made on `examp1e.com` is useless on `example.com`. A user can't be tricked into sending it to the wrong place, because the browser, not the human, checks the name.

### Ranking the factors

| Factor | Can be relayed by a fake site? | Other risk |
|---|---|---|
| Password | Yes | Reuse, guessing |
| SMS code | Yes | SIM swap, SS7 |
| TOTP | Yes | Shared secret |
| Push approval | Yes | Fatigue |
| Push with number matching | Partly | Careful phishing |
| FIDO2, passkey | **No** | Device and recovery |
| Smart card | **No** | Deployment cost |

[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) defines authenticator assurance levels, and requires phishing-resistant options at the highest one.

### Advanced: attacks seen from the defender's desk

**Guessing at scale.** Password **spraying** tries one common password across many accounts, and **stuffing** replays leaked pairs. Both avoid lockouts, so detect the pattern across accounts: many users failing from one source, or one source with an unusually high failure ratio.

**MFA prompt bombing** floods a user with push requests until one is accepted. Number matching ends this.

**Adversary-in-the-middle phishing** is the current serious threat. A reverse proxy sits between the victim and the real site, so MFA succeeds, and the attacker ends up holding the **session token**. Because the token proves a login that already happened, MFA is never asked again. Origin-bound credentials stop it, since the signature fails at the proxy's domain. Short sessions, and Conditional Access with device compliance, limit the damage from stolen tokens. Binding sessions to a device, as in [Device Bound Session Credentials](https://developer.chrome.com/docs/web-platform/device-bound-session-credentials), aims to stop theft from being useful.

**Recovery.** Every strong login has a weaker back door: helpdesk resets, SMS fallback, backup codes. An attacker takes the cheapest route, as [Social engineering](/modules/16-01-social-engineering/) showed. So assess the whole lifecycle: enrolment, use, loss and recovery.

**Infostealers** skip all this by taking cookies and passwords straight from a browser. See [Malware families](/modules/06-01-malware-families-and-economics/).

?? Why does WebAuthn resist phishing when TOTP doesn't?
+ Signatures are bound to the real origin
- Its codes change every thirty seconds instead
- Its passwords are far longer than TOTP
- Its servers block every foreign IP address
=> The browser includes the site's origin, so a response for a fake domain can't work on the real one.

## Threat model

| Technique | ATT&CK |
|---|---|
| Password spraying | [T1110.003](https://attack.mitre.org/techniques/T1110/003/) |
| Credential stuffing | [T1110.004](https://attack.mitre.org/techniques/T1110/004/) |
| MFA request generation | [T1621](https://attack.mitre.org/techniques/T1621/) |
| Stealing session cookies | [T1539](https://attack.mitre.org/techniques/T1539/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| YubiKey, passkeys | Phishing-resistant factors | Protecting admins first |
| Entra Conditional Access, Okta policies | Risk-based login rules | Enforcing strength |
| [webauthn.io](https://webauthn.io/) | Tests WebAuthn | Learning the flow |
| SIEM queries | Find sprays | Detection |
| Have I Been Pwned for domains | Finds leaked staff accounts | Forcing resets |

## Defence

- **Move privileged users to FIDO2 first,** then everyone else.
- **Enable number matching,** and retire SMS where you can.
- **Block legacy authentication,** which skips MFA altogether.
- **Harden recovery:** strong helpdesk proofing, alerts on new factor enrolment.
- **Shorten sessions** on sensitive apps, and bind them to managed devices.
- **Detect:** failures across many accounts, impossible travel, new MFA methods, token reuse from a new device.
- **Check breached passwords** at login and at reset.

## Pitfalls

- **"We have MFA, so we're safe."** Most MFA can be relayed.
- **"Passkeys mean no recovery problem."** Losing a device needs a process, and that process is a target.
- **Long-lived sessions.** A 90-day cookie is a 90-day credential.
- **Exempting executives.** They're the prime targets.
- **Alerting per account only.** Spraying is visible only across accounts.

?? An AiTM proxy captured a session cookie after a successful MFA login. What helps most?
+ Passkeys plus sessions bound to each device
- A longer minimum password length for users
- A monthly reminder to check the padlock
- A second SMS code at every login
=> Stolen cookies bypass whichever factor came before. Origin-bound login and device-bound sessions remove the prize.

## Exercise

::: law Lab only
Use your own accounts and test applications. Don't try to phish or guess real accounts.
:::

1. In Python, implement TOTP from RFC 6238 using `hmac`. Compare it with an authenticator app on your own test secret.
2. Register a passkey on [webauthn.io](https://webauthn.io/), and open your browser's developer tools to see the request.
3. Run a small Flask app with WebAuthn. Serve it at a different hostname, and show that the credential fails.
4. In your lab, generate fake login logs with one source trying 200 usernames. Write the SIEM query that catches it.
5. Draw your own recovery path for one important account. What's the weakest step?

?! Your company can only afford hardware keys for 100 of 3,000 staff. Choose who gets them, and what the rest should use.

## Further reading

- [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238), TOTP.
- [WebAuthn specification](https://www.w3.org/TR/webauthn-3/).
- [FIDO Alliance](https://fidoalliance.org/passkeys/).
- [CISA on phishing-resistant MFA](https://www.cisa.gov/sites/default/files/publications/fact-sheet-implementing-phishing-resistant-mfa-508c.pdf).
- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html).
