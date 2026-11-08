---
title: hashcat
summary: The tool that explains why password storage must use a slow, salted algorithm.
side: both
use: know
docs: https://hashcat.net/wiki/
kali: hashcat
alt: john
---
## What it's for

hashcat is the reason a defender must care how passwords are stored. It's the best-known tool for recovering passwords from stolen hashes offline, and understanding what it can and can't do tells you exactly how to store passwords so that a stolen database stays useless. Auditors also use it, with permission, to check their own organisation's password strength.

## How it works

When a password store leaks, the attacker has the hashes, not the passwords, and works offline on their own hardware to find inputs that produce those hashes. Two things decide whether they succeed: how slow the hashing algorithm is, and how strong the passwords are. A fast algorithm such as plain MD5 or SHA-1 lets modern graphics hardware test enormous numbers of candidates, while a deliberately slow, salted algorithm makes the same work take far longer per guess. The salt also stops one effort from attacking many accounts at once. So the defender's levers are clear from how the tool behaves.

## Practise safely

Study this from the storage side. On a lab, create password hashes with different algorithms, a fast one and a slow modern one such as bcrypt or Argon2, and compare how the published guess rates differ by orders of magnitude. For hands-on recovery practice, use a legal platform such as [TryHackMe](https://tryhackme.com/) or a wordlist exercise against hashes you generated yourself, never against anyone else's data.

## What defenders see

Offline cracking happens on the attacker's own machine, so you can't detect it. That makes prevention everything. Store passwords with a slow, salted, memory-hard algorithm (Argon2id, scrypt or bcrypt), follow [modern password guidance](/modules/11-02-authentication-mechanics/) on length over complexity, and add multi-factor authentication so a cracked password alone isn't enough. If a store leaks, assume every weak password will fall, and force a reset. [Password cracking](/modules/03-10-password-cracking/) covers the mathematics.

?! A password database leaks. Why does the choice between MD5 and Argon2id for storage change how worried you are, even before you know the passwords?
