---
title: Hashes and symmetric encryption
summary: Encoding, hashing, encryption and MACs: what each does, which to use, and how they fail.
month: 6
minutes: 35
builds: tell encoding, hashing and encryption apart for good, the classic interview question
source: Serious Cryptography, or free, CryptoHack | https://cryptohack.org/
words: hash, symmetric encryption, nonce
---
"Hashing versus encryption versus encoding" is an interview classic, and getting it wrong is a red flag. You don't need the mathematics. You need to know what each tool promises, and how people misuse it. The roadmap is clear: use cryptography correctly, don't design it.

@term encoding = Changing data's format, with no secret and no protection.
@term cryptographic hash = A one-way function giving a fixed-size fingerprint of data.
@term encryption = Scrambling data with a key so that only key holders can read it.
@term symmetric encryption = Encryption where the same key locks and unlocks.
@term AES = The standard symmetric cipher, used almost everywhere.
@term AES-GCM = AES in a mode that both encrypts data and detects tampering.
@term nonce = A number used only once with a key.
@term HMAC = A keyed hash that proves a message came from someone holding the key and wasn't changed.
@term SHA-256 = A widely used cryptographic hash from the SHA-2 family.
@term ECB mode = An insecure way of using a block cipher that reveals patterns.

## Three different jobs

| | Purpose | Reversible? | Key? | Example |
|---|---|---|---|---|
| **Encoding** | Change the format | Yes, by anyone | No | Base64, hex, URL encoding |
| **Hashing** | Fingerprint | No | No | SHA-256 |
| **Encryption** | Keep it secret | Yes, with the key | Yes | AES-GCM |

::: key
Encoding is not security. If there's no key, it isn't protecting anything.
:::

@drill crypto-kind

## Hashes

A **cryptographic hash** turns any input into a fixed-size fingerprint:

```
$ echo -n "hello" | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

Three properties matter:

- **One-way:** you can't get the input back.
- **Collision-resistant:** you can't find two inputs with the same hash.
- **Avalanche:** change one bit and the whole output changes.

Uses: checking that a download wasn't altered, identifying malware samples, and as a building block for signatures. **MD5 and SHA-1 are broken** for security: collisions can be made on purpose. Use SHA-256 or SHA-3. NIST's [hash standards](https://csrc.nist.gov/projects/hash-functions) list what's approved.

?? You publish a file with its SHA-256 next to it, on the same web page. What does that protect against?
+ Accidental corruption of the file during its download
- An attacker who controls that whole web page
- Anyone reading the file while it's in transit
- A person who has stolen your signing key
=> A hash alone has no secret, so an attacker who changes the file can change the hash too. Stopping that takes a signature, in the next lesson.

## Symmetric encryption

**Symmetric** means one shared key, like a house key. **AES** is the standard cipher. It works on 16-byte blocks, and how you chain those blocks is the **mode**, which matters as much as the cipher.

**AES-GCM** is the normal choice. It's **authenticated encryption**: it encrypts and also detects tampering. Older modes only hide data, so an attacker can flip bits undetected.

Each encryption needs a **nonce**, a value that must never repeat with the same key.

```python
import os
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

key = AESGCM.generate_key(bit_length=256)
nonce = os.urandom(12)
ct = AESGCM(key).encrypt(nonce, b"secret", None)
```

Notice that this uses the well-reviewed [`cryptography`](https://cryptography.io/) library. You're combining trusted parts, not inventing any.

## How it fails

| Failure | What goes wrong |
|---|---|
| **ECB mode** | Each block is encrypted alone, so identical blocks look identical and patterns show |
| **Nonce reuse** | In GCM, repeating a nonce with a key can reveal plaintext and allow forgeries |
| **Hard-coded keys** | The key is in the code, and the code ends up on GitHub |
| **Homemade crypto** | It looks scrambled and falls to the first expert |
| **Weak randomness** | `random()` is predictable. Use `secrets` or `os.urandom` |

?? Which of these should you do when you need to encrypt data?
+ Use a reviewed library that offers AES-GCM
- Design a cipher nobody can look up
- Base64 the data twice for extra strength
- Use MD5 because it runs much faster
=> Secrecy of method isn't security. Base64 and MD5 aren't encryption at all.

## HMAC: integrity with a key

A hash proves nothing about who made it. An **HMAC** mixes a secret key into the hash, so only key holders can produce a valid one. Webhooks and JWTs with HS256 use this.

?? A server stores `sha256(password)`, and an attacker steals the table. Are the passwords safe?
+ No, fast hashes are cheap to brute force
- Yes, because all hashes can never be reversed
- Yes, if each hash is also Base64 encoded
- No, because SHA-256 can be simply decrypted back
=> Hashes aren't decrypted, they're guessed. Attackers hash billions of candidates a second until one matches. Password storage needs something deliberately slow, coming up in lesson 40.

::: try Practise
Join [CryptoHack](https://cryptohack.org/) and do the Introduction and General sections. Your gate asks for 30 or more challenges. [CyberChef](https://gchq.github.io/CyberChef/) is great for playing with encodings and hashes.
:::

?! Explain to a developer why Base64 doesn't protect a password in a config file. What should they do instead?
