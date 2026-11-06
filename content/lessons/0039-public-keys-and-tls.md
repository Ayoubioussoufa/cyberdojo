---
title: Public keys, certificates and TLS
summary: Asymmetric crypto, signatures, the chain of trust, and the TLS 1.3 handshake, in plain words.
month: 6
minutes: 40
builds: explain the TLS 1.3 handshake and what a certificate proves
source: RFC 8446, TLS 1.3 | https://www.rfc-editor.org/rfc/rfc8446
words: digital signature, certificate, certificate authority
---
Symmetric encryption has a chicken-and-egg problem: how do two strangers on the internet agree a shared key, while everyone is listening? Solving it is one of the great achievements in computer science, and you use it every time you open a website.

@term asymmetric encryption (public-key cryptography) = Cryptography using a linked key pair: one public, one private.
@term RSA = A long-standing public-key algorithm.
@term elliptic-curve cryptography (ECC) = A public-key approach giving strong security with small keys.
@term key exchange = How two parties agree on a shared secret over an open network.
@term digital signature = Proof, made with a private key, that data came from the key's owner and wasn't changed.
@term certificate = A signed document binding a public key to a name.
@term certificate authority (CA) = An organisation trusted to sign certificates.
@term PKI (public key infrastructure) = The system of CAs and certificates that makes trust work.
@term forward secrecy = A property where stealing a long-term key doesn't reveal past sessions.

## Two keys

With a **key pair**, what one key does, only the other can undo.

- Encrypt with someone's **public key**, and only their private key can read it.
- **Sign** with your **private key**, and anyone with your public key can verify it was you.

Public-key operations are slow, so real systems use them only to get started, and then switch to fast symmetric encryption.

?? To send Ana a secret, which key do you use?
+ Ana's public key
- Ana's private key
- Your public key
- Your password hash
=> Anyone can encrypt with her public key, and only her private key opens it.

## Key exchange

Diffie-Hellman lets two parties create a shared secret while an eavesdropper watches everything. It's like mixing paint: each side keeps a private colour and swaps mixtures, and it's easy to mix but very hard to unmix. Modern TLS uses an elliptic-curve version, with a fresh key for each session. That gives **forward secrecy**: if a server's key is stolen next year, today's recorded traffic stays safe.

?? What does forward secrecy protect?
+ Recorded traffic, if a key leaks later
- Passwords that are stored on the server
- Files that are saved on a laptop
- Certificates that have gone out of date
=> Each session has its own key, so a later theft can't unlock old recordings.

## Digital signatures

A **signature** is a hash of the data, processed with a private key. It proves two things: who signed it, and that it hasn't changed.

This solves the problem from the last lesson. A hash next to a download can be replaced, but a signature can't be forged without the private key. Software updates, Git commits and certificates all use this.

?? What does verifying a digital signature prove?
+ The private key's holder signed this exact data
- The data has been kept secret from everyone
- The signer is an honest and trustworthy person
- The data hasn't been read by a stranger
=> Signatures give authenticity and integrity, not secrecy. And they say nothing about whether the signer has good intentions.

## Certificates and the chain of trust

You connect to `bank.example` and receive a public key. How do you know it's really the bank's? A **certificate** binds a public key to a name, signed by a **certificate authority**.

@flow Root CA, built into your OS > Intermediate CA > Site certificate for bank.example

Your browser checks that the chain leads to a trusted root, the name matches, and it hasn't expired or been revoked.

::: key What a certificate proves
It proves the server controls that **name**. It does **not** prove the operator is honest. Phishing sites get valid certificates too, so "the padlock" doesn't mean safe.
:::

?? A phishing site at `bank-login.example` shows a valid padlock. How can that be?
+ The attacker truly controls that domain name
- The browser's certificate checks were switched off
- Certificates are only checked on banking websites
- The real bank signed the attacker's certificate
=> A CA only verifies control of the name. The padlock means the connection is encrypted to whoever owns that name.

## The TLS 1.3 handshake

[TLS 1.3](https://www.rfc-editor.org/rfc/rfc8446) makes a secure channel in a single round trip:

@seq Client | Server
Client > Server: ClientHello, my key share
Server > Client: ServerHello, its key share
Server > Client: Certificate, signature, Finished
Client > Server: Finished
Client > Server: Encrypted application data

1. **ClientHello:** "Here's what I support, and my half of the key exchange."
2. **ServerHello:** the server sends its half. Both now derive the same keys.
3. **Certificate + CertificateVerify:** the server proves it owns the certificate's key by signing the handshake.
4. **Finished:** both confirm that nothing was tampered with.

So TLS gives three things: **confidentiality** (encryption), **integrity** (tampering is detected) and **authentication** (the certificate).

::: try See it
```
openssl s_client -connect example.com:443 -servername example.com </dev/null
```
Find the certificate chain, the protocol and the cipher. Then capture a handshake in Wireshark and find the ClientHello.
:::

?? What gives TLS its proof of who you're talking to?
+ The server's signed certificate
- The client's session cookie
- The first TCP handshake
- The resolver's DNS answer
=> The server signs the handshake with the key that matches its certificate.

## Post-quantum, briefly

A large quantum computer could break RSA and elliptic curves. NIST published the first post-quantum standards in 2024: [FIPS 203](https://csrc.nist.gov/pubs/fips/203/final), [204](https://csrc.nist.gov/pubs/fips/204/final) and [205](https://csrc.nist.gov/pubs/fips/205/final). The worry is "harvest now, decrypt later": recording traffic today to break it in future. Awareness is enough for now.

?? Which part of TLS does the certificate provide?
+ Authentication of the server's real identity
- The bulk encryption of the data
- Compression of the requests and responses
- Protection against a compromised web application
=> Encryption comes from keys derived in the exchange. The certificate proves who you're talking to.

?! Write your "How HTTPS actually works" explanation, in about 150 words, for a non-technical reader. This is the start of your Month 6 write-up.
