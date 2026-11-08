---
title: Key management
summary: Cryptography turns every problem into a key problem. The key lifecycle, KMS and HSM, envelope encryption, rotation, secret sharing and everyday tools such as GnuPG and age.
level: intermediate
side: defence
minutes: 45
attack: T1552.001, T1552.004, T1555
needs: 03-03-block-ciphers-and-modes, 0028-apis-and-secrets
pair: 10-04-serverless-and-secrets
source: NIST SP 800-57 Part 1, Recommendation for Key Management | https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final
words: envelope encryption, HSM, key rotation
---
Good encryption shrinks a big secret into a small one: instead of protecting a terabyte, you protect 32 bytes. That only helps if you actually protect those 32 bytes. In breach reports, attackers rarely defeat encryption. They find the key sitting next to the data.

@term HSM (hardware security module) = A tamper-resistant device that generates and uses keys, without ever releasing them.
@term KMS (key management service) = A service that stores master keys and performs cryptographic operations through an API.
@term envelope encryption = Encrypting data with a data key, then encrypting that data key with a master key.
@term crypto-shredding = Making data unreadable by destroying the key that protects it.
@term secret sharing = Splitting a secret into parts so that only a chosen number of them together can rebuild it.

## Concept

### Fundamentals: the lifecycle

Every key goes through stages, and each has a typical failure.

| Stage | Question | Common failure |
|---|---|---|
| Generate | Is the randomness good? | Weak RNG, keys made on a laptop |
| Store | Who can read it? | In source code, or in an environment variable |
| Distribute | How does it reach its user? | Sent by chat or email |
| Use | What's it allowed to do? | One key for everything |
| Rotate | How often, and what's the cost? | Never, because it's too hard |
| Revoke | What happens on compromise? | No plan |
| Destroy | Is it really gone? | Backups keep it alive |

### Envelope encryption

Calling a KMS for every record is too slow, and a master key must never leave its box. So use two layers.

@flow Generate a data key > Encrypt the data with it > Encrypt the data key with the master key > Store both together

The encrypted data key travels with the data. To read, ask the KMS to unwrap it, then decrypt locally. This has real benefits: fast bulk encryption, central access control and audit, and **cheap rotation**, because rotating a master key means rewrapping small keys rather than re-encrypting all your data.

Destroying one data key makes its data unreadable. This **crypto-shredding** is a practical way to honour deletion, including in backups.

### HSMs and KMS

An **HSM** performs operations inside tamper-resistant hardware, so a key can't simply be copied out. Certification is under [FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final). Cloud **KMS** products expose the same idea through an API, typically backed by HSMs. Access is by IAM policy, and every use is logged, so a stolen application credential can use a key, but it can't take it away, and that use shows up in CloudTrail.

### Rotation

Rotation limits how much data one key protects, and it shortens the window after an unnoticed leak. Automatic rotation in a KMS usually keeps old versions for decryption. It doesn't re-encrypt existing data, so old data still depends on old key versions. If a key was stolen, rotation alone isn't enough: you must also re-encrypt.

### Advanced: splitting trust

**Shamir's secret sharing** divides a key into `n` shares, so that any `k` can rebuild it, and fewer reveal nothing. It's based on the fact that `k` points define a degree `k−1` polynomial. Root CA ceremonies and tools such as HashiCorp Vault's unseal step use it.

**Threshold cryptography** goes further: parties sign without ever assembling the key in one place. [Key ceremonies](https://www.iana.org/dnssec/ceremonies) for the DNS root show the highest standard: multiple people, cameras, published scripts.

**Personal and file encryption.** **GnuPG** implements OpenPGP, and it's used for signing packages and email, with a complex key model. **age** is a small modern file encryption tool with no configuration options. For new file encryption, age is usually the better choice. Use **Sigstore** for code signing. See [SLSA and maturity](/modules/13-03-slsa-and-maturity/).

?? In envelope encryption, what does the KMS root key protect directly?
+ The data keys, not the data itself
- The data itself, one block per request
- The application's source code during each build
- The network path between the two services
=> The master key wraps small data keys. That's why rotating it is cheap, and bulk data never has to pass through the KMS.

## Threat model

Attackers hunt for keys rather than break ciphers.

| Where they look | ATT&CK |
|---|---|
| Config files and source | [T1552.001](https://attack.mitre.org/techniques/T1552/001/) |
| Private key files | [T1552.004](https://attack.mitre.org/techniques/T1552/004/) |
| Password stores | [T1555](https://attack.mitre.org/techniques/T1555/) |

Git history, CI logs, container images, environment dumps, memory and backups are the usual places. A subtle one is the *application role*: if an attacker gets the app's permissions, they can ask KMS to decrypt, so encryption at rest doesn't protect against a compromised application.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| AWS KMS, Azure Key Vault, Cloud KMS | Managed keys | Cloud workloads |
| HashiCorp Vault, OpenBao | Secrets, dynamic credentials, encryption as a service | Multi-cloud or self-hosted |
| `age` | Simple file encryption | Sharing a file safely |
| GnuPG | OpenPGP encryption and signing | Package signing, older workflows |
| `sops` | Encrypts values in config files | Keeping config in Git |
| gitleaks, TruffleHog | Find leaked secrets | Prevention and response |

## Defence

- **Keep keys out of code**, and scan for them in commits and images.
- **Use workload identity**, so that applications have no long-lived secret to steal.
- **Separate roles.** Those who administer keys shouldn't be those who use them.
- **Limit each key to one purpose**, and scope IAM tightly by key.
- **Enable automatic rotation**, and test what happens during it.
- **Log and alert.** Unusual `Decrypt` volume, or key deletion, is a high-value alert.
- **Write the compromise plan** now: revoke, re-encrypt, rotate what depended on it, tell people.

## Pitfalls

- **"It's encrypted at rest, so we're safe."** That protects against stolen disks, not compromised apps.
- **"We keep the key in an environment variable."** Environment variables leak through crash dumps, `/proc` and logs.
- **"Rotation fixed the leak."** Old data stays readable with the old version until you re-encrypt.
- **Losing the key.** Encryption without a recovery plan is scheduled data loss. Ransomware operators rely on your backups being reachable too.
- **Scheduling key deletion with no waiting period.** Cloud KMS products add one for good reason.

?? How does regular key rotation limit the damage of a leak?
+ Fewer messages depend on that one key
- Old ciphertexts can never be read again
- The leaked key stops working by itself
- Attackers must now break AES by hand
=> Rotation limits how much each key protects. It doesn't undo a leak, so anything under the stolen version must still be re-encrypted.

## Exercise

::: law Lab only
Use your own accounts and test keys. Don't paste real production keys into practice tools.
:::

1. Build envelope encryption in Python: generate a data key, encrypt a file with AES-GCM, wrap the key with a master key, store both, then read it back.
2. Rotate the master key, and rewrap without touching the data. Time the difference compared with re-encrypting 1 GB.
3. Use `age` to encrypt a file for a friend's public key. Compare the experience with `gpg`.
4. Split a test secret with a Shamir tool into five shares, with a threshold of three. Confirm that two shares reveal nothing.
5. Run `gitleaks detect` over a repository of yours, including its history.

?! Design key handling for a service storing medical records in the cloud. Say who can use which key, how you rotate, and what happens if the application's role is stolen.

## Further reading

- [NIST SP 800-57 Part 1](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final).
- [OWASP Key Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Key_Management_Cheat_Sheet.html).
- [AWS KMS concepts](https://docs.aws.amazon.com/kms/latest/developerguide/concepts.html), a clear account of envelope encryption.
- [age](https://github.com/FiloSottile/age), a simple file encryption tool.
- [IANA root KSK ceremonies](https://www.iana.org/dnssec/ceremonies), key management at its most careful.
