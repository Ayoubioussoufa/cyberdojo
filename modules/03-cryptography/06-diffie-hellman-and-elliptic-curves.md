---
title: Diffie-Hellman and elliptic curves
summary: How two strangers agree on a secret in public, how elliptic curves shrink the same idea, and why a single reused number can leak a signing key.
level: intermediate
side: both
minutes: 50
attack: T1557
needs: 03-02-crypto-maths, 0039-public-keys-and-tls
pair: 03-02-crypto-maths, 03-08-tls-internals
source: RFC 7748, Elliptic Curves for Security | https://www.rfc-editor.org/rfc/rfc7748
words: ephemeral key, elliptic curve, ECDSA
---
Key exchange is the closest thing to magic in cryptography: two people shout numbers across a room, and end up sharing a secret that nobody listening can compute. Elliptic curves take that idea and make it small and fast. Together, they protect almost every connection you make today.

@term ephemeral key = A key used for one session, then destroyed.
@term elliptic curve = A set of points satisfying an equation, on which a group operation makes discrete logs hard.
@term ECDSA = The Elliptic Curve Digital Signature Algorithm, which needs a unique secret number for each signature.
@term Ed25519 = A modern signature scheme on an Edwards curve, designed to avoid common implementation mistakes.

## Concept

### Fundamentals: Diffie-Hellman

Alice and Bob agree in public on a prime `p` and a generator `g`.

@flow Alice picks a, sends g^a > Bob picks b, sends g^b > Both compute g^(ab) mod p

An eavesdropper sees `g^a` and `g^b`, and recovering `g^(ab)` seems to need a discrete logarithm. That's the **computational Diffie-Hellman** assumption.

But plain DH has no authentication. An active attacker can sit in the middle and run one exchange with each side. So real protocols sign the exchange, which is what a TLS certificate is for. **DH gives secrecy, and signatures give identity. You need both.**

### Forward secrecy

If `a` and `b` are generated fresh for each session and then deleted, the keys are **ephemeral**. Stealing a server's long-term key later can't decrypt recorded traffic, because that key only signed the exchange. This is the "E" in ECDHE. Its importance grew after the [Snowden revelations](https://datatracker.ietf.org/doc/html/rfc7258) showed bulk collection in practice, and that's what the IETF means by pervasive monitoring.

### Elliptic curves

An elliptic curve is the set of points satisfying an equation such as `y² = x³ + ax + b`, over a finite field. You can "add" two points by drawing a line through them, finding where it meets the curve again, and reflecting. That gives a group. Repeated addition, `k × G`, plays the role of exponentiation.

The **elliptic curve discrete log problem** asks for `k`, given `G` and `k × G`. No sub-exponential attack is known on good curves, so 256 bits gives about 128-bit security, compared with 3072-bit RSA. Keys are small, and operations are fast.

| Curve | Notes |
|---|---|
| P-256 | NIST curve, widely deployed, trickier to implement safely |
| Curve25519 | Designed for simple, constant-time code ([RFC 7748](https://www.rfc-editor.org/rfc/rfc7748)) |
| Ed25519 | Signature scheme on an equivalent curve ([RFC 8032](https://www.rfc-editor.org/rfc/rfc8032)) |
| secp256k1 | Used by Bitcoin |

### Advanced: where the wheels come off

**Parameter attacks.** [Logjam](https://weakdh.org/) (2015) showed that many servers shared a few 512- and 1024-bit primes. Because the expensive precomputation for discrete logs depends only on the prime, one large effort could break every session using it. The paper estimated that a nation-state could do this for common 1024-bit primes. So standard large groups or curves are required, and TLS 1.3 limits the choices.

**Nonce failures in ECDSA.** Each signature needs a secret random number `k`. If `k` repeats for two signatures, simple algebra recovers the private key. Sony's [PS3 signing key](https://fahrplan.events.ccc.de/congress/2010/Fahrplan/events/4087.en.html) fell this way in 2010, because the same `k` was used every time. Even a small bias in `k` can leak the key across many signatures, using lattice attacks. The Minerva and TPM-FAIL research showed that timing can reveal such a bias.

Two fixes exist. [RFC 6979](https://www.rfc-editor.org/rfc/rfc6979) derives `k` deterministically from the key and message. **Ed25519** builds this in, so a broken random number generator can't leak the key.

**Invalid-curve attacks.** If a program doesn't check that a received point lies on the curve, an attacker can send a point on a weaker curve, and learn key bits. X25519 is designed so that every 32-byte string is safe to use, which removes a whole class of bugs.

**Backdoors.** Dual_EC_DRBG, a random number generator standardised by NIST, had a suspicious structure that allowed anyone who knew a secret relation to predict output. It was withdrawn in 2014. This is why people care how constants are chosen, and why "nothing up my sleeve" numbers matter.

?? What does a reused ECDSA nonce reveal?
+ The signer's private key, by simple algebra
- The signed message's contents, in plain form
- The curve's generator point, by trial division
- The verifier's public key, through the hash
=> Two equations share the same `k`, so `k` can be solved, and then the private key follows directly.

## Threat model

The active attacker in the middle ([T1557](https://attack.mitre.org/techniques/T1557/)) is why authentication matters. For long-lived data, there's also **harvest now, decrypt later**: an adversary records traffic today, hoping for a quantum computer. That threat applies to any exchange based on discrete logs. See [the frontier module](/modules/03-12-modern-crypto-frontier/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `openssl genpkey -algorithm X25519` | Generates curve keys | Learning, or lab keys |
| `openssl ecparam -list_curves` | Lists curves | Seeing what's supported |
| `ssh-keygen -t ed25519` | Modern SSH keys | Daily use |
| SageMath | Curve arithmetic | Studying the maths |
| `testssl.sh` | Tests DH and curves on a server | Auditing your own TLS |
| [SafeCurves](https://safecurves.cr.yp.to/) | Criteria for curve safety | Comparing curves |

## Defence

- **Prefer X25519 and Ed25519**, or P-256 through a vetted library.
- **Require ephemeral exchange.** Turn off static RSA and static DH.
- **Use 2048-bit or larger standard groups**, if you must use finite-field DH.
- **Use deterministic or misuse-resistant signatures.** Never write your own nonce generation.
- **Validate public keys** unless the primitive makes that unnecessary.
- **Add a post-quantum hybrid** where long-term confidentiality matters. Browsers and TLS libraries already support this.

## Pitfalls

- **"DH authenticates the peer."** It doesn't. Without signatures, you could be talking to an attacker.
- **"ECDSA is safe, it's a standard."** Its safety rests on a perfect nonce on every single signature.
- **"Forward secrecy protects against all key theft."** It protects past sessions only, and only if the ephemeral keys really were deleted.
- **Session tickets that undo it.** A long-lived ticket key can decrypt resumed sessions, which quietly weakens forward secrecy.
- **Treating curve choice as a performance tweak.** It affects how likely a bug is.

?? What does ephemeral Diffie-Hellman protect against?
+ A later theft of the server's key
- A forged certificate during the live handshake
- A denial of service on the server
- A weak password on the user's account
=> Each session's secret is thrown away, so a long-term key stolen later can't decrypt recordings of old sessions.

## Exercise

::: law Lab only
Use your own keys, and small numbers you generate yourself.
:::

1. Do Diffie-Hellman in Python with `p = 23`, `g = 5`, and two random exponents. Confirm that both sides reach the same value.
2. Pretend you're the attacker in the middle. Write the two exchanges that you'd run. Which message would stop you?
3. Generate two X25519 keys with Python's `cryptography` library, derive a shared key both ways, and pass it through HKDF.
4. Using a toy curve in SageMath, sign two messages with the same `k`, then recover the key, following a written walkthrough. Use only keys that you made.
5. Inspect a capture of a TLS 1.3 handshake, and find the `key_share` extension. Which curve did it use?

?! Explain forward secrecy to a manager in three sentences, including what it doesn't protect.

## Further reading

- [RFC 7748](https://www.rfc-editor.org/rfc/rfc7748) and [RFC 8032](https://www.rfc-editor.org/rfc/rfc8032).
- [Logjam](https://weakdh.org/), on how Diffie-Hellman fails in practice.
- [RFC 6979](https://www.rfc-editor.org/rfc/rfc6979), on deterministic signatures.
- [SafeCurves](https://safecurves.cr.yp.to/), by Bernstein and Lange.
- Diffie and Hellman, [New Directions in Cryptography](https://www-ee.stanford.edu/~hellman/publications/24.pdf), the 1976 paper.
