---
title: Metasploit
summary: The best-known exploitation framework, and a name every defender should understand.
side: both
use: know
docs: https://docs.metasploit.com/
kali: metasploit-framework
aka: msf
alt: nmap, sliver
---
## What it's for
Metasploit is the most famous security framework, in Kali's top 10 and taught on every penetration-testing course. It packages exploits, payloads and post-exploitation tools behind one interface. A defender should understand what it is, what it leaves behind, and why so much of what it does is now caught.

## How it works
Its design is modular: an exploit module gets code running, a payload decides what that code does, and auxiliary and post modules handle scanning and follow-up actions. Meterpreter, its best-known payload, runs in memory and gives rich control of a host. Because the framework is so widely used, its default behaviours and payloads are heavily signatured, which is why skilled attackers often customise or avoid them, and why the defaults are a good thing for defenders to know.

## Practise safely
Learn it from the defender's side and practise the offensive side only on legal platforms built for it, such as [TryHackMe](https://tryhackme.com/) and [Hack The Box](https://www.hackthebox.com/), or [Metasploitable](https://docs.rapid7.com/metasploit/metasploitable-2/) in your own isolated lab. The valuable exercise here is detection: run a known test against a vulnerable lab VM you own, with your monitoring on, and study what the IDS, the endpoint tool and the logs recorded.

## What defenders see
Default Meterpreter and the framework's stock exploits are well covered by IDS signatures, EDR and memory scanning, so they're a useful baseline to confirm your defences fire. Patch management removes the exploits' targets entirely, which is the real lesson: Metasploit mostly uses known vulnerabilities, so a patched, monitored estate defeats most of it. [How a pentest works](/courses/0056-how-a-pentest-works/) gives the professional context.

?! Why are Metasploit's default payloads well detected, and what does that push capable attackers to do instead?
