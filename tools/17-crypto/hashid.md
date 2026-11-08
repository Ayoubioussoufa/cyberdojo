---
title: hashID
summary: Identifies the type of a hash from its format.
side: both
use: open
docs: https://github.com/psypanda/hashID
kali: hashid
aka: hash-identifier
alt: john, hashcat
---
## What it's for
Before you can do anything with a hash, you need to know what kind it is. hashID, and the similar `hash-identifier`, guess the type from its length and shape, which is a common first step in both forensics and authorised auditing.

## How it works
Hash formats have recognisable signatures: a length, a character set, and sometimes a prefix such as `$2b$` for bcrypt or `$6$` for a Linux SHA-512 crypt. The tool matches the input against these patterns and lists the likely types. It's a guess based on form, so several types can share one shape, and the context usually settles which it is.

## Try it
```
echo '$2b$12$abcdefghijklmnopqrstuv' | hashid
```

Identify a few hash formats, and learn to recognise the common prefixes by eye. The [hashing](/modules/03-04-hash-function-internals/) and [password cracking](/modules/03-10-password-cracking/) material explains why the format matters so much.

## What defenders see
The format tells a defender a lot. A modern prefix such as `$2b$` or `$argon2id$` means a slow, salted algorithm that resists offline attack; a bare 32-character hex string suggests unsalted MD5, which doesn't. So recognising the prefix tells you how urgent a stolen password store really is.

?! You find a password database. Why does spotting `$argon2id$` rather than plain MD5 change how worried you are?
