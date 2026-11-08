---
title: Cryptography foundations
summary: What it means for a cipher to be secure. Kerckhoffs's principle, attacker models, classical ciphers, the one-time pad, and the formal definitions behind modern cryptography.
level: foundation
side: both
minutes: 45
attack: T1600
needs: 0038-hashes-and-symmetric-crypto
source: Boneh and Shoup, A Graduate Course in Applied Cryptography | https://toc.cryptobook.us/
words: Kerckhoffs's principle, one-time pad, semantic security
---
Lesson 38 taught you what to use. This domain teaches why it's safe, and how it fails. It starts with a question that took centuries to phrase well: what does "secure" actually mean? A cipher that looks scrambled proves nothing. Modern cryptography earned its name by defining security precisely, then proving constructions against that definition.

@term Kerckhoffs's principle = A system must stay secure even if everything about it except the key is public.
@term one-time pad = A cipher that XORs the message with a truly random key of the same length, used once.
@term semantic security = The property that a ciphertext reveals nothing useful about its plaintext to an efficient attacker.
@term IND-CPA = Indistinguishability under chosen-plaintext attack: an attacker can't tell which of two chosen messages was encrypted.
@term IND-CCA = The stronger version of IND-CPA, in which the attacker may also ask for decryptions.

## Concept

### Fundamentals: three goals and one principle

Cryptography offers three separate things. **Confidentiality** hides content. **Integrity** detects changes. **Authenticity** proves origin. Encryption alone only gives the first, and much of this domain comes back to that fact.

In 1883, Auguste Kerckhoffs wrote that a system should stay safe when it falls into enemy hands. So everything may be public except the key. There's a practical reason as well as a theoretical one: an algorithm is hard to change and spreads widely, while a key is small and replaceable. Public scrutiny is also the only way that anyone gains confidence in a cipher. Anything sold as "proprietary military-grade encryption" should worry you.

### Classical ciphers and their lesson

A **Caesar cipher** shifts each letter, leaving 25 possible keys. A general **substitution cipher** has about 2^88 keys, which is too many to try. Yet it falls in minutes, because **frequency analysis** doesn't search keys at all: `E` is the most common English letter, so the most common ciphertext letter is probably `E`.

**Vigenère** uses a repeating key to flatten those frequencies, and it stood for centuries. But a repeating key means repeating alignment, so once you find the key's length, it becomes several Caesar ciphers.

The lesson has lasted: **a large key space is necessary, not sufficient.** Attackers go after structure.

### The one-time pad

XOR the message with a random key of the same length, and use that key once. Claude Shannon proved in 1949 that this gives **perfect secrecy**: the ciphertext tells you nothing, because every plaintext of that length is equally possible. He also proved the price: the key must be at least as long as the message. That makes it impractical for almost everything.

Reuse destroys it. If `C1 = P1 ⊕ K` and `C2 = P2 ⊕ K`, then `C1 ⊕ C2 = P1 ⊕ P2`. The key is gone, leaving two plaintexts mixed together, and redundancy in language lets you pull them apart. The Soviet Union reused pads, and the US Venona project read their traffic for decades.

### Advanced: formal definitions

Modern ciphers accept a weaker goal than perfection: they must be secure against attackers with limited computing power.

**The game.** IND-CPA is defined as a game. The attacker picks two messages of equal length. The challenger encrypts one at random. The attacker may encrypt anything else they like. If they can guess which message it was noticeably better than chance, the scheme fails.

This has a striking consequence: **deterministic encryption can't be IND-CPA secure**. If encrypting the same message gives the same ciphertext, the attacker just encrypts both messages and compares. So secure encryption must be randomised, or stateful, which is why IVs and nonces exist.

**Attacker models,** from weakest to strongest:

| Model | The attacker has |
|---|---|
| Ciphertext-only | Intercepted ciphertext |
| Known-plaintext | Some plaintext and ciphertext pairs |
| Chosen-plaintext | The ability to encrypt what they choose |
| Chosen-ciphertext | The ability to decrypt what they choose, except the target |

Real systems often hand attackers these powers by accident. A server that reveals whether decryption failed gives a limited decryption oracle, which is the root of [padding oracle attacks](/modules/03-09-breaking-bad-crypto/). That's why modern protocols target IND-CCA, reached in practice with authenticated encryption.

**Security levels** are stated in bits. An n-bit level means roughly 2^n work for the best known attack. 128 bits is the usual modern target, and it's far beyond any brute force.

?? Why does a one-time pad fail when one key encrypts two messages?
+ XOR of the ciphertexts cancels the key
- The key's length falls below the message
- The second message overwrites the first key
- The cipher falls back to block mode
=> `C1 ⊕ C2` equals `P1 ⊕ P2`, so the key vanishes and only the structure of the two plaintexts remains to be separated.

## Threat model

Cryptographic algorithms are rarely broken head-on. Attackers go around them, by stealing keys, abusing implementations, or forcing weak settings. That last one has a technique of its own: [T1600](https://attack.mitre.org/techniques/T1600/), Weaken Encryption, in which an attacker reduces the protection on a network device. The rest of this domain looks at each way around.

Ask three questions of any design: what does the attacker see, what can they cause, and what happens when a key leaks?

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Python | Bit-level experiments | Learning by building |
| CyberChef | Encoding and cipher recipes | Decoding a blob during analysis |
| `openssl rand -hex 16` | Random bytes | Making keys for a lab |
| [Cryptopals](https://cryptopals.com/) | Graded crypto challenges | Real practice on broken systems |
| libsodium, Tink | Misuse-resistant libraries | Actual engineering |

## Defence

- **Don't design your own primitives or protocols.** Use libsodium, Tink, or your platform's vetted library.
- **Choose by security level**, and follow published guidance such as [NIST SP 800-57](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final) for key sizes.
- **Require authenticated encryption** by default, so that chosen-ciphertext attacks have nothing to use.
- **Plan for change.** Crypto agility means that you can replace an algorithm without rewriting your system.
- **Have designs reviewed** by someone who breaks crypto for a living, and treat "secret algorithm" as a red flag in procurement.

## Pitfalls

- **"Encoded means encrypted."** Base64 and hex hide nothing.
- **"It looks random, so it's secure."** Output that looks scrambled proves nothing about structure.
- **"XOR with a short key is a one-time pad."** A repeating key is Vigenère, and it breaks in seconds.
- **"256 bits is twice as strong as 128."** Each bit doubles the work, so it's 2^128 times harder, and both are out of reach.
- **"Proven secure means unbreakable."** A proof rests on a model and assumptions. Side channels and bugs sit outside it.

?? A vendor says its cipher is safe because the algorithm is secret. What's the flaw?
+ Security must rest on the key alone
- Secret algorithms always run far too slowly
- Regulators require every algorithm to be published
- Hidden algorithms can't use any random keys
=> Algorithms leak through reverse engineering and can't be rotated, so all the security has to sit in the replaceable key.

## Exercise

::: law Lab only
Use your own data and practice sites such as Cryptopals. Don't try to decrypt communications that aren't yours.
:::

1. In Python, write a Caesar cipher, then break it using letter frequencies rather than trying all 25 keys.
2. Write `xor(a, b)` for byte strings. Encrypt two English sentences with one random key. XOR the two ciphertexts, then guess a common word such as ` the ` at each position, and watch readable fragments of the other message appear.
3. Encrypt the same block twice with a deterministic scheme of your own, and explain why this fails the IND-CPA game.
4. Complete Cryptopals [Set 1](https://cryptopals.com/sets/1).

?! Explain to a developer why encrypting the same value always to the same ciphertext is a weakness, even if the key stays secret. Give a real example where it would leak something.

## Further reading

- [A Graduate Course in Applied Cryptography](https://toc.cryptobook.us/), free, and the standard for Master's study.
- Jonathan Katz and Yehuda Lindell, *Introduction to Modern Cryptography*, the classic textbook.
- Claude Shannon, [Communication Theory of Secrecy Systems](https://pages.cs.wisc.edu/~rist/642-spring-2014/shannon-secrecy.pdf), 1949.
- [Cryptopals](https://cryptopals.com/), the best way to learn by breaking.
- [CyBOK Cryptography knowledge area](https://www.cybok.org/knowledgebase1_1/), for the field's map.
