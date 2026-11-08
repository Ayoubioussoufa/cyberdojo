---
title: age
summary: A simple, modern tool for encrypting files.
side: both
use: open
docs: https://age-encryption.org/
kali: age
alt: gpg
---
## What it's for
age is a modern file-encryption tool designed to be simple and hard to misuse. It does one thing, encrypt a file to a recipient, without GPG's many options and historical baggage.

## How it works
It uses modern cryptography with no choice of algorithm, which removes a whole class of mistakes. Keys are short text strings: a public recipient key and a private identity. You can also encrypt to a passphrase. The deliberate lack of options is the point, since every option in a crypto tool is a chance to choose badly.

## Try it
```
age-keygen -o key.txt
age -r $(grep public key.txt | cut -d' ' -f4) -o secret.age secret.txt
age -d -i key.txt secret.age
```

Generate a key, encrypt a file to it, and decrypt it. Notice how few decisions you had to make.

## What defenders see
For backups and for sending a file safely, age is easy to use correctly, which is itself a security property. It can use SSH keys as recipients, which is handy. For signed software releases, GPG and Sigstore still dominate, so the tools complement each other.

?! Why can "fewer options" make a cryptographic tool safer rather than weaker?
