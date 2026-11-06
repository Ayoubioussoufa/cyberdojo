---
title: Windows event IDs
summary: The Security log events worth knowing by heart, with logon types and failure codes.
source: Microsoft, Audit events | https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/security-auditing-overview
---
## Logons

| ID | Meaning | Watch for |
|---|---|---|
| 4624 | Logon succeeded | Type 3 or 10 from odd sources |
| 4625 | Logon failed | Many users from one source |
| 4634 | Logged off | Session length |
| 4648 | Logon with explicit credentials | `runas`, movement |
| 4672 | Special privileges assigned | Admin logons |
| 4740 | Account locked out | Guessing |
| 4776 | Credentials validated (NTLM) | NTLM where Kerberos is expected |

## Kerberos

| ID | Meaning | Watch for |
|---|---|---|
| 4768 | TGT requested | Pre-auth type 0: AS-REP roasting |
| 4769 | Service ticket requested | `0x17`: Kerberoasting |
| 4771 | Pre-authentication failed | Result `0x18`: wrong password |

## Accounts and groups

| ID | Meaning | Watch for |
|---|---|---|
| 4720 | User created | Out-of-hours creation |
| 4722 | User enabled | Dormant accounts waking up |
| 4724 | Password reset attempted | By an unusual admin |
| 4725 | User disabled | |
| 4726 | User deleted | Covering tracks |
| 4728 | Added to a global group | Domain Admins |
| 4732 | Added to a local group | Local Administrators |
| 4738 | User changed | Rights, or flags |
| 4756 | Added to a universal group | Enterprise Admins |

## Processes, services, tasks

| ID | Log | Meaning | Watch for |
|---|---|---|---|
| 4688 | Security | Process created | Needs command-line auditing |
| 4697 | Security | Service installed | Odd paths |
| 7045 | System | Service installed | Odd paths |
| 4698 | Security | Scheduled task created | Persistence |
| 4104 | PowerShell | Script block logged | Encoded or obfuscated code |

## Tampering and objects

| ID | Log | Meaning | Watch for |
|---|---|---|---|
| 1102 | Security | Security log cleared | Always investigate |
| 104 | System | System log cleared | Always investigate |
| 4719 | Security | Audit policy changed | Logging turned down |
| 4662 | Security | Operation on an AD object | Replication rights: DCSync |
| 5136 | Security | Directory object changed | ACL abuse |
| 5140 | Security | Network share accessed | Unusual shares |
| 5145 | Security | Share object checked | Admin shares |

## Logon types (in 4624)

| Type | Name | Means |
|---|---|---|
| 2 | Interactive | At the keyboard |
| 3 | Network | SMB, shares |
| 4 | Batch | Scheduled task |
| 5 | Service | A service started |
| 7 | Unlock | Screen unlocked |
| 8 | NetworkCleartext | Password sent in clear |
| 9 | NewCredentials | `runas /netonly` |
| 10 | RemoteInteractive | RDP |
| 11 | CachedInteractive | Laptop offline |

## Failure codes (in 4625)

| Code | Means |
|---|---|
| `0xC0000064` | User doesn't exist |
| `0xC000006A` | Wrong password |
| `0xC0000234` | Account locked |
| `0xC0000072` | Account disabled |
| `0xC0000071` | Password expired |
| `0xC0000193` | Account expired |

## Kerberos encryption types

| Code | Type | Means |
|---|---|---|
| `0x11` | AES128 | Normal |
| `0x12` | AES256 | Normal |
| `0x17` | RC4 | Suspicious in a modern domain |

## Patterns to remember

| Pattern | Events |
|---|---|
| **Password spray** | Many 4625, many users, one source |
| **Brute force** | Many 4625, one user |
| **Success after failure** | 4625s, then 4624 from one source |
| **New admin** | 4720, then 4728 or 4732 |
| **Persistence** | 7045, 4697 or 4698 |
| **Covering tracks** | 1102 |
