---
title: RSA in depth
summary: How RSA really works, why the textbook version is broken, what padding does, and how a single error message kept breaking TLS servers for twenty years.
level: intermediate
side: both
minutes: 50
attack: none
needs: 03-02-crypto-maths, 0039-public-keys-and-tls
pair: 03-02-crypto-maths, 03-09-breaking-bad-crypto
source: RFC 8017, PKCS #1 RSA Cryptography Specifications | https://www.rfc-editor.org/rfc/rfc8017
words: textbook RSA, OAEP, Bleichenbacher attack
---
RSA is the algorithm everyone learns first, and it's a perfect teacher. The maths fits on one page, yet using it safely took decades. Nearly every attack on RSA in practice targets the padding, the key generation or the implementation. None of them factor a modulus.

@term textbook RSA = RSA with no padding, which is deterministic and malleable, and unsafe in any real system.
@term OAEP = Optimal Asymmetric Encryption Padding, the randomised padding that makes RSA encryption secure.
@term PSS = Probabilistic Signature Scheme, the modern randomised padding for RSA signatures.
@term Bleichenbacher attack = An adaptive attack that decrypts RSA PKCS#1 v1.5 ciphertexts by watching whether padding was valid.

## Concept

### Fundamentals: the construction

Pick two large primes `p` and `q`. Let `n = pq` and `φ(n) = (p−1)(q−1)`. Choose a public exponent `e`, almost always 65537. Compute `d`, the inverse of `e` modulo `φ(n)`.

```
Public key:  (n, e)     Private key: d
Encrypt:     c = m^e mod n
Decrypt:     m = c^d mod n
```

It works because of Euler's theorem from [the maths module](/modules/03-02-crypto-maths/): `ed ≡ 1 mod φ(n)`, so `m^(ed) ≡ m`. Security relies on the belief that you can't find `φ(n)`, or take `e`-th roots, without factoring `n`. In the toy example of that module, `65^17 mod 3233 = 2790`, and `2790^2753 mod 3233 = 65`.

Signing reverses the roles: raise a hash of the message to `d`, and anyone can check it with `e`.

### Why textbook RSA fails

Used as above, RSA has several fatal properties.

| Property | Consequence |
|---|---|
| Deterministic | The same message gives the same ciphertext, so guesses can be tested |
| Malleable | `c × 2^e` decrypts to `2m`, so ciphertexts can be altered meaningfully |
| Small messages | If `m^e < n`, an `e`-th root recovers `m` with no key |
| Same message to three recipients | With `e = 3`, Håstad's attack recovers it |

So raw RSA is never used directly. A padding scheme adds randomness and structure.

### Padding

**PKCS#1 v1.5** (1993) wraps the message in fixed bytes with random filler. Simple, and widely deployed. **OAEP** runs the message through a two-round Feistel-like structure with a hash, which gives a security proof. For signatures, **PSS** plays the same role. [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017) specifies them all.

### Advanced: the oracle that wouldn't die

In 1998, Daniel Bleichenbacher published an attack that changed how people think about error messages. A server decrypting v1.5 padding would tell the client whether the padding was valid. Because of RSA's malleability, an attacker can multiply a target ciphertext by a chosen value, send it, and learn something from that yes-or-no answer. After about a million queries, the plaintext is recovered. In TLS, that plaintext was the premaster secret.

The fix was never clean: servers had to behave identically in all failure cases. Implementations kept leaking through timing or subtle differences. [ROBOT](https://robotattack.org/) (2017) found the same flaw still present on major vendors' products, 19 years on. That's why TLS 1.3 removed RSA key exchange altogether.

**Key generation** failures are their own family. [ROCA](https://github.com/crocs-muni/roca) (CVE-2017-15361) showed that a widely deployed Infineon library made primes with a detectable structure, which affected TPMs and smart cards, including national ID cards. Debian's 2008 OpenSSL bug ([CVE-2008-0166](https://www.debian.org/security/2008/dsa-1571)) cut entropy so far that all keys could be listed. Shared primes break keys with one `gcd`.

**Implementation attacks** include timing differences in modular exponentiation, and faults. In the *Bellcore attack*, a single fault during CRT signing can reveal a factor of `n`.

?? Why does TLS 1.3 remove RSA key exchange?
+ It offered no forward secrecy at all
- Its keys were too large to store
- Its signatures could not be verified later
- It required a second certificate per server
=> With RSA key exchange, stealing the server's key decrypts every recorded session. Ephemeral Diffie-Hellman ends that, and it also removes the padding oracle.

## Threat model

Attackers don't factor 2048-bit keys. They attack:

- **Oracles:** any server that behaves differently on bad padding.
- **Key generation:** weak randomness, shared primes, flawed libraries.
- **Key theft:** a private key on disk is the real target, which is why [key management](/modules/03-11-key-management/) matters.
- **Signature parsing:** sloppy verification with `e = 3` allowed forged signatures in [BERserk](https://nvd.nist.gov/vuln/detail/CVE-2014-1568)-style bugs.
- **Time:** a quantum computer running Shor's algorithm would break RSA outright.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `openssl genpkey`, `rsa -text` | Create and read keys | Seeing `n`, `e`, `d`, `p` and `q` |
| `openssl pkeyutl` | Encrypt and sign with explicit padding | Comparing schemes |
| `testssl.sh` | Tests for ROBOT | Auditing your own servers |
| `roca-detect` | Finds ROCA-affected keys | Auditing public keys |
| Python `cryptography` | Safe APIs | Real code |
| `badkeys` | Checks public keys against known-weak sets | Key inventories |

## Defence

- **Prefer elliptic curves** for new work. They're smaller, and they have fewer pitfalls.
- **If you use RSA, use 2048 bits or more**, with OAEP for encryption and PSS for signatures.
- **Never expose decryption errors.** Failure must look identical in content and timing.
- **Generate keys in a vetted library or HSM**, and audit public keys for known weakness.
- **Don't use RSA to encrypt data directly.** Encrypt a symmetric key, then use AEAD. That's hybrid encryption.
- **Separate keys by purpose.** Using one key for both signing and decryption can let one operation attack the other.

## Pitfalls

- **"Bigger keys fix it."** Padding attacks don't care about key size.
- **"`e = 3` is faster, so fine."** Only with correct padding and strict verification. Use 65537.
- **"Sign then encrypt is obviously right."** The order matters, and it's easy to get wrong. Use a vetted construction.
- **Rolling RSA by hand in a language's big integers.** That's textbook RSA, with timing leaks.
- **Assuming a generic error hides everything.** Response timing can still leak the answer.

?? Why is textbook RSA unsafe even with a 4096-bit key?
+ It's deterministic, and ciphertexts can be multiplied
- Its private exponent is shown in certificates
- Its modulus turns prime at that size
- Its public exponent must always remain secret
=> Security requires randomness and non-malleability, and textbook RSA has neither. Key size doesn't change that.

## Exercise

::: law Lab only
Generate and test only your own keys and your own servers.
:::

1. Generate a key with `openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048`. Print it with `openssl pkey -text -noout`, and find `n`, `e`, `p` and `q`.
2. In Python, check `n == p*q`, and compute `d` yourself.
3. Show malleability with the toy key: multiply a ciphertext by `pow(2, 17, 3233)`, decrypt it, and compare.
4. Encrypt a short message twice with OAEP, and compare the ciphertexts. Explain why they differ.
5. Run `testssl.sh` against a TLS server in your lab. Read the ROBOT line, and check which key exchanges are on offer.

?! An old payment device can only do RSA key exchange with PKCS#1 v1.5. Write a risk statement, and propose how you'd contain it until it's replaced.

## Further reading

- [RFC 8017](https://www.rfc-editor.org/rfc/rfc8017), PKCS #1 v2.2.
- [Twenty Years of Attacks on the RSA Cryptosystem](https://crypto.stanford.edu/~dabo/papers/RSA-survey.pdf), by Dan Boneh.
- [The ROBOT attack](https://robotattack.org/), on a 19-year-old flaw.
- [ROCA](https://github.com/crocs-muni/roca), on flawed key generation.
- [Cryptopals Set 6](https://cryptopals.com/sets/6), for hands-on RSA attacks against your own code.
