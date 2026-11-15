---
title: Hashes and symmetric encryption
summary: Encoding, hashing, encryption and MACs: what each does, which to use, and how they fail.
month: 6
minutes: 60
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

See all three kinds of output for the same five letters, in your own terminal:

```
$ echo -n "hello" | base64
aGVsbG8=
$ echo -n "hello" | xxd -p
68656c6c6f
$ echo -n "aGVsbG8=" | base64 -d
hello
```

The `-n` stops `echo` adding a newline, which would otherwise become part of the data. The last line is the whole lesson about encoding: you reversed it with no key, and so can everyone else.

Each encoding has a look, and recognising it on sight saves time in every investigation:

| Encoding | Looks like | Tell-tale sign |
|---|---|---|
| Hex | `68656c6c6f` | Only `0-9` and `a-f`, and an even number of characters |
| Base64 | `aGVsbG8=` | Letters in both cases, digits, `+` and `/`, often ending in `=` |
| URL encoding | `red%20boots` | `%` followed by two hex digits |

::: key
Encoding is not security. If there's no key, it isn't protecting anything.
:::

@drill crypto-kind

?? Does Base64 protect data?
+ No, as anyone can reverse it
- Yes, as it scrambles the data
- Yes, as only servers can decode
- No, as it only handles numbers
=> With no key, it's a change of format and nothing more.

## Hashes

A **cryptographic hash** turns any input into a fixed-size fingerprint:

```
$ echo -n "hello" | sha256sum
2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
```

`sha256sum` also works on files, and that's its everyday use. A project publishes a list of hashes, you download the file, and you compare:

```
$ sha256sum ubuntu.iso
$ sha256sum -c SHA256SUMS
ubuntu.iso: OK
```

The first command prints the file's hash for you to compare by eye. The second reads a list of expected hashes and checks each file itself, which is safer than your eyes on 64 characters.

Three properties matter:

- **One-way:** you can't get the input back.
- **Collision-resistant:** you can't find two inputs with the same hash.
- **Avalanche:** change one bit and the whole output changes.

Watch the avalanche. Change the last letter of the input, one step along the alphabet:

```
hello   2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
hellp   fdd7585e08c4e2afd71dcabdb4636c89d557a3f42db9e2040c8bbd1708aa4ce7
```

Nothing in the second hash resembles the first. That's why a hash is a trustworthy fingerprint, and why two hashes that are "nearly the same" mean nothing at all: they match exactly or the data differs.

The output length tells you which function made a hash, and reports often give the value without naming it:

| Function | Hex characters | Status |
|---|---|---|
| MD5 | 32 | Broken. Still used as a file label in malware reports |
| SHA-1 | 40 | Broken |
| SHA-256 | 64 | Current standard |

@code hash-kind

Comparing a file with its published hash is two lines of Python, plus a little care: people paste hashes in upper case and with spaces around them.

@code matches-hash

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

Install the library in your virtual environment with `pip install cryptography`, add two lines, and you have the full round trip:

```python
pt = AESGCM(key).decrypt(nonce, ct, None)        # b"secret"

damaged = bytes([ct[0] ^ 1]) + ct[1:]            # flip one bit of the ciphertext
AESGCM(key).decrypt(nonce, damaged, None)        # raises cryptography.exceptions.InvalidTag
```

There are four things on the table, and it helps to say what happens to each:

| Thing | Secret? | What you do with it |
|---|---|---|
| Key | Yes | Keep it out of the code. Whoever has it can read everything |
| Nonce | No | Store it beside the ciphertext. Never use the same one twice with a key |
| Ciphertext | No | Store or send it. It includes a short tag at the end |
| Plaintext | Yes | The data you were protecting |

The ciphertext here is 22 bytes for a 6-byte message: the 16 extra bytes are the **tag**. On decryption the library recomputes it, and if a single bit of the ciphertext, the nonce or the key is wrong, you get `InvalidTag` and no data at all. That refusal is the "detects tampering" promise in action.

?? Why is AES-GCM the normal choice?
+ It also detects any tampering
- It never needs a key
- It runs without any nonce
- It can't ever be misused
=> Authenticated encryption protects integrity as well as secrecy.

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

Python has it in the standard library:

```python
import hmac, hashlib

key = b"k3y"
tag = hmac.new(key, b"amount=100", hashlib.sha256).hexdigest()
# 7a9c5ea080b9ca5ac916cc47557769a1189824f3892120b2487d45ead0480caf
```

The sender transmits the message with its tag. The receiver, who holds the same key, computes the tag again over what arrived and compares. If someone changed `amount=100` to `amount=900` on the way, they can't produce the matching tag, because they don't have the key.

Compare with `hmac.compare_digest(a, b)` and not with `==`. A normal comparison stops at the first character that differs, so the time it takes leaks how much of a guess was right. `compare_digest` always takes the same time.

@code verify-hmac

?? A server stores `sha256(password)`, and an attacker steals the table. Are the passwords safe?
+ No, fast hashes are cheap to brute force
- Yes, because all hashes can never be reversed
- Yes, if each hash is also Base64 encoded
- No, because SHA-256 can be simply decrypted back
=> Hashes aren't decrypted, they're guessed. Attackers hash billions of candidates a second until one matches. Password storage needs something deliberately slow, coming up in lesson 40.

::: try Practise
Join [CryptoHack](https://cryptohack.org/) and do the Introduction and General sections. Your gate asks for 30 or more challenges. [CyberChef](https://gchq.github.io/CyberChef/) is great for playing with encodings and hashes.
:::

## Pick the right tool

Most cryptography mistakes in real code aren't broken mathematics. They're the wrong tool for the job. Decide each of these before you read the choices.

?? An application must store an API token and send it to another service every hour. Which tool fits?
+ Encryption, because the app needs it back
- Hashing, because nobody should ever read it
- Encoding, because Base64 hides the value well
- An HMAC, because the token is secret
=> A hash can't be turned back into the token, so the app could never send it. Encoding protects nothing. Encrypt it, and keep the key somewhere else.

?? A malware report lists a sample as `5d41402abc4b2a76b9719d911017c592`. What is that value?
+ An MD5 hash, going by its length
- A SHA-256 hash, going by its length
- A Base64 string, going by its letters
- An AES key, going by its digits
=> 32 hex characters is MD5. It's too weak to prove anything, but it's still widely used as a quick name for a file.

?? Decrypting with AES-GCM raises `InvalidTag`. What do you know?
+ The key, nonce or ciphertext isn't right
- The message was empty to begin with
- The library needs a much newer Python
- The data was only ever Base64 encoded
=> The tag didn't match, so the library refuses to return anything. Either the data was changed or you're using the wrong key or nonce, and you can't tell which.

?! Explain to a developer why Base64 doesn't protect a password in a config file. What should they do instead?
