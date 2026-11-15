---
title: Public keys, certificates and TLS
summary: Asymmetric crypto, signatures, the chain of trust, and the TLS 1.3 handshake, in plain words.
month: 6
minutes: 65
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

Make a pair yourself. `openssl` is already on your Linux VM, and three commands show the whole idea:

```
openssl genpkey -algorithm ed25519 -out private.pem       create the private key
openssl pkey -in private.pem -pubout -out public.pem      derive the public key from it
cat public.pem
```

```
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAcwCnzzQ/eIo7n0DoHVQ2/zJaYR91WzED1Or4FNV+PNQ=
-----END PUBLIC KEY-----
```

Two things to notice. The public key is computed from the private one, and never the other way round: that one-way step is what the mathematics provides. And the public key is safe to paste anywhere, which is why you could put one on a server in the hardening lesson. `private.pem` is the secret. Treat it like a password that can't be changed easily.

Public-key operations are slow, so real systems use them only to get started, and then switch to fast symmetric encryption.

?? To send Ana a secret, which key do you use?
+ Ana's public key
- Ana's private key
- Your public key
- Your password hash
=> Anyone can encrypt with her public key, and only her private key opens it.

## Key exchange

Diffie-Hellman lets two parties create a shared secret while an eavesdropper watches everything. It's like mixing paint: each side keeps a private colour and swaps mixtures, and it's easy to mix but very hard to unmix. Modern TLS uses an elliptic-curve version, with a fresh key for each session. That gives **forward secrecy**: if a server's key is stolen next year, today's recorded traffic stays safe.

The paint has numbers behind it, and small ones show the trick. Both sides agree in public on a modulus `p = 23` and a base `g = 5`. `pow(g, x, p)` in Python means "g to the power x, then the remainder after dividing by p".

| | Ana | Bo |
|---|---|---|
| Picks a secret | `6` | `15` |
| Sends in the open | `pow(5, 6, 23)` = **8** | `pow(5, 15, 23)` = **19** |
| Combines with the other's number | `pow(19, 6, 23)` = **2** | `pow(8, 15, 23)` = **2** |

Both arrive at 2, and neither sent it. An eavesdropper saw 23, 5, 8 and 19, and to get the 2 they'd have to work out a secret exponent from those. With numbers this small that's easy. With the sizes real systems use, nobody knows a practical way.

@code dh-shared

?? What does forward secrecy protect?
+ Recorded traffic, if a key leaks later
- Passwords that are stored on the server
- Files that are saved on a laptop
- Certificates that have gone out of date
=> Each session has its own key, so a later theft can't unlock old recordings.

## Digital signatures

A **signature** is a hash of the data, processed with a private key. It proves two things: who signed it, and that it hasn't changed.

This solves the problem from the last lesson. A hash next to a download can be replaced, but a signature can't be forged without the private key. Software updates, Git commits and certificates all use this.

Sign a file with the key you made, then check it the way a stranger would, using only the public key:

```
echo "pay ana 100" > message.txt
openssl pkeyutl -sign -inkey private.pem -rawin -in message.txt -out message.sig
openssl pkeyutl -verify -pubin -inkey public.pem -rawin -in message.txt -sigfile message.sig
```

```
Signature Verified Successfully
```

Now change one character of the message and verify again with the old signature:

```
echo "pay ana 900" > message.txt
openssl pkeyutl -verify -pubin -inkey public.pem -rawin -in message.txt -sigfile message.sig
```

```
Signature Verification Failure
```

The file, the signature and the public key can all travel over a network that an attacker controls. Unless they also hold `private.pem`, they can't produce a signature that passes for a changed message.

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

Read a real certificate. This fetches the one a server presents and prints the four fields that matter:

```
openssl s_client -connect example.com:443 -servername example.com </dev/null 2>/dev/null |
  openssl x509 -noout -subject -issuer -dates -ext subjectAltName
```

```
subject=CN=example.com
issuer=C=US, O=SSL Corporation, CN=Cloudflare TLS Issuing ECC CA 3
notBefore=Sep 26 22:49:11 2026 GMT
notAfter=Dec 25 22:56:35 2026 GMT
X509v3 Subject Alternative Name:
    DNS:example.com, DNS:*.example.com
```

| Field | Meaning |
|---|---|
| `subject` | Who the certificate was issued to |
| `issuer` | Which CA signed it. That CA's own certificate is the next link in the chain |
| `notBefore`, `notAfter` | The period it's valid for. Outside it, browsers refuse the certificate |
| `Subject Alternative Name` | The names it covers. This list is what the browser compares with the address bar |

Yours will show different dates and perhaps a different issuer, because sites renew every few months. `*.example.com` is a **wildcard**: it stands for exactly one label, so it covers `www.example.com` but not `a.b.example.com`, and not the bare `example.com`, which is why that name is listed separately. Your browser shows the same fields if you click the padlock and open the certificate.

@code cert-name-matches

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

The same command without the second half prints a summary of the handshake. Three lines tell you how it went:

```
Verification: OK
New, TLSv1.3, Cipher is TLS_AES_256_GCM_SHA384
Verify return code: 0 (ok)
```

The chain led to a root that your system trusts, the protocol is TLS 1.3, and the data will be encrypted with AES-256-GCM, which you met in the last lesson. The cipher name is the whole of Month 6 in four words.

It's just as useful to see the checks fail. [badssl.com](https://badssl.com/) is a public test site with a deliberately broken certificate on each subdomain:

```
$ curl https://expired.badssl.com/
curl: (60) SSL certificate OpenSSL verify result: certificate has expired (10)

$ curl https://wrong.host.badssl.com/
curl: (60) SSL: no alternative certificate subject name matches target hostname 'wrong.host.badssl.com'
```

Each refusal is one of the browser's checks from the certificates section. `curl -k` would switch all of them off and carry on. That option turns "encrypted to the right server" into "encrypted to somebody", so the right response to error 60 is to fix the certificate, never to add `-k` to a script.

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

## Read the evidence

Three pieces of output from this lesson's tools. Decide what each one means before you read the choices.

?? `openssl s_client` ends with `Verify return code: 0 (ok)`. What was checked?
+ The chain leads to a trusted root
- The site has no security flaws anywhere
- The server's owner is an honest company
- The page contains absolutely no malicious scripts
=> Code 0 means the certificate chain is valid for a root that your system trusts. It says nothing about what the site does.

?? A certificate lists only `DNS:*.shop.example`. Which address does it cover?
+ `api.shop.example`
- `shop.example`
- `a.b.shop.example`
- `shop.example.net`
=> A wildcard replaces exactly one label. The bare domain and deeper names need their own entries.

?? A scheduled script starts failing with `curl: (60) … certificate has expired`. What's the right fix?
+ Renew the certificate on the server
- Add `-k` to the script's command
- Switch the script's URL to `http`
- Set the machine's clock back weeks
=> The other three all make the error disappear by removing the protection. An expired certificate is fixed by issuing a new one.

::: try Keys and certificates by hand
1. Create a key pair, sign a file and verify it. Then change the file and watch the verification fail.
2. Print the certificate of a site you use, and find its issuer, its expiry date and the names it covers.
3. Run `curl` against `expired.badssl.com`, `wrong.host.badssl.com` and `self-signed.badssl.com`, and match each error to the check that failed.
4. Delete `private.pem` when you've finished. A key you no longer need is a key that can't leak.
:::

?! Write your "How HTTPS actually works" explanation, in about 150 words, for a non-technical reader. This is the start of your Month 6 write-up.
