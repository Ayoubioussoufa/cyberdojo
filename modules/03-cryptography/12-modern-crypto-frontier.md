---
title: The crypto frontier
summary: Post-quantum migration, end-to-end messaging, zero-knowledge proofs, multi-party computation and homomorphic encryption. What each one solves, and what's actually deployed.
level: advanced
side: defence
minutes: 55
attack: none
needs: 03-06-diffie-hellman-and-elliptic-curves, 03-08-tls-internals
pair: 03-08-tls-internals
source: NIST IR 8547, Transition to Post-Quantum Cryptography Standards | https://csrc.nist.gov/pubs/ir/8547/final
words: post-quantum, double ratchet, zero-knowledge proof
---
Most of cryptography protects data in transit and at rest. The frontier asks harder questions. What if a quantum computer arrives? What if the server itself isn't trusted? Can you prove something without revealing it, or compute on data that you can't read? Some of these are already in your browser, and others are still research.

@term post-quantum cryptography = Classical algorithms designed to resist attacks by quantum computers.
@term harvest now, decrypt later = Recording encrypted traffic today, in order to decrypt it once a quantum computer exists.
@term double ratchet = The Signal protocol's method of changing keys with every message, so that a compromise heals itself.
@term zero-knowledge proof = A proof that a statement is true which reveals nothing beyond that fact.
@term homomorphic encryption = Encryption that allows computing on ciphertexts, so that decrypting the result gives the right answer.
@term multi-party computation = Several parties jointly computing a function of their inputs, without revealing those inputs to each other.

## Concept

### Fundamentals: the quantum threat, accurately

Shor's algorithm would break RSA, finite-field DH and elliptic curves on a large, error-corrected quantum computer. Grover's algorithm only gives a square-root speed-up on symmetric search, so AES-256 and SHA-256 stay comfortable. **Symmetric crypto survives, and public-key crypto doesn't.** No such machine exists yet, and nobody can honestly give a date.

So why act now? **Harvest now, decrypt later.** Anything recorded today with a confidentiality life of 15 years is already at risk if a machine arrives in 15 years. Migrations also take many years. Signatures are less urgent, because a forged signature needs a quantum computer at the moment of attack, though firmware signed today can live for decades.

### The new standards

NIST published the first post-quantum standards in August 2024.

| Standard | Algorithm | Purpose | Basis |
|---|---|---|---|
| [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final) | ML-KEM | Key encapsulation | Module lattices |
| [FIPS 204](https://csrc.nist.gov/pubs/fips/204/final) | ML-DSA | Signatures | Module lattices |
| [FIPS 205](https://csrc.nist.gov/pubs/fips/205/final) | SLH-DSA | Signatures | Hash functions |

In 2025, NIST [selected HQC](https://www.nist.gov/news-events/news/2025/03/nist-selects-hqc-fifth-algorithm-post-quantum-encryption) as a backup KEM built on different maths, with its standard still to come. [NIST IR 8547](https://csrc.nist.gov/pubs/ir/8547/final), finalised in October 2026, sets the transition: quantum-vulnerable public-key algorithms are deprecated after 2030 and disallowed after 2035.

The costs are real. ML-KEM-768 public keys are over 1 KB, where X25519 uses 32 bytes, and ML-DSA signatures are over 2 KB. That can overflow a single packet, and it upsets middleboxes.

### Hybrids and migration

New algorithms have had far less scrutiny. SIKE, a candidate in NIST's process, was [broken in 2022](https://eprint.iacr.org/2022/975) on a single laptop. So deployments combine a classical and a post-quantum exchange, such as **X25519MLKEM768** in TLS, and an attacker must break both. Major browsers and CDNs already use this hybrid by default.

Migration is mostly an inventory problem. You need a **cryptographic bill of materials**: what algorithms do you use, in which systems, and protecting what, for how long? Then it's about crypto agility, not rewriting each system when an algorithm changes.

### End-to-end encryption

TLS protects you from the network, not from the server. End-to-end encryption means that only the endpoints can read messages.

**The Signal protocol** has two parts. An initial key agreement, now [PQXDH](https://signal.org/docs/specifications/pqxdh/) with a post-quantum component, works while the other person is offline. Then the [Double Ratchet](https://signal.org/docs/specifications/doubleratchet/) derives a new key per message. A symmetric ratchet gives forward secrecy, and a Diffie-Hellman ratchet gives **post-compromise security**: if keys leak, later messages become safe again. For groups, [MLS](https://www.rfc-editor.org/rfc/rfc9420) scales this to thousands of members.

The remaining problems aren't cipher problems: is this really your contact's key, and is the endpoint itself compromised?

### Advanced: computing without trusting

| Technique | Lets you | State of practice |
|---|---|---|
| **Zero-knowledge proofs** | Prove a fact, and reveal nothing else | In production: rollups, private credentials |
| **Multi-party computation** | Compute jointly over private inputs | In production: key custody, private auctions |
| **Fully homomorphic encryption** | Compute on ciphertexts | Far slower, with growing niche use |
| **Trusted execution** | Compute in protected hardware | Deployed, but it trusts the vendor. See [hardware](/modules/15-07-hardware-attacks-and-tees/) |

A classic zero-knowledge example: you can prove that you know a solution without showing it. Age checks are a practical one: prove "over 18" without showing a birth date. These tools move trust from institutions to mathematics, though they're easy to misuse, and they need expert design.

?? Why migrate to post-quantum key exchange before quantum computers exist?
+ Recorded traffic can be decrypted years later
- Classical algorithms have already been fully broken
- Browsers refuse all elliptic curve keys today
- Quantum networks already carry most web traffic
=> Long-lived secrets captured now stay at risk. The danger is future decryption of today's recordings.

## Threat model

Adversaries for this domain are mostly well-resourced, with long time horizons. For most companies, the practical risks are different: a rushed migration, an unvetted library, or a broken hybrid. Attackers still prefer stolen keys and compromised endpoints, and end-to-end encryption doesn't stop an infostealer reading a desktop client.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [liboqs](https://openquantumsafe.org/) | Post-quantum algorithm library | Experiments |
| OpenSSL 3.5 and later | Native ML-KEM and ML-DSA | Testing real TLS |
| Wireshark | Shows `key_share` groups | Seeing hybrids on the wire |
| `cbomkit` | Builds a cryptographic bill of materials | Starting your inventory |
| libsignal | Signal protocol library | Studying a real implementation |
| OpenFHE | Homomorphic encryption library | Research |

## Defence

- **Start the inventory today.** You can't migrate what you can't find.
- **Prioritise long-lived secrets**, plus long-lived signatures like firmware roots.
- **Enable hybrid key exchange** at your TLS edge, then watch for broken middleboxes.
- **Keep AES-256 and SHA-384 or better** for long-term data.
- **Ask vendors** for their PQC roadmap, as IR 8547's dates will reach contracts.
- **Don't write your own.** This field punishes newcomers harder than any other.

## Pitfalls

- **"Quantum breaks all encryption."** It doesn't break AES in any practical sense.
- **"PQC is quantum cryptography."** PQC runs on normal computers. Quantum key distribution is a different thing, needing special hardware.
- **"The standard is final, so it's proven."** Lattice assumptions are younger than factoring, which is why hybrids exist.
- **"End-to-end encrypted means private."** Metadata, backups and endpoints all remain.
- **Treating FHE as a general answer.** Its overhead is large. Check the real cost before you design around it.

?? What does the Double Ratchet add to an encrypted chat?
+ Fresh keys, so compromise heals over time
- Proof of identity to a central server
- Searchable message history on the provider's servers
- Faster delivery of large attachments to groups
=> New Diffie-Hellman values keep entering the chain, so a stolen state stops being useful after the next exchange.

## Exercise

::: law Lab only
Use your own machines and accounts. These experiments involve no third-party systems.
:::

1. In Wireshark, load a major website in a current browser. Find the `key_share` in the ClientHello. Is X25519MLKEM768 offered? How big is the packet?
2. With OpenSSL 3.5 or later, generate an ML-KEM key and compare its size with X25519. If your version is older, use `liboqs`.
3. List every place your project uses cryptography: TLS, tokens, disks, backups, code signing. For each, write the algorithm, and how long the data must stay secret.
4. Read the first section of the Double Ratchet specification. Draw the two ratchets on paper.
5. Implement a small Schnorr proof of knowledge with tiny numbers, to see how a proof can reveal nothing.

?! Write a one-page post-quantum plan for a bank. Say what you'd do this year, what by 2030, and how you'd decide priorities.

## Further reading

- [NIST IR 8547](https://csrc.nist.gov/pubs/ir/8547/final), the transition timeline.
- [NIST's Post-Quantum Cryptography project](https://csrc.nist.gov/projects/post-quantum-cryptography).
- [Signal's specifications](https://signal.org/docs/).
- [RFC 9420](https://www.rfc-editor.org/rfc/rfc9420), Messaging Layer Security.
- [ZKProof community reference](https://docs.zkproof.org/reference.pdf), on zero-knowledge proofs.
