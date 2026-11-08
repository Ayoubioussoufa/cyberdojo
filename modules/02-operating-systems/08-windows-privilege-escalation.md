---
title: Windows privilege escalation
summary: From user to SYSTEM on Windows. Services, DLL search order, installers and tasks, seen through one pattern, along with the audits and logs that close each path.
level: intermediate
side: both
minutes: 55
attack: T1574.009, T1574.011, T1574.001, T1543.003, T1053.005, T1548.002
needs: 02-06-windows-tokens-and-privileges, 0057-auditing-for-privilege-escalation
pair: 02-06-windows-tokens-and-privileges, 02-09-windows-defences
source: Microsoft, Dynamic-Link Library Search Order | https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order
words: unquoted service path, DLL hijacking, side-loading
---
The rule from Linux holds on Windows: privileged code trusts something a user can change. Windows just has its own vocabulary of things to trust: service paths, DLL search order, installer policies and registry keys. Learn this list, and any Windows audit becomes much faster.

@term unquoted service path = A service path that contains spaces and no quotes, so Windows may try a different program first.
@term DLL side-loading = Placing a malicious DLL beside a legitimate program that loads it by name.

## Concept

### Fundamentals: where SYSTEM trusts users

| SYSTEM trusts | The mistake | Result |
|---|---|---|
| A service's binary | Users can write to it | Replace the program |
| A service's configuration | Users can change it | Point it at another program |
| A service's path string | Spaces and no quotes | Windows runs an earlier match |
| A DLL search path | Users can write to one folder | Their DLL loads in the service |
| An installer policy | `AlwaysInstallElevated` on | Any MSI runs as SYSTEM |
| A scheduled task | A user can edit its action | Code runs as its owner |
| A registry autorun | The key or target is writable | Code runs at next logon |
| A stored password | In `Unattend.xml`, scripts or GPP | An admin credential |
| A driver | A vulnerable signed driver | Kernel access |

### Services

The Service Control Manager starts services, often as SYSTEM. Each service has a binary path, a security descriptor, and a registry key under `HKLM\SYSTEM\CurrentControlSet\Services`.

**Unquoted paths.** Take `C:\Program Files\My App\svc.exe` with no quotes. Windows's `CreateProcess` tries each possible split at a space: `C:\Program.exe`, then `C:\Program Files\My.exe`, then the full path. If a user can write to any such location, their file runs first. This still appears in third-party software. It only works when the directory is writable, so audit that too.

**Weak ACLs.** If a service's security descriptor gives users `SERVICE_CHANGE_CONFIG`, they can point it elsewhere. Writable registry keys or binaries have the same effect.

### DLL search order

When a program loads a DLL by name, Windows looks in a set order. In the standard order with `SafeDllSearchMode` on:

1. Already loaded modules, and the **Known DLLs** list
2. The application's directory
3. `C:\Windows\System32`, then the Windows directory
4. The current directory
5. Each folder on `PATH`

**Search-order hijacking** places a DLL earlier in that list than the real one. If a privileged program asks for a DLL that doesn't exist, a writable folder in `PATH` is enough. **Side-loading** is a variant popular with malware: copy a signed, trusted program to a folder alongside a malicious DLL. The signed program runs, loads the DLL, and the activity appears to come from a trusted vendor's binary.

### Advanced: installers, tokens and drivers

**AlwaysInstallElevated** is a policy that lets anyone run an MSI as SYSTEM. It needs setting under both HKLM and HKCU to take effect. Don't enable it.

**Group Policy Preferences** used to store passwords in SYSVOL, encrypted with a key that [Microsoft published](https://learn.microsoft.com/en-us/openspecs/windows_protocols/ms-gppref/2c15cbf0-f086-4c74-8b70-1f2fa45dd4be). MS14-025 stopped new ones, but old files can linger.

**Kernel access** can be gained through **bring your own vulnerable driver**: installing a legitimately signed but flawed driver. That needs admin rights first, so it's mostly used to go from admin to kernel, in order to disable defences. See Evasion concepts.

Service accounts have a route of their own, through `SeImpersonate`. See [Tokens and privileges](/modules/02-06-windows-tokens-and-privileges/).

?? Why does an unquoted path only matter when a folder is writable?
+ The user must place a file in that location
- Windows reads quotes only from the protected system folders
- The service can't start until the folder's permissions change
- Quotes are added automatically on all the read-only drives
=> Windows tries each split, but nothing happens unless a matching file exists there. Default ACLs usually protect `C:\Program Files`.

## Threat model

| Technique | ATT&CK |
|---|---|
| Unquoted path | [T1574.009](https://attack.mitre.org/techniques/T1574/009/) |
| Service registry permissions | [T1574.011](https://attack.mitre.org/techniques/T1574/011/) |
| DLL hijacking and side-loading | [T1574.001](https://attack.mitre.org/techniques/T1574/001/) |
| New or changed services | [T1543.003](https://attack.mitre.org/techniques/T1543/003/) |
| Scheduled tasks | [T1053.005](https://attack.mitre.org/techniques/T1053/005/) |
| UAC bypass | [T1548.002](https://attack.mitre.org/techniques/T1548/002/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `accesschk` (Sysinternals) | Checks effective permissions | Auditing services and folders |
| `icacls`, `sc qc`, `sc sdshow` | Show ACLs and service settings | One service in detail |
| Procmon | Shows failed DLL lookups | Finding `NAME NOT FOUND` in writable paths |
| winPEAS, Seatbelt, PowerUp | Automated enumeration | Lab practice and authorised tests |
| Autoruns | Shows everything that auto-starts | Reviewing a host |
| PingCastle | Finds GPP passwords and more | Domain review |

## Defence

- **Quote every service path.** A one-line PowerShell check finds the unquoted ones.
- **Audit ACLs** on service binaries, service keys, folders on the system `PATH`, and scheduled tasks. Treat a writable entry in `PATH` as a finding.
- **Set `AlwaysInstallElevated` to off**, and enforce that by GPO.
- **Use App Control for Business or AppLocker.** Unknown binaries, DLLs and MSIs from user-writable paths simply don't run. See [Windows defences](/modules/02-09-windows-defences/).
- **Enable the vulnerable driver blocklist.**
- **Remove old secrets.** Search SYSVOL for `cpassword`, and clean up unattended install files.

**Detection.**

| Signal | Source |
|---|---|
| New service installed | Events 7045 (System) and 4697 (Security) |
| Service binary path change | Sysmon 13, on `ImagePath` values |
| New scheduled task | Event 4698 |
| Unsigned DLL loaded by a privileged process | Sysmon 7 |
| Signed binary running from a user folder | Sysmon 1, with path rules |
| `msiexec` running as SYSTEM from a user's temp folder | Sysmon 1 |

## Pitfalls

- **"It's signed, so it's safe."** Side-loading abuses a signed program to run an unsigned DLL.
- **"Vendor software knows what it's doing."** Installers often add writable folders to `PATH`.
- **"We removed local admin, so escalation is impossible."** Misconfigured services are exactly how users regain it.
- **Treating every finding as equal.** A writable folder in a user's own `PATH` differs from one in the system `PATH`.
- **Only checking once.** Each new software install can reintroduce these. Automate the audit.

?? Procmon shows a SYSTEM service looking for `helper.dll` in a folder where users can write. What's the risk?
+ A user's DLL could load inside that SYSTEM process
- The service will crash the next time it restarts
- Windows will block the service as a suspected threat
- The DLL's signature will expire after a short period
=> The lookup is the invitation. If a file with that name appears in the folder, it loads as SYSTEM.

## Exercise

::: law Lab only
Use your own Windows VM with a snapshot. Don't run enumeration tools on machines that you don't own.
:::

1. Create a harmless test service in your VM with `sc create` and a path that has spaces and no quotes. Find it with `wmic service get name,pathname` or PowerShell, then fix it.
2. Use `accesschk` to list services that your standard user can change. Grant one such right on your test service, and detect it.
3. Run Procmon with filters for `NAME NOT FOUND` and `.dll`, then start a few programs. Find a lookup in a folder that you'd need to protect.
4. Check `AlwaysInstallElevated` in both hives. Write a Group Policy that forces it off.
5. Install Sysmon, and create a rule for a signed binary running from `%TEMP%`. Copy `cmd.exe` there, run it, and confirm the alert.

?! Write a repeatable 10-point Windows privilege audit in priority order. For each check, give the command or tool, and say what a bad result looks like.

## Further reading

- [DLL search order](https://learn.microsoft.com/en-us/windows/win32/dlls/dynamic-link-library-search-order), Microsoft's definitive page.
- [Service security and access rights](https://learn.microsoft.com/en-us/windows/win32/services/service-security-and-access-rights).
- [Microsoft's vulnerable driver blocklist](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/microsoft-recommended-driver-block-rules).
- [LOLBAS](https://lolbas-project.github.io/), on how trusted Windows binaries get abused.
- [Sysinternals documentation](https://learn.microsoft.com/en-us/sysinternals/), for Autoruns, Procmon and accesschk.
