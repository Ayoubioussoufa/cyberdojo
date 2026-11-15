---
title: Windows from the inside
summary: Services, the registry, NTFS, users and SIDs, access tokens and UAC, seen through Sysinternals.
month: 5
minutes: 60
builds: explain SIDs, tokens, UAC and services to a non-expert, an exit-gate item
source: Sysinternals documentation, Microsoft | https://learn.microsoft.com/en-us/sysinternals/
words: registry, SID, access token
---
Time to meet Windows on its own terms. Keep a Windows VM open: this lesson is best done with the tools in front of you.

@term registry = Windows' central hierarchical database of system and user settings.
@term hive = A top-level section of the registry, stored in a file on disk.
@term NTFS = The standard Windows filesystem.
@term ADS (alternate data stream) = A hidden extra stream of data attached to an NTFS file.
@term SID (security identifier) = The unique ID Windows uses for a user or group.
@term access token = The object describing a process's identity and privileges.
@term UAC (User Account Control) = The Windows prompt that separates standard rights from admin rights.
@term Sysinternals = Microsoft's free suite of advanced Windows diagnostic tools.
@term WMI = Windows Management Instrumentation: a system for querying and managing Windows.
@term scheduled task = A Windows job that runs at a set time or event.

## Set up

::: try Your Windows VMs
Download the free evaluation images of [Windows 11 Enterprise](https://www.microsoft.com/en-us/evalcenter/evaluate-windows-11-enterprise) and [Windows Server](https://www.microsoft.com/en-us/evalcenter/). Give each 4 GB of RAM and a host-only adapter, take a snapshot, then get the [Sysinternals Suite](https://learn.microsoft.com/en-us/sysinternals/downloads/sysinternals-suite).
:::

| Tool | Use it to see |
|---|---|
| Process Explorer | The process tree, parents, loaded DLLs, signatures |
| Autoruns | Everything that starts automatically |
| Procmon | Every file, registry and process event, live |
| TCPView | Network connections per process |

None of these needs installing: unzip the suite and run the tool. Start with Process Explorer, because it replaces Task Manager for everything in this lesson. Right-click its column header, choose **Select Columns**, and add **Image Path**, **Command Line**, **User Name** and **Verified Signer**. Then use **Options → Verify Image Signatures**. You now see, for every process, where its file is, how it was started, who it runs as, and whether a known publisher signed it. Those four facts answer most questions an analyst asks about a process.

?? Which tool shows what starts automatically on Windows?
+ Autoruns, which lists startup items
- TCPView, which lists network connections
- Procmon, which records live events
- Notepad, which edits plain text
=> Autoruns is your first stop when hunting persistence.

## Processes that should look a certain way

Windows has a predictable tree, and malware often mimics it. `services.exe` starts services, `svchost.exe` hosts them, and `lsass.exe` handles logins and holds credential material. Each normal system process has an expected parent, location and count.

| Red flag | Why |
|---|---|
| `svchost.exe` running from `C:\Users\...` | The real one is in `System32` |
| `lsass.exe` with a child process | Lsass doesn't start programs |
| `scvhost.exe` | A typo-named impostor |

"Expected" is something you can write down. These are the usual parents of the core processes on a healthy machine:

| Process | Normal parent | Normal location |
|---|---|---|
| `wininit.exe` | None shown: its parent has exited | `C:\Windows\System32` |
| `services.exe` | `wininit.exe` | `C:\Windows\System32` |
| `lsass.exe` | `wininit.exe` | `C:\Windows\System32` |
| `svchost.exe` | `services.exe` | `C:\Windows\System32` |
| `explorer.exe` | None shown: its parent has exited | `C:\Windows` |

A real `svchost.exe` is also always started with a `-k` option that names the group of services it hosts. One with no `-k` on its command line isn't hosting anything.

PowerShell gives you the same view as text, which you can save and compare later:

```powershell
Get-CimInstance Win32_Process | Select-Object ProcessId, ParentProcessId, Name, ExecutablePath
Get-AuthenticodeSignature C:\Windows\System32\svchost.exe
```

The first line lists every process with its parent's ID and its file's path. The second checks one file's signature: `Status` should say `Valid`, and the signer should be Microsoft Windows.

The SANS [Hunt Evil poster](https://www.sans.org/posters/hunt-evil/) lists these. Print it.

?? Which of these is a red flag?
+ `svchost.exe` running from a user's folder
- `svchost.exe` running from the `System32` folder
- `lsass.exe` running once on the machine
- `services.exe` starting a normal Windows service
=> The real one lives in `System32`. Location gives away many impostors.

## Services and scheduled tasks

A **service** is a background program, often running as the very powerful `SYSTEM` account. A **scheduled task** runs at a time or event. Both are favourite persistence spots, and both are logged when created.

Look at both from the command line. `sc.exe qc` asks for one service's configuration:

```
> sc.exe qc Spooler
SERVICE_NAME: Spooler
        START_TYPE         : 2   AUTO_START
        BINARY_PATH_NAME   : C:\Windows\System32\spoolsv.exe
        SERVICE_START_NAME : LocalSystem
```

Three lines carry the story: it starts automatically at boot, this is the program it runs, and `LocalSystem` means it runs as `SYSTEM`. For any service you don't recognise, check that the program is in a Windows or Program Files folder and is signed.

```powershell
Get-Service | Where-Object Status -eq Running          # services running now
Get-ScheduledTask | Where-Object State -eq Ready       # tasks waiting for their trigger
```

Creating either one leaves a record, and these three event IDs are worth learning now: **7045** in the System log says a service was installed, **4697** in the Security log says the same with more detail, and **4698** says a scheduled task was created.

?? Why do attackers like Windows services?
+ They often run as powerful `SYSTEM`
- They can't be seen by anyone
- They only run on Linux machines
- They delete logs all by themselves
=> A service survives reboots, and it often has the highest rights. It's also logged when created.

## The registry

The **registry** is Windows' database of settings, arranged in **hives**, a bit like `/etc` as one big tree:

| Hive | Holds |
|---|---|
| `HKLM` | Settings for the whole machine |
| `HKCU` | Settings for the current user |

Values under `...\CurrentVersion\Run` start programs at login, which makes them a classic persistence location. You'll hunt those next lesson.

The registry has its own three words. A **key** is like a folder, a **value** is a named setting inside a key, and the **data** is what the value contains. Open `regedit` to browse it, or read a key from the command line:

```
> reg query "HKLM\Software\Microsoft\Windows\CurrentVersion\Run"
    SecurityHealth    REG_EXPAND_SZ    %windir%\system32\SecurityHealthSystray.exe
```

That's one value, named `SecurityHealth`, whose data is the path of a program. Windows starts every program listed in this key when any user logs in. The same key exists under `HKCU` for the current user only, and a standard user can write to that one without admin rights, which is exactly why attackers use it.

?? What does `HKLM` hold?
+ Settings for the whole machine
- Settings for one user only
- A folder of system logs
- A list of open ports
=> `HKCU` holds the current user's settings.

## NTFS

Beyond what Linux has, NTFS has a master file table (the **MFT**) recording every file, and **alternate data streams**: extra data attached to a file that Explorer doesn't show. Windows uses one to mark downloaded files as coming from the internet, and attackers can hide data in them. See both in Month 15.

You can see a stream for yourself. Download any file with a browser, then in PowerShell:

```
> Get-Item .\setup.exe -Stream *
Stream : :$DATA
Stream : Zone.Identifier

> Get-Content .\setup.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
```

`:$DATA` is the file's normal content. `Zone.Identifier` is the extra stream, and zone 3 means the internet. This marker is called the **Mark of the Web**, and it's the reason Windows warns you before running a downloaded program. For an investigator, it's evidence of where a file came from.

NTFS permissions are richer than Linux's nine bits. `icacls` prints them:

```
> icacls C:\Tools
C:\Tools BUILTIN\Administrators:(OI)(CI)(F)
         BUILTIN\Users:(OI)(CI)(RX)
```

Each line is "who, then what": `F` is full control, `M` modify, `RX` read and execute, `W` write. `(OI)(CI)` means files and folders inside inherit the entry. The question to ask is the one from Linux: who can write here? A folder that `Users` can modify, holding a program that `SYSTEM` runs, is the Windows version of the mode 777 cron script.

?? What's an alternate data stream?
+ Extra data attached to a file
- A second copy of Windows itself
- A network connection between two folders
- A log of all deleted files
=> Explorer doesn't show them, so they're a place to hide things.

## Identity: SIDs and tokens

Windows, like Linux, thinks in numbers. Every user and group has a **SID**:

```
> whoami /user
S-1-5-21-1004336348-1177238915-682003330-1001
```

The last part is the relative ID: 500 is the built-in Administrator, and 1000+ are normal users. When you log in, Windows builds an **access token** listing your SID, your groups and your privileges. Every process you start carries a copy.

A SID reads left to right. `S-1-5-21` says "an account on a machine or domain", the three long numbers identify that machine or domain, and the last number is the account. A few SIDs are the same on every Windows system, and you'll see them in logs constantly:

| SID | Who |
|---|---|
| `S-1-5-18` | `SYSTEM`, the operating system itself |
| `S-1-5-32-544` | The local Administrators group |
| `S-1-1-0` | Everyone |
| ends in `-500` | The built-in Administrator account |

Logs often record the SID and not the name, because names can be changed and SIDs can't.

@flow You log in > Token created > Your process carries the token > Kernel checks it on each access

That's exactly the check from Linux, with a token in place of a UID. Attackers who steal or duplicate a token become that user, without knowing the password. See your own with `whoami /all`.

?? An attacker duplicates a token from an admin's running process. What do they gain?
+ They act as that admin, with no password
- They learn the admin's password in plain text
- They delete the admin account from the machine
- Nothing, because tokens are only used at login
=> The token is the identity. That's why admin sessions left on workstations are so dangerous.

## UAC

An admin who logs in gets two tokens: a filtered one for daily work and a full one. **UAC** is the prompt that switches between them. It reduces accidents, and it's convenience rather than a guarantee: [Microsoft doesn't treat UAC as a security boundary](https://www.microsoft.com/en-us/msrc/windows-security-servicing-criteria).

Watch the two tokens yourself. Open PowerShell normally and run the first command, then open it again with **Run as administrator** and repeat:

```
> whoami /groups | findstr Mandatory
Mandatory Label\Medium Mandatory Level

> whoami /groups | findstr Mandatory
Mandatory Label\High Mandatory Level
```

Same user, same password, two different tokens. "Medium" is the filtered token for daily work, and "High" is the full one. `whoami /priv` in each window shows the list of privileges growing too.

?? Which is the most suspicious finding?
+ `svchost.exe` running from a temp folder
- `svchost.exe` running from `System32` several times
- `explorer.exe` running under the logged-in user
- `services.exe` running under its parent `wininit.exe`
=> Several `svchost.exe` processes are normal, as is `services.exe` under `wininit.exe`. The right name in the wrong folder is classic masquerading.

## Read a machine like an analyst

Three pieces of output from a workstation. For each, decide what it means before you look at the choices.

```
SERVICE_NAME: WinUpdaterSvc
        START_TYPE         : 2   AUTO_START
        BINARY_PATH_NAME   : C:\Users\Public\updater.exe
        SERVICE_START_NAME : LocalSystem
```

?? What makes that service a finding?
+ A file anyone can replace runs as `SYSTEM`
- A service is set to start at boot
- A service has the word update in it
- A program is stored on the `C:` drive
=> Any user can write to `C:\Users\Public`, and the service runs that file with the highest rights at every boot. Real services live in Windows or Program Files folders.

```
> Get-Content .\invoice.pdf.exe -Stream Zone.Identifier
[ZoneTransfer]
ZoneId=3
```

?? What does that stream tell you about the file?
+ It was downloaded from the internet
- It was scanned and found clean
- It was signed by its publisher
- It was created on this machine
=> Zone 3 is the internet: the Mark of the Web. Together with a name that ends in `.pdf.exe`, it tells you how a fake document probably arrived.

?? A PowerShell window shows `High Mandatory Level` in `whoami /groups`. What does that mean?
+ The shell runs elevated, as an administrator
- The shell is running inside a sandbox
- The user has a very strong password
- The machine is joined to a domain
=> High is the full admin token. Anything started from that window inherits it, which is why you only elevate when a task needs it.

::: try Take a baseline
1. In Process Explorer, find `lsass.exe`, `services.exe` and three `svchost.exe` processes. Note the parent, path and signer of each, and compare them with the table above.
2. Run `sc.exe qc` on two services you don't recognise, and check where their programs live.
3. Read both `Run` keys, in `HKLM` and `HKCU`, and explain every value.
4. Download a file, then read its `Zone.Identifier` stream.
5. Save the output of `whoami /all` from a normal and an elevated window, and list what differs.
:::

?! Explain SID, token, UAC and service to a non-expert, in one sentence each.
