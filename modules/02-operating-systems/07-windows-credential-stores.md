---
title: Windows credential stores
summary: Where Windows keeps secrets, and why one compromised laptop can give up a domain. LSASS, SAM, DPAPI and NTDS.dit, then Credential Guard and how to detect theft.
level: intermediate
side: both
minutes: 55
attack: T1003.001, T1003.002, T1003.003, T1003.004, T1003.005, T1555.004
needs: 02-06-windows-tokens-and-privileges, 0044-kerberos-and-ntlm
pair: 0045-attacking-and-defending-identity
source: Microsoft, Credential Guard overview | https://learn.microsoft.com/en-us/windows/security/identity-protection/credential-guard/
words: LSASS, DPAPI, Credential Guard
---
Windows has to keep secrets, because single sign-on means something must prove who you are without asking again. Those secrets are the most sought-after data on any Windows machine. If you know where each one lives, what protects it and what touching it looks like, you've understood the heart of a domain compromise.

@term DPAPI = The Windows Data Protection API, which encrypts secrets using keys derived from the user's logon.
@term NTDS.dit = The Active Directory database file on a domain controller, holding every account's password hashes.

## Concept

### Fundamentals: the map of secrets

| Store | Holds | Location | Needs |
|---|---|---|---|
| **LSASS memory** | NT hashes, Kerberos tickets, sometimes more | Process `lsass.exe` | Admin or `SeDebugPrivilege` |
| **SAM** | Local account hashes | `HKLM\SAM`, encrypted by the SYSTEM boot key | SYSTEM, or the hive files |
| **LSA Secrets** | Service account passwords, machine key | `HKLM\SECURITY` | SYSTEM |
| **Cached credentials** | Verifiers for offline domain logon | `HKLM\SECURITY\Cache` | SYSTEM, and slow to crack |
| **DPAPI** | Saved passwords, browser secrets, Wi-Fi keys | User profile, master keys | The user's password, or a domain backup key |
| **Credential Manager** | Saved RDP and network passwords | User profile, using DPAPI | That user's context |
| **NTDS.dit** | Every domain account's hash | Domain controllers | Domain admin rights |

### LSASS

The **Local Security Authority Subsystem Service** handles logons. After you log in, it keeps what it needs for single sign-on in memory. On modern Windows that's the NT hash and Kerberos tickets. Old versions kept reversible passwords through WDigest, now off by default.

The **NT hash** has an unusual property: for NTLM, it *is* the credential. You don't need to crack it. Possession is enough, which is [pass-the-hash](/courses/0044-kerberos-and-ntlm/). Windows never salts it, so identical passwords share a hash, and two machines with the same local admin password can be spotted immediately.

An attacker with admin rights on a machine can read LSASS memory. Mimikatz is the famous tool. So one compromised workstation where a domain admin once logged in can yield that admin's credentials. That's the logic of tiering.

### DPAPI

DPAPI lets programs encrypt data for a user. A master key in the user's profile protects the data, and it's itself protected by a key derived from the user's password. For domain accounts, there's a **domain backup key**, held on domain controllers, that can decrypt every user's master key. It's not rotated by default, so losing it is a serious, long-lived compromise.

### Advanced: how protection works

**LSA Protection** runs LSASS as a Protected Process Light. Ordinary admin processes can no longer open it, even with `SeDebugPrivilege`. It's enforced in user mode's view of the kernel, so an attacker with a kernel driver can remove it, which helps explain why vulnerable drivers are so popular. See Evasion concepts.

**Credential Guard** goes further, using virtualisation. Secrets move to `LSAIso.exe`, which runs in an isolated world (VTL1) that even the normal Windows kernel can't read. LSASS just asks it to perform operations. Dump LSASS and the hashes aren't there. It's enabled by default on many new Windows 11 Enterprise systems.

Credential Guard doesn't solve everything. It doesn't protect a password you type, supplied credentials such as those in a phishing page, or Kerberos tickets being used by a live session. Windows Hello for Business and hardware-backed keys reduce the value of stored passwords in the first place.

?? Why does stealing an NT hash help without cracking it?
+ NTLM uses the hash itself as the secret
- The hash contains the password in reversible form
- Windows sends the hash in plain text anyway
- Domain controllers accept hashes from a trusted subnet
=> NTLM computes its response from the hash, so holding it is the same as holding the password for that protocol.

## Threat model

| Target | ATT&CK |
|---|---|
| LSASS memory | [T1003.001](https://attack.mitre.org/techniques/T1003/001/) |
| SAM | [T1003.002](https://attack.mitre.org/techniques/T1003/002/) |
| NTDS | [T1003.003](https://attack.mitre.org/techniques/T1003/003/) |
| LSA Secrets | [T1003.004](https://attack.mitre.org/techniques/T1003/004/) |
| Cached domain credentials | [T1003.005](https://attack.mitre.org/techniques/T1003/005/) |
| Windows Credential Manager | [T1555.004](https://attack.mitre.org/techniques/T1555/004/) |

Attackers often avoid running a loud tool on the host. They dump memory with something legitimate, such as a Task Manager dump or a signed Microsoft tool, and analyse it elsewhere. Or they copy registry hives or use a Volume Shadow Copy.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `msinfo32`, `Get-CimInstance Win32_DeviceGuard` | Show Credential Guard state | Verifying protection |
| `cmdkey /list` | Lists stored credentials | Auditing a host |
| Sysinternals `Autoruns`, `Process Explorer` | Show what's running | Inspecting a host |
| Sysmon | Logs process access | Detecting LSASS reads |
| Mimikatz, secretsdump (awareness) | Attacker tools | Recognise them in reports. Test only in labs |
| Defender ASR rule | Blocks LSASS credential theft | Hardening without Credential Guard |

## Defence

- **Enable Credential Guard and LSA Protection.** Test for driver compatibility first.
- **Never expose privileged credentials on lower tiers.** Use tiering, plus a Protected Users group, which forbids NTLM, weak ciphers, delegation and long-lived caching.
- **Make local admin passwords unique** with Windows LAPS, so one hash doesn't unlock the fleet.
- **Reduce cached logons** on servers (`CachedLogonsCount`), and disable WDigest explicitly.
- **Enable Attack Surface Reduction** rules that block credential stealing from LSASS.
- **Protect domain controllers as Tier 0.** Back them up with care, as a backup holds `NTDS.dit`.

**Detection.**

| Signal | Source |
|---|---|
| A process opening LSASS | Sysmon 10, filter on `TargetImage` and `GrantedAccess` |
| `reg save` on SAM or SECURITY | Sysmon 1, event 4688 |
| Shadow copy creation | Event 8222, `vssadmin` in a command line |
| Dump file creation | Sysmon 11, for `.dmp` in odd places |
| `ntdsutil` activity on a DC | Command line logging |
| Backup key retrieval | Event 4662, on `BCKUPKEY` objects |

Many legitimate products touch LSASS, so build an allow-list of what's normal first. See Threat hunting.

## Pitfalls

- **"We use long passwords, so hashes are useless."** Pass-the-hash doesn't need to crack anything.
- **"Credential Guard stops all credential theft."** It protects specific derived secrets. Phishing, keyloggers and session theft remain.
- **"Disconnected RDP sessions are safe."** Secrets stay until you log off.
- **Looking only for `mimikatz.exe`.** Names change, and dumps may come from signed tools.
- **Ignoring backups.** A domain controller backup is a copy of every credential you have.

?? An admin RDPs to a workstation to fix a printer. Why is that dangerous?
+ Their credentials land in that workstation's memory for theft
- RDP sends the admin's password across the network unencrypted
- Printer drivers forward all credentials to the print server
- The workstation joins the Tier 0 group automatically afterwards
=> Interactive logons leave reusable material in LSASS. If that machine is already compromised, a low-tier box has just yielded a high-tier credential.

## Exercise

::: law Lab only
Use your own Windows lab. Never run credential tools on a work, school or shared machine: even a test can break policy or law, and it may expose real secrets.
:::

1. Check Credential Guard and LSA Protection on your lab Windows VM. Turn on `RunAsPPL`, reboot, and confirm it in the event log.
2. Install Sysmon with a config that logs event 10. Open Task Manager as admin, and create a dump of a harmless process, then look at what's logged.
3. Write a Sigma rule for access to `lsass.exe`. List three legitimate programs that it might catch on your VM.
4. Configure Windows LAPS in your lab domain. Confirm that two machines have different local admin passwords.
5. Using Group Policy, add a test admin to Protected Users. Note what breaks, such as NTLM logins.

?! A breach report says "attacker dumped LSASS on a helpdesk PC, then moved to a domain controller". Write the three controls which would most have changed the story, and what each would have stopped.

## Further reading

- [Credential Guard](https://learn.microsoft.com/en-us/windows/security/identity-protection/credential-guard/), on how the isolation works.
- [Configuring LSA protection](https://learn.microsoft.com/en-us/windows-server/security/credentials-protection-and-management/configuring-additional-lsa-protection).
- [Protected Users group](https://learn.microsoft.com/en-us/windows-server/security/credentials-protection-and-management/protected-users-security-group).
- [Windows LAPS](https://learn.microsoft.com/en-us/windows-server/identity/laps/laps-overview).
- [ATT&CK T1003, OS Credential Dumping](https://attack.mitre.org/techniques/T1003/), with detection notes.
