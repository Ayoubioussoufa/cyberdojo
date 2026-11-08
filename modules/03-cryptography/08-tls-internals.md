---
title: TLS internals
summary: Every message in a TLS 1.3 handshake, how its key schedule works, what twenty years of attacks taught the designers, and how to audit a real server.
level: advanced
side: both
minutes: 60
attack: T1557, T1573.002
needs: 03-03-block-ciphers-and-modes, 03-06-diffie-hellman-and-elliptic-curves, 03-07-pki-in-depth
pair: 03-07-pki-in-depth, 03-06-diffie-hellman-and-elliptic-curves, 03-12-modern-crypto-frontier, 16-05-formal-methods
source: RFC 8446, TLS 1.3 | https://www.rfc-editor.org/rfc/rfc8446
words: key schedule, HKDF, downgrade attack
---
TLS 1.3 is what a protocol looks like after twenty years of being attacked. Nearly every design decision answers some specific past failure. If you read the handshake alongside that history, the spec turns from a list of messages into a record of lessons.

@term cipher suite = The named set of algorithms that a TLS connection uses.
@term HKDF = A key derivation function, built from HMAC, that extracts entropy and expands it into keys.
@term downgrade attack = Tricking two parties into using an older, weaker protocol or algorithm than both support.
@term Encrypted Client Hello = A TLS extension that encrypts the ClientHello, hiding the server name from observers.

## Concept

### Fundamentals: one round trip

@flow ClientHello with key share > ServerHello with key share > Encrypted server flight > Client Finished > Application data

The client guesses a group and sends its Diffie-Hellman share at once, which saves a round trip over TLS 1.2. Everything after ServerHello is encrypted, including the certificate.

| Message | Direction | Purpose |
|---|---|---|
| ClientHello | C→S | Versions, cipher suites, `key_share`, SNI |
| ServerHello | S→C | Chosen suite and server's `key_share` |
| EncryptedExtensions | S→C | Remaining parameters |
| Certificate | S→C | The chain |
| CertificateVerify | S→C | A signature over the whole handshake so far |
| Finished | Both | A MAC over the transcript |

**CertificateVerify** is the key step. Signing the transcript proves that the server holds the private key, and it binds that proof to this handshake, so nothing can be swapped in the middle. **Finished** confirms that both sides saw exactly the same messages.

### Key schedule

TLS 1.3 doesn't use one key. It derives a tree of them with **HKDF** ([RFC 5869](https://www.rfc-editor.org/rfc/rfc5869)), which has two steps: *extract* turns uneven secrets into a strong key, and *expand* derives many labelled keys from it.

@flow Early secret, from PSK or zeros > Handshake secret, adds ECDHE > Master secret > Traffic keys for each direction

Each stage mixes in a hash of the transcript. So keys depend on everything said so far, and the keys used for handshake encryption differ from those for application data. Separating keys by purpose is a principle you'll meet again.

### What TLS 1.3 removed, and why

| Removed | Because of |
|---|---|
| RSA key exchange | No forward secrecy, [Bleichenbacher](/modules/03-05-rsa-in-depth/) and ROBOT |
| CBC modes | POODLE, Lucky Thirteen |
| RC4 | Keystream biases |
| Compression | CRIME |
| Custom DH groups | Logjam |
| Renegotiation | Injection attacks |
| SHA-1 signatures | Collisions |

The list of suites shrank from hundreds to five, all AEAD. Having fewer options means there's less to get wrong.

### The attack history

| Year | Attack | Lesson |
|---|---|---|
| 2011 | BEAST | Predictable CBC IVs matter |
| 2012 | CRIME | Compressing secrets leaks them by size |
| 2013 | Lucky Thirteen | MAC-then-encrypt leaks through timing |
| 2014 | [Heartbleed](https://heartbleed.com/) | Implementation bugs beat good protocols |
| 2014 | POODLE | Fallback to SSL 3.0 is itself an attack surface |
| 2015 | FREAK, [Logjam](https://weakdh.org/) | Old "export" crypto never quite dies |
| 2016 | [DROWN](https://drownattack.com/) | One old protocol on a shared key breaks new ones |
| 2017 | [ROBOT](https://robotattack.org/) | Oracles return |

### Advanced: downgrades, resumption and privacy

**Downgrades.** If an attacker can edit the handshake, they might persuade both sides to pick weaker options. TLS 1.3 defends in two ways: the signature covers the transcript, and a server negotiating an older version hides a sentinel in its random value, so a TLS 1.3 client notices.

**Resumption and 0-RTT.** A client can resume with a pre-shared key from an earlier session. Adding fresh ECDHE keeps forward secrecy. With **0-RTT**, a client may send data in its first flight, but that data can be replayed, so use it only for idempotent requests.

**Formal analysis.** TLS 1.3 is unusual in that academics analysed it during design, using tools like Tamarin and ProVerif, and they found problems before release. See [Formal methods](/modules/16-05-formal-methods/).

**Middleboxes.** TLS 1.3 pretends to be TLS 1.2 on the wire (`legacy_version`), because broken middleboxes blocked anything new. **Encrypted Client Hello** closes the last plaintext gap, the SNI, by encrypting the inner ClientHello with a key published in DNS.

[RFC 8996](https://www.rfc-editor.org/rfc/rfc8996) formally deprecated TLS 1.0 and 1.1, and [RFC 9325](https://www.rfc-editor.org/rfc/rfc9325) gives the current deployment advice.

?? What does the CertificateVerify message prove?
+ The server holds the certificate's private key
- The client trusts the chosen root authority
- The handshake used a fresh random salt
- The session ticket has not yet expired
=> It's a signature over the transcript. Only the holder of the private key can make it, and it binds that key to this handshake.

## Threat model

Attackers on-path ([T1557](https://attack.mitre.org/techniques/T1557/)) can't read TLS 1.3 without a trusted certificate, so they aim at clients with a rogue root, or use phishing. Malware also uses TLS for itself ([T1573.002](https://attack.mitre.org/techniques/T1573/002/)), and defenders then rely on [metadata](/modules/01-06-packet-analysis-in-depth/).

Most real failures are configuration: old versions enabled, expired certificates, weak suites kept for one legacy client.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `openssl s_client -connect` | Shows the handshake and chain | Testing one server |
| `testssl.sh` | Tests versions, suites and known flaws | A full audit of your own server |
| `sslyze` | Scriptable TLS scanner | Checking in CI |
| [SSL Labs](https://www.ssllabs.com/ssltest/) | Public grading | Internet-facing sites |
| Wireshark with a key log | Decrypts sessions | Learning the handshake |
| [Mozilla SSL Config Generator](https://ssl-config.mozilla.org/) | Produces server configs | Setting a good default |

## Defence

- **Enable TLS 1.3 and 1.2 only.** Disable all earlier versions.
- **For 1.2, allow only AEAD suites with ECDHE.**
- **Keep private keys separate.** Don't share a key between protocols or servers, which DROWN showed to be dangerous.
- **Set HSTS**, so that browsers refuse cleartext.
- **Rotate session ticket keys often**, or disable tickets.
- **Keep your TLS library patched.** Heartbleed was an implementation bug, not a protocol one.
- **Disable 0-RTT** unless you've thought through replay.

## Pitfalls

- **"Cipher suite strength is all that matters."** The certificate, the key storage and the implementation matter just as much.
- **"HTTPS hides what you visit."** SNI, DNS and destination IP still show, unless ECH and encrypted DNS are in use.
- **Leaving TLS 1.0 on for one old client.** That's how old attacks stay alive. Isolate that client.
- **Disabling verification in code.** `verify=False` throws away all authentication. It's a critical finding every time.
- **Testing only port 443.** Mail, LDAP and admin ports run TLS too.

?? Why can't a recorded TLS 1.3 session be decrypted after a server key leak?
+ Session keys came from ephemeral key exchange
- Recorded traffic is deleted by the network
- Certificates rotate every ninety days or less
- The client's browser stores no session data
=> The long-term key only signs the handshake. The session keys come from ephemeral Diffie-Hellman values that have been destroyed.

## Exercise

::: law Lab only
Test only servers you run. Scanning other people's TLS services with intrusive tools may be unwelcome or illegal.
:::

1. Run `openssl s_client -connect example.com:443 -tls1_3 -msg </dev/null | head -60`, and identify each handshake message.
2. Set `SSLKEYLOGFILE` and capture a `curl` request. Decrypt it in Wireshark, and find CertificateVerify and Finished.
3. Configure Nginx in your lab with weak settings, including TLS 1.0. Run `testssl.sh`, then fix it using Mozilla's generator, and rerun.
4. Compute an HKDF extract and expand by hand in Python using `hmac`. Compare with the `cryptography` library's output.
5. Read the first page of RFC 8446's section on changes from TLS 1.2. Match each to an attack in the table.

?! Pick one attack from the history table. Explain the flaw and the design change that closed it, as if for a job interview.

## Further reading

- [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446), the TLS 1.3 specification, which reads better than you'd expect.
- [The Illustrated TLS 1.3 Connection](https://tls13.xargs.org/), every byte explained.
- [RFC 9325](https://www.rfc-editor.org/rfc/rfc9325), on secure use of TLS.
- [RFC 7457](https://www.rfc-editor.org/rfc/rfc7457), which summarises known attacks.
- [Mozilla's server-side TLS guidance](https://wiki.mozilla.org/Security/Server_Side_TLS).
