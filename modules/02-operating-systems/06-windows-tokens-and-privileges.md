---
title: Windows tokens and privileges
summary: Every Windows security decision starts with a token. How tokens, privileges and integrity levels work, why service accounts are a gift, and what UAC truly is.
level: intermediate
side: both
minutes: 55
attack: T1134.001, T1134.002, T1548.002
needs: 0031-windows-objects, 0030-how-operating-systems-work
pair: 02-08-windows-privilege-escalation
source: Microsoft, Access Tokens | https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens
words: access token, impersonation, integrity level
---
On Linux you ask "what's this UID?". On Windows, every thread carries an **access token**: a kernel object listing who it is, which groups it's in, and what special powers it holds. Lesson 31 introduced them. Here you'll see why that object, rather than a password, is what attackers really want.

@term impersonation token = A token that lets a thread act for another user temporarily, as servers do when handling a client's request.
@term UAC split token = The two tokens an admin gets at logon: a filtered one for normal use, and a full one that needs elevation.

## Concept

### Fundamentals: what's inside a token

When you log on, the Local Security Authority builds a token, and each process you start inherits a copy.

| Field | Meaning |
|---|---|
| User SID | Who you are |
| Group SIDs | Your groups, including ones for login type |
| Privileges | System-wide rights, each present and either enabled or disabled |
| Integrity level | Low, Medium, High or System |
| Type | Primary, or impersonation |

When a thread opens an object, the kernel's Security Reference Monitor compares the token with the object's DACL, which is a list of who may do what. Note that the token is created at logon and doesn't change. That's why group changes need a new logon.

### Privileges

Privileges differ from permissions. A permission applies to an object, whereas a privilege is a system-wide right that often *bypasses* object checks.

| Privilege | Normal use | Why attackers want it |
|---|---|---|
| `SeDebugPrivilege` | Debug any process | Open LSASS and read credentials |
| `SeImpersonatePrivilege` | Serve clients as themselves | Act as any token you can obtain |
| `SeAssignPrimaryTokenPrivilege` | Service startup | Start processes with another token |
| `SeBackupPrivilege` | Backups | Read any file, ignoring DACLs |
| `SeRestorePrivilege` | Restores | Write any file |
| `SeTakeOwnershipPrivilege` | Admin repair | Take ownership of anything |
| `SeLoadDriverPrivilege` | Load drivers | Reach the kernel |

Run `whoami /priv` to see yours. A listed privilege may be disabled, but its holder can usually enable it, so read "Disabled" as "not on yet".

### Impersonation

A server handling your request needs to act as you, so that file checks apply to you and not to it. It takes an **impersonation token** at one of four levels: Anonymous, Identification, Impersonation and Delegation. This is how one IIS worker process serves thousands of users safely.

It's also why service accounts are dangerous. Accounts such as `NETWORK SERVICE` and IIS application pools hold `SeImpersonatePrivilege`, by necessity. If an attacker gets code running in such a service, say through a web shell, they need one thing more: a high-privileged token to impersonate.

### Advanced: the Potato family

The idea, in concept: trick a SYSTEM-level service into **authenticating to a local endpoint the attacker controls**, such as a named pipe or a fake COM or RPC server. The authentication hands over a token that the attacker can impersonate. Tools like RottenPotato, JuicyPotato and PrintSpoofer are different ways to coerce that first step. Microsoft doesn't treat this as a security boundary, because a service with `SeImpersonate` is already considered highly trusted.

So the right question isn't "which Potato works here?". It's "why does this internet-facing service run with that privilege?".

### UAC: a convenience, not a boundary

At logon, an administrator gets a **split token**: a filtered Medium-integrity token for everyday work, and a full High-integrity one. A consent prompt moves you to the second. **Integrity levels** enforce "no write up": a Low-integrity browser sandbox can't write to Medium objects.

Microsoft [states](https://www.microsoft.com/en-us/msrc/windows-security-servicing-criteria) that UAC isn't a security boundary. So some Windows programs auto-elevate, and bugs in those are treated as hardening problems rather than vulnerabilities. A "UAC bypass" takes an existing admin session from Medium to High without a prompt. It doesn't give admin rights to someone who has none. Admin Protection, a newer feature in Windows 11, replaces the split token with a separate hidden account.

?? A web shell runs as an IIS application pool. Which single privilege most raises the risk?
+ `SeImpersonatePrivilege`, as a SYSTEM token can be coerced
- `SeChangeNotifyPrivilege`, as it allows traversing into any folders
- `SeTimeZonePrivilege`, as it lets the attacker change time
- `SeShutdownPrivilege`, as it can restart the local machine
=> Service accounts hold `SeImpersonate` by default. If a SYSTEM service can be coerced into authenticating, the process can become SYSTEM.

## Threat model

| Technique | ATT&CK |
|---|---|
| Token impersonation and theft | [T1134.001](https://attack.mitre.org/techniques/T1134/001/) |
| Creating a process with a stolen token | [T1134.002](https://attack.mitre.org/techniques/T1134/002/) |
| UAC bypass | [T1548.002](https://attack.mitre.org/techniques/T1548/002/) |

Tokens persist in memory while a session lives, so an admin's RDP session left open on a server is a token waiting to be stolen. That's why tiering matters: if admins never log on to low-tier machines, there's nothing to steal.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `whoami /all` | Shows your SID, groups, privileges and integrity | The first step on a host |
| Process Explorer | Shows each process's token | Inspecting one process |
| Process Hacker / System Informer | Shows tokens and handles in depth | Research |
| `accesschk` | Reports permissions and rights | Auditing who has what |
| Local Security Policy | Sets user rights assignment | Reviewing who holds privileges |

## Defence

- **Remove privileges you can.** Audit *User Rights Assignment* by GPO. Give `SeDebugPrivilege` to nobody by default. Admins can usually do without it in production.
- **Use the least powerful service identity.** Virtual accounts and gMSAs suit most services. Keep services off SYSTEM.
- **Separate admin sessions.** Use tiering, and Privileged Access Workstations. Log off rather than disconnect.
- **Turn on LSA Protection and Credential Guard.** See [Credential stores](/modules/02-07-windows-credential-stores/).
- **Keep UAC at its highest setting** anyway. It's not a boundary, but it adds cost.

**Detection.**

| Signal | Source |
|---|---|
| Logon with special privileges | Event 4672 |
| Token rights adjusted | Event 4703 |
| Process creation with parent and integrity | Event 4688, Sysmon 1 |
| One process accessing another | Sysmon 10 |
| Service account spawning `cmd.exe` | Sysmon 1, by parent-child rule |

An IIS worker (`w3wp.exe`) starting a shell is among the highest-value detections on Windows, and it's cheap to write.

## Pitfalls

- **"Local admin isn't the same as SYSTEM."** On a single machine, an admin can reach SYSTEM by design. Microsoft doesn't treat that as a boundary.
- **"Disabled means they can't use it."** The holder can enable it.
- **"UAC stops attackers."** It stops accidents. Treat it as friction.
- **"Tokens expire."** Primary tokens last as long as the session.
- **Running a web app as SYSTEM "just to make it work".** A web bug then equals full control.

?? What does a UAC bypass actually give an attacker?
+ Silent elevation for a user who's already an admin
- Administrator rights for a standard user who has none
- A way to read other users' private Kerberos keys
- Access from a guest account to the domain controller
=> UAC bypasses only skip a prompt for an account that's already an administrator. A standard user gains nothing from them.

## Exercise

::: law Lab only
Use your own Windows VM, or a lab domain. Do not attempt token attacks on any system you don't own.
:::

1. Run `whoami /all` as a standard user, as an admin, and from an elevated prompt. Compare the integrity levels and privileges. What changes, and what doesn't?
2. Open Process Explorer. Find your browser's sandbox processes and read their integrity levels.
3. Open the Local Security Policy, under *User Rights Assignment*. List who holds `SeDebugPrivilege` and `SeImpersonatePrivilege`, and explain the default entries.
4. Install IIS, and run `whoami /priv` from a test page or a scheduled task as the app pool identity. Confirm it holds `SeImpersonate`. Do it in your lab only.
5. Write a Sysmon or Sigma rule: alert when `w3wp.exe` starts `cmd.exe` or `powershell.exe`. Test it.

?! Explain, to a developer, why their service shouldn't run as SYSTEM. Then explain why running it as `NETWORK SERVICE` still isn't the whole answer.

## Further reading

- [Access Tokens](https://learn.microsoft.com/en-us/windows/win32/secauthz/access-tokens), Microsoft's reference.
- [Privilege Constants](https://learn.microsoft.com/en-us/windows/win32/secauthz/privilege-constants), the full list.
- [Microsoft Security Servicing Criteria](https://www.microsoft.com/en-us/msrc/windows-security-servicing-criteria), which states what counts as a boundary.
- [How User Account Control works](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/user-account-control/how-it-works).
- Russinovich, Solomon and Ionescu, *Windows Internals*, the standard text on tokens.
