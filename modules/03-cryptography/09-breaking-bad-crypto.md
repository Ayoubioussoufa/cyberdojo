---
title: Common crypto flaws
summary: Strong algorithms, broken systems. Padding oracles, malleable ciphertexts, weak randomness and timing leaks, seen as design mistakes to find in review and fix for good.
level: advanced
side: both
minutes: 55
attack: T1600
needs: 03-03-block-ciphers-and-modes, 03-04-hash-function-internals
pair: 03-03-block-ciphers-and-modes, 03-05-rsa-in-depth
source: OWASP Cryptographic Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html
words: padding oracle, malleability, constant-time
---
Cryptographic Failures sits at number four in the OWASP Top 10:2025, and almost none of those failures involve breaking AES. They come from composing good parts badly. This module teaches four classes of mistake, so you can spot them in a design or a code review. The practice ground for the attacks themselves is Cryptopals, where you break code you wrote.

@term padding oracle = A system that reveals whether decrypted padding was valid, which leaks plaintext.
@term constant-time code = Code whose running time and memory accesses don't depend on secret values.
@term CSPRNG = A cryptographically secure pseudorandom number generator, whose output can't be predicted.

## Concept

### Fundamentals: the attacker has an oracle

Recall [the attacker models](/modules/03-01-crypto-foundations/). Any system that takes attacker-supplied ciphertext and behaves differently based on its contents gives away a small piece of a decryption oracle. Repeated enough, small pieces add up. Most of what follows is one idea in different clothes: **a secret-dependent behaviour that someone can observe.**

### Unauthenticated encryption

Encryption without a tag is malleable. In CBC, flipping a bit in one ciphertext block garbles that block and flips the matching bit of the next plaintext block. In CTR, a flip maps directly onto the plaintext. So if a cookie encrypts `role=user`, then someone who knows the layout might alter the bits to read `role=root`, without ever knowing the key. ECB allows blocks to be cut and rearranged.

The design error is **trusting a decrypted value because it decrypted**. Encryption doesn't provide integrity.

### Padding oracles

CBC needs messages padded to a full block. In 2002, Serge Vaudenay [showed](https://link.springer.com/chapter/10.1007/3-540-46035-7_35) that if a server distinguishes "bad padding" from anything else, an attacker can recover plaintext one byte at a time, by altering a ciphertext and watching the response. No key is ever needed. The signal may be an error code, a different page, or just a timing difference.

This has recurred in ASP.NET (2010), TLS as Lucky Thirteen (2013), and POODLE (2014). Generic error messages reduce the signal, but timing often keeps it alive. The real fix removes the padding oracle class altogether: authenticate first, with AEAD, so that a tampered ciphertext is rejected before anything is parsed.

### Weak randomness

Keys, IVs, nonces, tokens and salts all assume unpredictable numbers. Failures are common, and they're devastating:

| Mistake | Result |
|---|---|
| `Math.random()`, `rand()`, Python's `random` | Predictable, sometimes recoverable from output |
| Seeding with the time | Few enough seeds to try them all |
| Generating keys at first boot | Low entropy, as seen in [shared keys in the wild](https://factorable.net/) |
| Forking without reseeding | Two processes produce the same stream |

Debian's 2008 OpenSSL patch reduced real entropy to about 15 bits, so every key from those systems could be listed. Use the OS: `getrandom()`, Python's `secrets`, Java's `SecureRandom`.

### Timing and side channels

If comparing two strings stops at the first mismatch, the time taken reveals how many bytes matched. So an attacker can guess a MAC byte by byte, even over a network, given enough samples. Paul Kocher [described timing attacks](https://www.paulkocher.com/doc/TimingAttacks.pdf) in 1996, and they remain live. Cache behaviour leaks too, which is why AES table lookups were dangerous before hardware instructions.

### Advanced: composition errors

Some flaws sit between correct parts:

- **Encrypt-and-MAC or MAC-then-encrypt**, as opposed to encrypt-then-MAC or AEAD.
- **Key reuse across purposes**, such as the same key for encryption and a MAC.
- **Hashing passwords with a fast hash.**
- **Compression before encryption** leaks through ciphertext length, as in CRIME and BREACH.
- **Signature confusion:** accepting a token's own `alg` field, as with [JWTs](/modules/04-06-authentication-and-jwt-attacks/).
- **Replay:** a valid message accepted twice. Cryptography doesn't stop that unless you add sequence numbers or nonces.

?? What does a padding oracle give an attacker?
+ One bit about each decrypted block's padding
- The encryption key in a single query
- A copy of the server's private key
- Control of the block cipher's key schedule
=> Each response answers one yes-or-no question about padding, and that's enough to recover plaintext byte by byte.

## Threat model

These are the flaws that a code reviewer or application tester finds. Attackers look for encrypted cookies and tokens, password reset links, API signatures, and any endpoint that handles ciphertext. On devices, [T1600](https://attack.mitre.org/techniques/T1600/) covers deliberately weakening crypto. Ask of any design: who supplies this ciphertext, and what does the system do differently depending on it?

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [Cryptopals](https://cryptopals.com/) | Challenges on all these flaws | Learning safely |
| Semgrep, CodeQL | Spot weak APIs in code | Security review |
| `dudect` | Tests code for timing leaks | Checking constant-time claims |
| `testssl.sh` | Tests TLS for known oracles | Auditing your own servers |
| libsodium, Tink | Misuse-resistant APIs | Replacing risky code |

## Defence

| Flaw | Fix |
|---|---|
| Malleability | AEAD everywhere |
| Padding oracle | AEAD, and uniform failure handling |
| Weak randomness | OS CSPRNG only, with a lint rule banning alternatives |
| Timing | `hmac.compare_digest`, `crypto.timingSafeEqual`, constant-time libraries |
| Key reuse | Derive separate keys with HKDF |
| Replay | Nonces, timestamps and sequence numbers, checked server-side |
| Compression leaks | Don't compress secrets alongside attacker-controlled data |

In code review, flag any import of a low-level crypto primitive. Application code shouldn't need `AES.new`.

## Pitfalls

- **"It's encrypted, so users can't change it."** Without authentication, they often can.
- **"We return a generic error, so we're safe."** Timing can still reveal it.
- **"`random` is random enough for a token."** Not if someone can predict it.
- **"`==` is fine for comparing MACs."** Early exit leaks. Use a constant-time comparison.
- **"The network is too noisy for timing attacks."** Statistics beat noise.

?? Which fix removes the padding oracle class entirely?
+ Switching to an AEAD mode, like GCM
- Returning the same status code for errors
- Increasing the AES key to 256 bits
- Rate limiting all requests from one address
=> Generic errors help, but timing can leak. AEAD rejects tampered data before any padding is examined.

## Exercise

::: law Lab only
Attack only code that you wrote and run yourself, or Cryptopals. Testing a live site for padding oracles without written permission can be illegal.
:::

1. Write a tiny Flask app that stores `role=user` in a cookie, encrypted with AES-CTR and no MAC. Show with a bit flip that you can change the role. Then switch to AES-GCM, and show that the same flip fails.
2. Work through Cryptopals [Set 3](https://cryptopals.com/sets/3), including the CBC padding oracle, against your own local code.
3. Time `a == b` against `hmac.compare_digest` on matching and mismatching strings, across many runs. Plot the results.
4. Write a Semgrep rule that flags `random.` in a file that also mentions `token` or `password`.
5. Review an open-source project's crypto use. List every call to a low-level primitive, and say whether it's needed.

?! You find an encrypted session cookie with no signature during a code review. Write the finding, including severity, a realistic scenario and the fix, as you'd send it to the team.

## Further reading

- [OWASP Cryptographic Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html).
- [OWASP A04:2025 Cryptographic Failures](https://top10.owasp.org/2025/A04_2025-Cryptographic_Failures/).
- Serge Vaudenay, [Security Flaws Induced by CBC Padding](https://link.springer.com/chapter/10.1007/3-540-46035-7_35).
- Paul Kocher, [Timing Attacks on Implementations of Diffie-Hellman, RSA, DSS, and Other Systems](https://www.paulkocher.com/doc/TimingAttacks.pdf).
- [Cryptopals](https://cryptopals.com/).
