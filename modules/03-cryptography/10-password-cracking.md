---
title: Password storage under attack
summary: What a stolen password database is worth, seen from the defender's chair. Why speed decides everything, how hardness settings are chosen, and how to audit your own hashes.
level: intermediate
side: defence
minutes: 45
attack: T1110.002, T1003
needs: 0040-storing-passwords, 03-04-hash-function-internals
pair: 03-04-hash-function-internals, 11-02-authentication-mechanics
source: NIST SP 800-63B-4, Authentication and Authenticator Management | https://pages.nist.gov/800-63-4/sp800-63b.html
words: offline guessing, work factor, pepper
---
Assume that your password database leaks one day. What happens next isn't decided by your firewall. It's decided by choices you made years earlier: which algorithm, which cost setting, and how you treat users' passwords. Lesson 40 taught the right answer. This module shows the reasoning, so you can defend the decision in a design review and test it on your own systems.

@term offline guessing = Testing password candidates against stolen hashes, with no rate limit and no logs.
@term pepper = A secret key applied to password hashes, and stored away from the database.
@term memory-hard function = A function that needs a lot of memory, which removes much of the advantage of GPUs and custom chips.

## Concept

### Fundamentals: online and offline

Guessing against a login page is **online**: it's slow, logged and rate limited. Guessing against stolen hashes is **offline**: the attacker controls the hardware, and nothing tells you it's happening. So the design goal is simple: **make each guess expensive for someone who has already won the database**.

### Why speed is the whole story

A general hash is designed to be fast. A modern GPU can compute billions of SHA-256 hashes per second, so eight random characters no longer protect you. Real passwords are far weaker than random, since people choose words and patterns. Attackers exploit this with ordered lists of leaked passwords and rules that apply common changes, such as a capital first letter or a year at the end. Humans are predictable, so most of a typical database falls long before anyone tries brute force.

| Storage | What a theft costs |
|---|---|
| Plaintext | Immediate loss of everything |
| Unsalted fast hash | One table breaks every user at once |
| Salted fast hash | Each user costs separate work, though each guess is still cheap |
| bcrypt, scrypt, Argon2 | Each guess is deliberately expensive |

### What salt, pepper and cost each do

**Salt** makes each hash unique, so precomputed tables and "crack one, crack all" stop working. It isn't secret.

A **work factor** multiplies the cost of each guess. Going from one microsecond to 100 milliseconds makes attacks 100,000 times more expensive, while one login barely notices.

A **pepper** is a key held outside the database, say in an HSM or KMS. If only the database leaks, the hashes can't be tested at all.

### Advanced: memory-hardness

GPUs and custom chips win because hashing needs little memory, so thousands of cores can run side by side. **Memory-hard** functions such as scrypt and Argon2 force each guess to fill a large block of RAM, which is expensive to parallelise.

**Argon2id**, winner of the 2015 Password Hashing Competition, is the current first choice. [OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) recommends at least 19 MiB of memory, 2 iterations and 1 degree of parallelism. Tune it to about what your login path can afford, and review it yearly as hardware changes. Remember the trade-off: a work factor that's too high becomes a denial-of-service target on your login page, so rate limit it. And bcrypt silently ignores input past 72 bytes.

**Upgrades** don't need a mass reset. When a user next logs in, you have their password for a moment, so rehash it with the new setting. For old accounts, you can wrap the old hash in the new function.

### What the guidance says now

[NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html) rewrites a lot of folk wisdom. Verifiers:

- must require at least **15 characters** for passwords used alone, and at least 8 when they're part of multi-factor authentication
- should allow at least 64 characters
- must not impose composition rules, such as requiring symbols
- must not force periodic changes, only change on evidence of compromise
- must check new passwords against a blocklist of common or compromised values

Composition rules produce `Password1!`, and forced rotation produces `Password2!`. Length and a blocklist do more.

?? Why is SHA-256 a poor choice for password storage?
+ It's fast, so guesses are cheap too
- It's broken by known collision attacks today
- It produces output too short to store
- It can't accept long passwords as input
=> SHA-256 isn't broken. Its speed is the problem, because each guess costs an attacker almost nothing.

## Threat model

Offline guessing is [T1110.002](https://attack.mitre.org/techniques/T1110/002/), and it follows credential dumping ([T1003](https://attack.mitre.org/techniques/T1003/)). What makes it dangerous is reuse: a cracked password from one site gets tried on others, which is credential stuffing. So a breach of a small forum can become a breach of a corporate VPN. See [Authentication mechanics](/modules/11-02-authentication-mechanics/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `argon2` CLI, `passlib` | Tune and test hash settings | Choosing parameters |
| hashcat, John the Ripper | Password recovery tools | Authorised audits of your own hashes |
| [Have I Been Pwned Passwords](https://haveibeenpwned.com/Passwords) | Lists known leaked passwords | Blocklisting, using its k-anonymity API |
| zxcvbn | Realistic strength estimates | Giving users useful feedback |
| Entra Password Protection | Blocks weak passwords in AD | Windows estates |

## Defence

- **Use Argon2id**, or bcrypt if your platform requires it.
- **Add a pepper** from a KMS or HSM where you can.
- **Check against breached lists** at signup and at password change.
- **Prefer passkeys and MFA**, so that a cracked password isn't enough. See lesson 41.
- **Rate limit login**, including the cost of hashing.
- **Protect dumps.** Backups and analytics copies of user tables hold the same hashes.
- **Prepare the response.** If a table leaks, force a reset and tell users, with a plan already written.

**Audit with authority.** In a company, periodic password audits against your own hashes are a valid control. They need written approval and care, as cracked passwords are sensitive data. Report statistics, not names.

## Pitfalls

- **"Our passwords are hashed, so a leak doesn't matter."** It depends completely on which hash.
- **"Complexity rules make passwords strong."** They produce predictable patterns.
- **"Salt must be secret."** It needn't be. It must be unique.
- **Encrypting passwords.** You almost never need reversibility, and a stolen key loses everything.
- **Truncating or limiting length.** A low maximum tells people that something's wrong with your storage.

?? What does a unique salt defeat?
+ One rainbow table covering many user accounts
- Guessing a single weak password at all
- Reading the hash database from the server
- Phishing the user's password at the login
=> Salts force separate work per account, but a weak password still falls to a targeted guess, which is why cost matters as well.

## Exercise

::: law Lab only
Use only hashes you generated yourself. Cracking anyone else's password hashes without written authority is illegal in most countries, even for a security audit.
:::

1. Hash the same 1,000 test passwords with SHA-256, bcrypt at cost 12, and Argon2id at OWASP's settings. Time each.
2. Generate 20 hashes of your own: 10 weak and 10 random passphrases. Use a small public wordlist to test them, and record which fall.
3. Compute the cost for an attacker: how long would 10 billion candidate guesses take with each algorithm? Use your own timings.
4. Implement "upgrade on login" in a small Flask app that moves users from SHA-256 to Argon2id.
5. Query the Pwned Passwords range API with the first five characters of a SHA-1 hash. Explain how k-anonymity protects the query.

?! Your company's user table leaked, stored as salted SHA-256. Write the first 24-hour plan, covering what you'd do, what you'd tell users, and what you'd change.

## Further reading

- [NIST SP 800-63B-4](https://pages.nist.gov/800-63-4/sp800-63b.html), the current guidance.
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
- [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106), Argon2.
- [Password Hashing Competition](https://www.password-hashing.net/), on why memory-hardness won.
- Bonneau, [The Science of Guessing](https://www.cl.cam.ac.uk/~jcb82/doc/B12-IEEESP-analyzing_70M_anonymized_passwords.pdf), a study of 70 million passwords.
