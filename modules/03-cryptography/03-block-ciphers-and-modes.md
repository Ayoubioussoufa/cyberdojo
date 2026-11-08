---
title: Block ciphers and modes
summary: Inside AES, why a block cipher alone is useless, how ECB, CBC, CTR and GCM differ, and why authenticated encryption is the only default that makes sense.
level: intermediate
side: both
minutes: 55
attack: T1573.001, T1600.001
needs: 03-01-crypto-foundations
pair: 03-09-breaking-bad-crypto
source: NIST FIPS 197, the Advanced Encryption Standard | https://csrc.nist.gov/pubs/fips/197/final
words: block cipher, mode of operation, AEAD
---
AES is one of the most scrutinised algorithms in existence, and in practice it's almost never the thing that breaks. What breaks is how it's used. A block cipher only encrypts one fixed-size block, so everything real depends on the *mode* around it. That's where most symmetric failures live.

@term block cipher = A keyed permutation that turns one fixed-size block into another.
@term S-box = A lookup table inside a cipher that makes the output a non-linear function of the input.
@term mode of operation = The recipe for using a block cipher on data longer than one block.
@term initialization vector (IV) = A value that makes each encryption start differently, so equal messages don't encrypt equally.
@term AEAD = Authenticated encryption with associated data: encryption that also proves the data is unchanged.
@term stream cipher = A cipher that generates a keystream and XORs it with the message.

## Concept

### Fundamentals: confusion and diffusion

Shannon named the two properties a cipher needs. **Confusion** hides the relationship between key and ciphertext. **Diffusion** spreads each input bit across the output, so changing one bit changes about half the output.

There are two classic designs. A **Feistel network**, as in DES, splits the block and mixes one half into the other. A **substitution-permutation network**, as in AES, transforms the whole block in each round.

### Inside AES

AES has a 128-bit block arranged as a 4×4 grid of bytes. It uses 10, 12 or 14 rounds, for keys of 128, 192 or 256 bits. Each round has four steps:

| Step | What it does | Provides |
|---|---|---|
| SubBytes | Replaces each byte through an **S-box** | Confusion |
| ShiftRows | Rotates the rows | Diffusion across columns |
| MixColumns | Mixes each column by matrix multiplication | Diffusion within columns |
| AddRoundKey | XORs in a key derived from the key schedule | Key dependence |

After two rounds, every output bit depends on every input bit. The best known attacks on full AES save only a couple of bits over brute force. Modern CPUs have dedicated AES instructions, which are fast and also remove the cache-timing risk of table-based software.

### Modes

| Mode | How it works | Random access | Weakness |
|---|---|---|---|
| **ECB** | Each block alone | Yes | Equal blocks give equal ciphertext |
| **CBC** | XOR with the previous ciphertext | Decrypt only | Needs an unpredictable IV, malleable, padding |
| **CTR** | Encrypts a counter, XORs the result | Yes | A repeated counter is catastrophic |
| **GCM** | CTR plus an authentication tag | Yes | A repeated nonce is catastrophic |
| **XTS** | Tweaked per sector | Yes | Disk encryption only, no authentication |

**ECB** fails the IND-CPA game at once, which is the famous encrypted-penguin image: the outline survives. CBC chains each block into the next. CTR turns a block cipher into a stream cipher, and that means a reused counter is a reused one-time pad.

### Stream ciphers and AEAD

**ChaCha20** is a stream cipher built from add, rotate and XOR, with no tables, so it's fast and constant-time in software. It's common on devices without AES hardware. RC4, an old stream cipher, has biases that broke it in practice, and it's banned in TLS by [RFC 7465](https://www.rfc-editor.org/rfc/rfc7465).

Encryption isn't integrity. In CTR mode, flipping a ciphertext bit flips the same plaintext bit, so an attacker can alter a message without reading it. That's **malleability**. So **AEAD** combines encryption with a tag, and decryption refuses if the tag fails. The two standard choices are **AES-GCM** and **ChaCha20-Poly1305** ([RFC 8439](https://www.rfc-editor.org/rfc/rfc8439)). *Associated data* is authenticated without being encrypted, such as a header.

Historically, people built this by hand. **Encrypt-then-MAC** is safe. MAC-then-encrypt led to padding oracles. AEAD ends that debate.

### Advanced: the nonce problem

GCM's Achilles heel is its 96-bit nonce. Reuse one with a key, and you lose confidentiality for those messages, plus the authentication key, which allows forgery. [Böck and others](https://www.usenix.org/conference/woot16/workshop-program/presentation/bock) found real TLS servers doing that in 2016. Random nonces also have a limit: by the birthday bound, collisions become likely well before 2^48 messages, so [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final) caps random-nonce use at 2^32 encryptions per key.

Two responses exist. **AES-GCM-SIV** ([RFC 8452](https://www.rfc-editor.org/rfc/rfc8452)) is misuse-resistant: a repeated nonce only reveals whether two messages are identical. **XChaCha20** has a 192-bit nonce, so random nonces become safe.

?? In CTR mode, what happens if one counter value is reused with a key?
+ The XOR of two plaintexts is exposed
- The block cipher's key becomes readable directly
- The ciphertext simply fails to decrypt later
- Both of the messages become exactly identical
=> CTR makes a keystream, so a reuse is a two-time pad. The key stays safe, but the messages don't.

## Threat model

Encryption protects attackers too: C2 channels use symmetric encryption ([T1573.001](https://attack.mitre.org/techniques/T1573/001/)), and a device compromise may include reducing key strength ([T1600.001](https://attack.mitre.org/techniques/T1600/001/)). For defenders, the usual failures are structural:

| Failure | Consequence |
|---|---|
| ECB anywhere | Patterns in the data leak |
| No authentication | Tampering goes unnoticed |
| Reused nonce or IV | Plaintext or forgery exposure |
| Fixed IV | Equal prefixes visible |
| Key in the same place as the data | Encryption protects nothing |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `openssl enc`, `openssl speed` | Encrypts, benchmarks | Lab work, and checking AES hardware speed |
| Python `cryptography` | High-level AEAD | Writing real code |
| CyberChef | Modes side by side | Comparing outputs |
| Semgrep, CodeQL | Spot `ECB` or fixed IVs | Reviewing code |
| Cryptopals sets 2 and 3 | Break modes | Learning by doing |

## Defence

- **Default to AEAD.** Use AES-256-GCM or ChaCha20-Poly1305 from a high-level API.
- **Never manage nonces by hand** if your library offers a safe alternative. Use a counter or XChaCha20, with a key rotation policy.
- **Fail closed.** Return nothing from a failed decryption, and don't give distinct error messages.
- **Search code** for `ECB`, hardcoded IVs, `MD5` keys and homemade padding.
- **Separate keys by purpose.** Don't encrypt and authenticate with the same key.

## Pitfalls

- **"AES is secure, so we're secure."** AES-ECB is AES.
- **"Encrypted means tamper-proof."** Without a tag, it isn't.
- **"An IV is a secret."** It isn't: it just must be unique or unpredictable, depending on the mode.
- **Reusing CBC's unpredictable-IV rule for CTR.** Each mode has different requirements.
- **Checking the tag after using the plaintext.** Streaming APIs can release unverified data. Wait for verification.

?? Which property does GCM add that plain CTR lacks?
+ Detection of any change to the ciphertext
- A larger block size for each message
- Protection against reusing the same nonce twice
- Faster key setup on all small devices
=> GCM adds an authentication tag, so tampering fails decryption. It's actually worse than CTR when a nonce repeats.

## Exercise

::: law Lab only
Use your own files and keys. Everything here runs on your own machine.
:::

1. Encrypt a BMP image with AES-ECB, using `openssl enc -aes-128-ecb -nosalt -pass pass:lab`, restore its header, and view it. Then do the same with CBC, and compare.
2. In Python's `cryptography` library, encrypt with AES-GCM. Flip one ciphertext bit, and read the exception.
3. Encrypt in AES-CTR, flip one bit, and decrypt. What changed? Why does this matter for a field like `amount=100`?
4. Encrypt two sentences in CTR with the same nonce on purpose, then XOR the ciphertexts to get the XOR of the plaintexts.
5. Run `openssl speed -evp aes-128-gcm` and `chacha20-poly1305`, and explain which one you'd pick for a cheap IoT device.

?! You're reviewing code that uses AES-CBC with a static IV and no MAC. List every problem, in order of severity, and write the replacement design in three lines.

## Further reading

- [FIPS 197](https://csrc.nist.gov/pubs/fips/197/final), the AES standard.
- [NIST SP 800-38A](https://csrc.nist.gov/pubs/sp/800/38/a/final), on the classic modes.
- [NIST SP 800-38D](https://csrc.nist.gov/pubs/sp/800/38/d/final), on GCM and its limits.
- [RFC 8439](https://www.rfc-editor.org/rfc/rfc8439), ChaCha20 and Poly1305.
- [Cryptopals Set 2](https://cryptopals.com/sets/2), on breaking block modes.
