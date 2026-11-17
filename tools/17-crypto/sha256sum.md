---
title: sha256sum
summary: Computes and checks SHA-256 hashes, to prove a file hasn't changed.
side: defence
use: open
docs: https://man7.org/linux/man-pages/man1/sha256sum.1.html
aka: md5sum, sha1sum, Get-FileHash
alt: certutil, hashid
---
## What it's for
A hash is a short fingerprint of a file's content: change one bit and the fingerprint changes completely. `sha256sum` computes the SHA-256 fingerprint and checks lists of them. That's how you verify a download, prove an evidence image is unchanged, or look a sample up in threat intelligence. On Windows, PowerShell's `Get-FileHash` does the same.

## How it works
SHA-256 turns any input into 256 bits, written as 64 hex characters. It's designed so that nobody can find two inputs with the same hash, or an input that matches a given hash, in any practical time. MD5 and SHA-1 still catch accidental corruption, but both are broken for security, since collisions can be made on purpose, so use SHA-256 or stronger wherever someone might cheat. The [hash function internals](/modules/03-04-hash-function-internals/) module explains why.

## Try it
```
echo -n 'hello' | sha256sum
sha256sum file.iso
sha256sum -c SHA256SUMS.txt --ignore-missing
sha256sum /usr/bin/* > baseline.txt
sha256sum -c --quiet baseline.txt
```

`-c` reads a list of hashes and checks each file. The last two lines record a baseline, then later report only the files that changed. In PowerShell, `Get-FileHash .\setup.exe -Algorithm SHA256` gives the same hash.

## What defenders see
Hashes are the commonest indicator of compromise: threat reports list the SHA-256 of malware samples, and EDR, [YARA](/tools/yara/) workflows and VirusTotal all key on them. They're also brittle: change one byte and the hash is new, so they catch known files and miss new ones. A checksum only helps if it comes from a place you trust, since a hash served by the same compromised server as the file proves nothing. That's why projects sign their checksum files.

?! A project publishes an installer and its SHA-256 on the same web page. What does checking the hash protect you against, and what doesn't it?
