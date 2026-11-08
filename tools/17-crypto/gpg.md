---
title: GnuPG
summary: Encrypts and signs files and email with public-key cryptography.
side: both
use: open
docs: https://gnupg.org/documentation/
kali: gnupg
aka: gpg, PGP
alt: openssl, age
---
## What it's for
GnuPG, or GPG, is the free implementation of the OpenPGP standard. People use it to encrypt files, to sign software releases so others can verify them, and, less often now, for email.

## How it works
It uses public-key cryptography: a public key others use to encrypt to you or to check your signature, and a private key, which you guard, to decrypt and to sign. The hard part has always been the web of trust, deciding that a key really belongs to the person named. Signing releases is its most important modern use, since it lets anyone confirm that a download is genuine and unaltered.

## Try it
```
gpg --full-generate-key
echo "secret" > note.txt
gpg --encrypt --recipient you@example.com note.txt
gpg --decrypt note.txt.gpg
```

Make a key pair, encrypt a note to yourself, and decrypt it. Then verify the signature on a signed release you downloaded.

## What defenders see
Verifying signatures on packages and releases is a key defence against [supply-chain tampering](/modules/13-01-dependency-attacks/). Protect your private key with a strong passphrase and ideally a hardware token. The usability problems are real, which is why modern tools like `age` and Sigstore have appeared for specific jobs.

?! Why is verifying a release signature a defence against a compromised download mirror?
