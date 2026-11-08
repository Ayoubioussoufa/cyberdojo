---
title: OpenSSL
summary: The standard toolkit for TLS, certificates and everyday cryptography.
side: both
use: open
docs: https://docs.openssl.org/master/man1/
kali: openssl
alt: gnutls, cfssl
---
## What it's for
OpenSSL is both the library behind much of the Internet's encryption and a command-line tool. With it you can inspect a certificate, test a TLS connection, generate keys, and hash or encrypt files. It's the Swiss Army knife of applied cryptography.

## How it works
The library implements the algorithms and protocols; the `openssl` command exposes them as subcommands. `s_client` opens a TLS connection and shows every detail of the handshake and certificate. `x509` reads a certificate. `genpkey` and `req` create keys and certificate requests. Understanding its output teaches you how [TLS](/modules/03-08-tls-internals/) and [PKI](/modules/03-07-pki-in-depth/) actually work.

## Try it
```
openssl s_client -connect example.com:443 -servername example.com </dev/null
echo -n "hello" | openssl dgst -sha256
openssl x509 -in cert.pem -noout -text
```

Connect to a site you own, read its certificate chain, and check the expiry date. Then hash a short string.

## What defenders see
Knowing OpenSSL is a defender's skill: checking certificate expiry, verifying a chain, and testing which TLS versions and ciphers a server offers. Never use the `enc` command's older defaults for real data, since proper authenticated encryption belongs in a library, not a shell one-liner.

?! Using `s_client`, how would you tell whether a server still allows an old, weak version of TLS?
