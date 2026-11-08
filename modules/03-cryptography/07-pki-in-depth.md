---
title: PKI in depth
summary: Why revocation barely works, how public logs caught rogue certificates, why lifetimes are collapsing to 47 days, and how to run mutual TLS and a private CA.
level: intermediate
side: both
minutes: 50
attack: T1553.004, T1588.004, T1649
needs: 0039-public-keys-and-tls
pair: 03-08-tls-internals
source: RFC 5280, X.509 PKI Certificate and CRL Profile | https://www.rfc-editor.org/rfc/rfc5280
words: revocation, Certificate Transparency, mutual TLS
---
TLS is only as strong as the answer to one question: who says this key belongs to this name? The public key infrastructure is a global answer to that, resting on hundreds of organisations your browser trusts. Lesson 39 explained the chain. This module looks at where it has failed, and how the system got repaired.

@term CRL (certificate revocation list) = A signed list of certificates that a CA has revoked.
@term OCSP = The Online Certificate Status Protocol, for asking a CA whether one certificate is still valid.
@term Certificate Transparency = Public, append-only logs of issued certificates, which anyone can audit.
@term ACME = The protocol that lets software prove control of a domain and obtain a certificate automatically.
@term CAA record = A DNS record naming which certificate authorities may issue for a domain.
@term certificate pinning = Limiting which keys or CAs a client will accept for a given service.

## Concept

### Fundamentals: what a certificate says

An X.509 certificate binds a public key to names in its **Subject Alternative Name** field, signed by an issuer. Key fields include validity dates, key usage, extended key usage, and whether it's a CA (`basicConstraints`). Browsers ignore the Common Name in favour of the SAN.

Validation has several levels, and all of them give the same padlock. **DV** proves control of a domain, through HTTP, DNS or TLS. **OV** and **EV** add checks on the organisation.

A client checks the chain to a trusted root, the dates, the name, usage, and maybe revocation.

### The revocation problem

If a key is stolen, the certificate should stop being trusted. That's turned out to be very hard.

| Method | Idea | Problem |
|---|---|---|
| **CRL** | Download a list | Lists get big and stale |
| **OCSP** | Ask the CA live | Leaks browsing to the CA, adds latency, fails open |
| **OCSP stapling** | Server attaches a fresh signed answer | Attackers can just omit it |
| **Browser-pushed lists** | CRLSets, CRLite | Compressed and curated |

The critical word is **soft-fail**. If a browser can't reach the responder, it usually continues, because otherwise outages would break the web. An attacker on-path can block the check, so it protects you least when you need it most.

The trend now is to give up on OCSP. Let's Encrypt, the largest CA, [shut down its OCSP service](https://letsencrypt.org/2024/12/05/ending-ocsp.html) in August 2025, largely on privacy grounds, in favour of CRLs.

### Shorter lifetimes

If you can't revoke reliably, shorten how long a stolen key is valid. The CA/Browser Forum passed ballot [SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/) in April 2025, which reduces maximum lifetimes for public certificates.

| From | Maximum validity |
|---|---|
| 15 March 2026 | 200 days |
| 15 March 2027 | 100 days |
| 15 March 2029 | 47 days |

At 47 days, manual renewal is impossible, and that's the point: **automation becomes mandatory**. **ACME** ([RFC 8555](https://www.rfc-editor.org/rfc/rfc8555)) is the protocol for it.

### Advanced: catching CAs misbehaving

Any trusted CA can issue for any domain, so one failure breaks everyone. In 2011, the Dutch CA [DigiNotar](https://security.googleblog.com/2011/08/update-on-attempted-man-in-middle.html) was hacked. Rogue Google certificates were used against Iranian users, and browsers removed the CA entirely, which ended the company.

**Certificate Transparency** ([RFC 6962](https://www.rfc-editor.org/rfc/rfc6962)) responded to this. CAs submit each certificate to public logs built on Merkle trees, and browsers require proof of logging, called an SCT. It doesn't stop mis-issuance. It makes that **visible**, so domain owners can monitor for their names. This caught Symantec's [mis-issuance](https://security.googleblog.com/2017/09/chromes-plan-to-distrust-symantec.html), which led browsers to distrust a major CA.

**CAA records** say which CAs may issue for you, and CAs must check them. **Pinning** in browsers (HPKP) was removed because mistakes could brick a website. It lives on in mobile apps, where it's a double-edged sword: a pinned key that rotates unexpectedly can lock out your own users.

**Mutual TLS** adds a client certificate, so both sides authenticate. It's standard between services, in Zero Trust designs, and in service meshes. Running a **private CA** for this demands its own care: an offline root, short-lived leaf certificates, and tools such as `step-ca` or a cloud private CA.

?? Why did browsers move away from live OCSP checks?
+ They leak browsing, and failures get ignored
- They require a new certificate per visit
- They only work with elliptic curve keys
- They were replaced by DNSSEC in browsers
=> OCSP tells the CA what you're visiting, and soft-fail means that an attacker who blocks it loses nothing.

## Threat model

| Technique | ATT&CK |
|---|---|
| Installing a rogue root on a host | [T1553.004](https://attack.mitre.org/techniques/T1553/004/) |
| Obtaining certificates for attacker domains | [T1588.004](https://attack.mitre.org/techniques/T1588/004/) |
| Stealing or forging authentication certificates | [T1649](https://attack.mitre.org/techniques/T1649/) |

Remember that phishing sites have valid certificates. A padlock proves a connection to a name, not honesty. Attackers also look up CT logs to find your subdomains. See [OSINT](/modules/09-05-osint-and-recon/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `openssl x509 -text` | Reads a certificate | Checking SANs, dates, usage |
| `openssl verify` | Validates a chain | Debugging trust |
| `crt.sh` | Searches CT logs | Finding what's been issued for you |
| `certbot`, Caddy, `acme.sh` | ACME clients | Automating renewal |
| `step-ca`, cert-manager | Private CA, Kubernetes certs | Internal mTLS |
| `certigo`, `zlint` | Inspect and lint certificates | Auditing |

## Defence

- **Automate everything.** Assume 47 days. Inventory all certificates, and monitor expiry independently, as outages from expired certificates are common.
- **Monitor CT** for your domains, and alert on unknown issuers.
- **Publish CAA records.**
- **Protect private keys** in an HSM or KMS, and rotate them on renewal.
- **Watch for rogue roots.** Alert on changes to machine trust stores. Sysmon event 13 on the `ROOT\Certificates` keys helps on Windows.
- **Separate duties** on a private CA, and keep the root offline.

## Pitfalls

- **"The padlock means the site is safe."** It means that the connection is encrypted to that name.
- **"Revocation protects us."** Most clients soft-fail, so plan on short lifetimes.
- **"Wildcards are convenient."** One stolen key covers every subdomain.
- **Pinning to a leaf certificate.** Renewal will break it. Pin to a backup key or a CA, or don't pin.
- **Forgetting internal services.** Expired certificates on an internal API cause outages too.

?? How does Certificate Transparency help a domain owner?
+ Unexpected certificates for their domain become visible
- Stolen private keys get revoked in seconds
- Rogue CAs are prevented from signing anything
- Encrypted traffic gets decrypted for their monitoring
=> Logs are public and append-only, so a mis-issued certificate can be spotted. CT detects problems rather than preventing them.

## Exercise

::: law Lab only
Query public CT logs freely, but issue certificates only for domains and lab CAs that you control.
:::

1. Read a live certificate: `openssl s_client -connect example.com:443 -servername example.com </dev/null | openssl x509 -text -noout`. Find the SANs, the issuer, the SCT list, and the key usage.
2. Search `crt.sh` for a domain you own, or your university. What subdomains can you see?
3. Build a root and intermediate CA with `openssl` or `step-ca`. Issue a server certificate, and verify the chain.
4. Set up mutual TLS on a lab Nginx server. Show that `curl` fails without the client certificate.
5. Write a small script that warns when any certificate in a list expires within 21 days.

?! Your company has 800 certificates, and half are renewed by hand. Write the plan that gets you ready for 47-day certificates, starting tomorrow.

## Further reading

- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280), the X.509 profile.
- [RFC 6962](https://www.rfc-editor.org/rfc/rfc6962), Certificate Transparency.
- [Let's Encrypt, Ending OCSP Support](https://letsencrypt.org/2024/12/05/ending-ocsp.html).
- [Ballot SC-081v3](https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/), the lifetime schedule.
- [Bulletproof TLS and PKI](https://www.feistyduck.com/books/bulletproof-tls-and-pki/), by Ivan Ristić.
