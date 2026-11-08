---
title: Hash function internals
summary: How a hash is built, why SHA-256 has a length-extension problem that SHA-3 doesn't, what the birthday bound means, and how collisions became real.
level: intermediate
side: both
minutes: 45
attack: none
needs: 0038-hashes-and-symmetric-crypto, 03-01-crypto-foundations
pair: 03-10-password-cracking
source: NIST FIPS 202, SHA-3 Standard | https://csrc.nist.gov/pubs/fips/202/final
words: Merkle-Damgård, length extension, birthday bound
---
Hashes appear everywhere: passwords, signatures, Git, TLS, blockchains. Lesson 38 treated one as a black box. Open it, and several puzzling rules make sense, such as why you can't build a MAC by hashing a key and a message together, or why a 256-bit hash gives only 128 bits of collision resistance.

@term Merkle-Damgård construction = A way to build a hash by repeatedly compressing message blocks into a fixed-size state.
@term length-extension attack = Using a hash output as a starting state to compute the hash of a longer message.
@term birthday bound = The fact that collisions in an n-bit hash appear after about 2^(n/2) tries, not 2^n.
@term sponge construction = A hash design that absorbs input into a large state, then squeezes output from it.
@term Merkle tree = A tree of hashes in which the root commits to every leaf, and one leaf can be proved cheaply.

## Concept

### Fundamentals: three properties

| Property | Meaning | Work for an n-bit hash |
|---|---|---|
| Preimage resistance | Given `h`, find any `m` with `H(m) = h` | 2^n |
| Second-preimage resistance | Given `m`, find a different `m'` with the same hash | 2^n |
| Collision resistance | Find any two messages with the same hash | 2^(n/2) |

Collisions are the easiest to find because the attacker chooses both inputs.

### The birthday bound

In a room of 23 people, two share a birthday with a probability above 50%. There are only 365 days, but 253 pairs. Likewise, hashing about `2^(n/2)` random inputs is likely to produce a collision. So SHA-256 offers 128 bits of collision resistance, and MD5's 128-bit output offers only 64 bits, even with no flaws. A flaw just lowers it further.

### Merkle-Damgård

MD5, SHA-1 and SHA-2 share one design. Pad the message, split it into blocks, then feed them one at a time through a compression function, starting from a fixed initial value.

@flow Fixed IV > Compress block 1 > Compress block 2 > Compress block n > Output is the final state

Padding appends a 1 bit, zeros and the message length. It's a neat design, with a proof: if the compression function is collision-resistant, so is the hash. But see what the output is: **the entire internal state**.

### Length extension

Because the output is the state, anyone holding `H(m)` can carry on hashing from there, without knowing `m`. They only need its length. So someone can compute `H(m || padding || extra)`.

This breaks the naive MAC. If a service signs with `H(secret || data)`, an attacker who sees one valid tag can produce a valid tag for `data || padding || anything`, with no secret needed. A [real example](https://vnhacker.blogspot.com/2009/09/flickrs-api-signature-forgery.html) hit Flickr's API in 2009. **HMAC** was designed for this very reason. It hashes twice, with derived inner and outer keys, so the output never exposes a state an attacker can extend.

```
HMAC(k, m) = H((k ⊕ opad) || H((k ⊕ ipad) || m))
```

### Advanced: sponges and the state of collisions

**SHA-3** uses a sponge, not Merkle-Damgård. It has a 1600-bit state split into a *rate* and a *capacity*. Input is absorbed into the rate, and the capacity stays hidden. Because the output doesn't reveal the full state, length extension simply doesn't apply. SHA-3 came from a public NIST competition won by Keccak in 2012, and it was chosen as a *different design* from SHA-2, not because SHA-2 had failed. Truncated variants such as SHA-512/256 and BLAKE2 and BLAKE3 also avoid the attack.

**Collisions became practical.**

| Year | Event |
|---|---|
| 2004 | Wang and others publish MD5 collisions |
| 2008 | [Researchers forge a rogue CA certificate](https://www.win.tue.nl/hashclash/rogue-ca/) with an MD5 chosen-prefix collision |
| 2012 | The Flame malware uses an MD5 collision to fake Microsoft code signing |
| 2017 | [SHAttered](https://shattered.io/) gives the first public SHA-1 collision |
| 2020 | [SHA-1 is a Shambles](https://sha-mbles.github.io/) makes chosen-prefix collisions practical |

A **chosen-prefix** collision is far more dangerous than a plain one: the attacker picks two meaningful prefixes, then finds suffixes that make the hashes match. That can forge certificates. NIST plans to [retire SHA-1](https://www.nist.gov/news-events/news/2022/12/nist-retires-sha-1-cryptographic-algorithm) by the end of 2030.

**Merkle trees** hash pairs up to a single root. So a short path can prove that one item belongs, and this underlies Git, Certificate Transparency and blockchains.

?? Why is `SHA-256(secret || message)` unsafe as a MAC?
+ The output lets anyone continue hashing further
- SHA-256 output is short enough to guess
- The secret appears in the hash directly
- SHA-256 can't hash a key at all
=> Merkle-Damgård output is the internal state, so an attacker can extend the message and compute a valid tag without the secret.

## Threat model

Hash weaknesses matter when something **trusts** a hash: certificates, code signing, deduplication, integrity checks. If an attacker can produce a collision, then a signature on one document also covers the other. Git used SHA-1, and it added collision detection after SHAttered. The classification of malware by MD5 is also vulnerable: two files can share a hash and behave differently, so analysts should prefer SHA-256.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `sha256sum`, `sha3sum`, `b3sum` | Compute hashes | Checking integrity |
| Python `hashlib`, `hmac` | Hashing and HMAC | Scripting |
| `openssl dgst` | Many algorithms | Comparing outputs |
| `sha1collisiondetection` | Detects SHAttered-style files | Checking a suspicious file |
| CyberChef | Quick hash recipes | Triage |

## Defence

- **Use HMAC or a keyed hash** such as BLAKE2's keyed mode for message authentication, never a plain hash.
- **Use SHA-256 or better** for new designs. Retire MD5 and SHA-1 from anything that trusts collision resistance.
- **Compare tags in constant time**, with `hmac.compare_digest`.
- **Use a password hash for passwords.** General hashes are too fast. See [Password cracking](/modules/03-10-password-cracking/).
- **Hash the whole context.** Encode inputs unambiguously, or `("ab", "c")` and `("a", "bc")` will collide.

## Pitfalls

- **"SHA-256 gives 256-bit security."** Against preimages. It's 128 for collisions.
- **"MD5 is fine for checksums."** Against accidents, yes. Against an attacker, no.
- **"Hashing is encryption."** There's no key and no way back.
- **"SHA-3 replaced SHA-2."** Both are standard, and SHA-2 remains unbroken.
- **Hashing concatenated fields without separators.** That's a classic source of ambiguity bugs.

?? How many hashes give a likely collision in a 160-bit hash, ignoring flaws?
+ About `2^80`
- About `2^40`
- About `2^120`
- About `2^160`
=> The birthday bound is the square root of the output space, so half the bits. SHA-1's real attacks are cheaper still.

## Exercise

::: law Lab only
Use your own files. The collision files from SHAttered are public test data, and they're safe to download and hash.
:::

1. Download the two SHAttered PDFs. Confirm that their `sha1sum` values match and their `sha256sum` values don't.
2. Write a birthday search on the first 24 bits of SHA-256. Record how many tries it takes, on average, over 20 runs. Compare that to `2^12`.
3. Compute `hmac.new(key, msg, 'sha256')`, then build the same value by hand from the formula above.
4. Hash the empty string with SHA-256 and SHA-512/256, and read why the second resists length extension.
5. Complete Cryptopals [challenge 29](https://cryptopals.com/sets/4/challenges/29), on your own local service.

?! A colleague says "we only use MD5 for file deduplication, so it's fine". When are they right, and when are they wrong? Think about who controls the files.

## Further reading

- [FIPS 202](https://csrc.nist.gov/pubs/fips/202/final), SHA-3.
- [FIPS 180-4](https://csrc.nist.gov/pubs/fips/180-4/upd1/final), SHA-2.
- [RFC 2104](https://www.rfc-editor.org/rfc/rfc2104), HMAC.
- [SHAttered](https://shattered.io/), the first SHA-1 collision.
- [The Keccak team's site](https://keccak.team/), for sponges.
