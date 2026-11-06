---
title: Keystone
summary: Follow a whole Windows domain intrusion through real event IDs, from a password spray to a new Domain Admin and a cleared log.
level: Intermediate
month: 9
minutes: 45
builds: a Windows intrusion timeline built from domain controller events
words: password spraying, Kerberoasting
---
A domain controller is the keystone of a Windows network: it holds the accounts, so whoever controls it controls everything. Overnight, something happened on this one. You've got its Security log, exported from your SIEM to CSV.

The events are real Windows event IDs, so what you learn here applies directly.


::: law This is a simulation
These logs are generated, and every name in them is fictional.
:::

## Before you start

You'll need Windows logging from [lesson 33](/courses/0033-windows-logging-and-sysmon/), Kerberos from [lesson 44](/courses/0044-kerberos-and-ntlm/), and identity attacks from [lesson 45](/courses/0045-attacking-and-defending-identity/). The [event ID sheet](/sheets/windows-events/) is worth keeping open.

?? Attackers spray one password across 500 accounts. Why doesn't account lockout help?
+ Each account sees only one failure here
- Lockout works only on domain administrator accounts
- Spraying never reaches the domain controller
- Windows has no lockout feature for passwords
=> Lockout counts failures per account. You need a detection that looks across accounts.

## The machine

@range keystone

## What just happened

| Time (UTC) | Event | Meaning | ATT&CK |
|---|---|---|---|
| 01:10 | 4625, one per user | Password spray | T1110.003 Password Spraying |
| 01:40 | 4624 | One password worked | T1078 Valid Accounts |
| 02:05 | 4769 with `0x17` | Kerberoasting a service account | T1558.003 Kerberoasting |
| 02:55 | 4720, 4728 | New user, added to Domain Admins | T1136.002 Domain Account, T1098 Account Manipulation |
| 03:10 | 1102 | Security log cleared | T1070.001 Clear Windows Event Logs |

An hour and a half, from nothing to Domain Admin. Now you can see why detection speed matters.

?? A 4769 event with encryption `0x17` appears in a domain that otherwise uses `0x12`. Why does it matter?
+ RC4 tickets can be attacked offline more easily
- It proves the domain controller has been rebooted
- It means a printer has joined the domain
- It shows the user entered the wrong password
=> `0x17` is RC4. Requests for it stand out in a modern domain, and they're the classic sign of Kerberoasting.

## Detections to write

| Detection | Logic |
|---|---|
| Spraying | One source, 4625 for many different users, in a short window |
| Kerberoasting | 4769 with `0x17` for a service account |
| Privilege change | 4728 for Domain Admins, by anyone outside a named list |
| Tampering | Any 1102 |

?? Why does a cleared log (1102) still help defenders?
+ The event itself proves that someone covered tracks
- It restores all the deleted log entries afterwards
- It stops the attacker from logging in again
- It removes the need for any central logging
=> It's a loud signal, and if your logs already reached a SIEM, the attacker cleared only a local copy.

## Write it up

?! Build the timeline above in your own words, then say which single control would have helped most, and why.
