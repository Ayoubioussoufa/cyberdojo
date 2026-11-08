---
title: John the Ripper
summary: A classic password-auditing tool, and a guide to which hashes resist offline attack.
side: both
use: know
docs: https://www.openwall.com/john/doc/
kali: john
aka: jtr
alt: hashcat
---
## What it's for

John the Ripper is the long-standing open-source password auditing tool. Like [hashcat](/tools/hashcat/), it recovers passwords from hashes offline, and for a defender its main value is educational: it shows plainly which stored formats resist attack and which collapse. Its "jumbo" build recognises a very wide range of hash formats, which makes it a good way to learn what a given hash is worth.

## How it works

It reads hashes, works out their format, and tests candidate passwords against them on the local machine. It's known for its clever ordering of guesses, trying likely passwords and common transformations first, which is why human-chosen passwords fall so much faster than their length suggests. The same lesson applies whichever tool is used: predictable passwords and fast, unsalted hashes are the weaknesses, and both are the defender's to remove.

## Practise safely

Learn from the defensive angle. On a lab, generate hashes of your own test passwords in several formats and see, from the tool's own documentation and your results, how format and password choice change the outcome. For structured practice, legal platforms such as [Hack The Box](https://www.hackthebox.com/) provide exercises; never point it at credentials that aren't yours to test.

## What defenders see

As with any offline attack, there's nothing to detect on your side, so the defence is entirely in how you store and choose passwords. Use a slow, salted algorithm; encourage long passphrases rather than complex short ones; block known-breached passwords at the point they're set; and require multi-factor authentication. Auditing your own hashes with permission is itself a useful control, since it finds weak passwords before an attacker would. See [authentication mechanics](/modules/11-02-authentication-mechanics/).

?! Why do human-chosen passwords often fall far faster than their length alone would suggest, and what does that imply for policy?
