---
title: Windows built-in defences
summary: AMSI, ETW, App Control, AppLocker and Attack Surface Reduction. What each one sees, where it sits, and why tampering with them is itself one of your best detections.
level: advanced
side: defence
minutes: 55
attack: T1562.001, T1562.006, T1059.001
needs: 02-06-windows-tokens-and-privileges, 0033-windows-logging-and-sysmon, 0034-powershell
pair: 02-08-windows-privilege-escalation, 06-06-edr-internals
source: Microsoft, Antimalware Scan Interface | https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal
words: AMSI, ETW, App Control for Business
---
Windows ships with more security plumbing than most people ever turn on. Understanding the plumbing is what separates someone who reads alerts from someone who designs detections. Each component here answers one question: at what moment, and with what view, does Windows get to look at what's about to happen?

@term AMSI (Antimalware Scan Interface) = A Windows API that lets scripting engines send content to the installed antivirus before running it.
@term ETW (Event Tracing for Windows) = The kernel-level logging system that Windows components use to publish events.
@term App Control for Business = The Windows code integrity feature, formerly WDAC, that decides which code may run.

## Concept

### Fundamentals: decisions at different moments

| Moment | Component | Question it answers |
|---|---|---|
| Before code runs | App Control, AppLocker | Is this binary, script or DLL allowed at all? |
| As a script runs | AMSI | What's the real content after it's been de-obfuscated? |
| During a risky action | Attack Surface Reduction rules | Is this behaviour allowed, such as Office spawning a child process? |
| After the fact | ETW, event logs | What happened? |

### AMSI

Files on disk can be scanned, but PowerShell can run a script that exists only in memory, after decoding it in several layers. AMSI addresses that. PowerShell, Windows Script Host, VBA macros, and .NET's assembly loader hand the *final* content to AMSI just before execution. So however heavily a script was obfuscated, the antivirus sees what's about to run. Because AMSI runs in the same process as the script, a process can tamper with it. Attackers try exactly this, so the tampering itself is a signal.

### ETW

**ETW** has three parts: **providers** publish events, **sessions** collect them, and **consumers** read them. Thousands of providers exist. Most event logs you read are delivered through it. EDR products subscribe to it, and the protected `Microsoft-Windows-Threat-Intelligence` provider reports sensitive actions from the kernel, such as remote memory writes. Only specially signed protected processes can consume that one.

User-mode providers run inside the process they're reporting on, so a malicious process can stop its own events. Kernel providers are harder to touch. So detection design should prefer kernel sources, and watch for gaps. See EDR internals.

### Application control

**AppLocker** sets rules by publisher, path or hash. It's easy to deploy, but Microsoft [doesn't treat it as a security feature](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol-and-applocker-overview) in the sense of a servicing boundary. **App Control for Business** (WDAC) enforces in the kernel, covers drivers, and can be signed so that an admin can't simply remove it.

| | AppLocker | App Control for Business |
|---|---|---|
| Enforced by | A user-mode service with a kernel driver | Kernel code integrity |
| Applies to admins | Weakly | Fully, when signed |
| Drivers | No | Yes |
| Per-user rules | Yes | No, per device |
| Effort | Lower | Higher |

Both push PowerShell into **Constrained Language Mode** when they're enforcing, which removes access to .NET types and Win32 calls.

### Advanced: why bypass attempts help defenders

Each layer has known weaknesses, and it would be pointless to pretend otherwise.

- **Living-off-the-land binaries**: allow-listing trusts Microsoft-signed programs, some of which can run arbitrary code. Microsoft publishes a [recommended block list](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/design/applications-that-can-bypass-appcontrol).
- **In-process tampering**: patching AMSI or a user-mode ETW provider.
- **Kernel access**: a vulnerable driver can blind almost everything.
- **Downgrade**: an older PowerShell version lacks AMSI and logging.

ATT&CK moved this behaviour into its **Defense Impairment** tactic in v19. The strategic point: a defence that's been silenced leaves a gap, and gaps are detectable. A host that stops sending logs, a provider that goes quiet, a sudden PowerShell 2.0 launch: each of these is a louder signal than most malware.

?? AMSI catches a heavily obfuscated PowerShell script. Why does the obfuscation not hide it?
+ AMSI sees the final content that's about to run
- AMSI collects the script's decryption keys from the attacker
- AMSI scans it in the cloud through a sandbox
- PowerShell refuses to run any script that's been obfuscated
=> The script has to deobfuscate itself to run. AMSI receives the content at that last step, not the wrapper.

## Threat model

Attackers follow a simple logic: first find out what's watching, then blind it, then act.

| Technique | ATT&CK |
|---|---|
| Disabling or modifying tools | [T1562.001](https://attack.mitre.org/techniques/T1562/001/) |
| Blocking indicators such as ETW | [T1562.006](https://attack.mitre.org/techniques/T1562/006/) |
| PowerShell | [T1059.001](https://attack.mitre.org/techniques/T1059/001/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `Get-MpComputerStatus`, `Get-MpPreference` | Show Defender state and rules | Auditing a host |
| `logman query providers` | Lists ETW providers | Exploring telemetry |
| App Control Policy Wizard | Builds policies | Designing allow-listing |
| `$ExecutionContext.SessionState.LanguageMode` | Shows PowerShell's mode | Testing enforcement |
| Event Viewer | Reads Applocker and CodeIntegrity logs | Checking enforcement results |

## Defence

- **Deploy App Control in audit mode first.** Run it for weeks, build the policy from real use, then enforce it. Start with servers and kiosks, which change least.
- **Block what bypasses it.** Add Microsoft's recommended block rules, and the vulnerable driver blocklist.
- **Remove PowerShell 2.0** on any system that still has it, and turn on script block logging.
- **Enable ASR rules**, again in audit mode first: block Office child processes, block credential theft from LSASS, block unsigned processes from USB.
- **Turn on Defender tamper protection**, so that local admins and malware can't switch it off.
- **Protect telemetry.** Forward logs off the host straight away.

**Detection.**

| Signal | Source |
|---|---|
| Script block content | PowerShell 4104 |
| Defender disabled | Defender 5001, config changes 5007 |
| Malware detected | Defender 1116, 1117 |
| App Control would block | CodeIntegrity 3076 (audit), 3077 (enforced) |
| AppLocker block | AppLocker 8004 |
| Sensor silence | Your SIEM, by alerting on missing heartbeats |

## Pitfalls

- **"Execution policy stops scripts."** It doesn't, as lesson 34 showed: it's a safety rail.
- **"AppLocker means allow-listing is solved."** Admins and LOLBins get around it, and it isn't serviced like a boundary.
- **Enforcing on day one.** You'll break business software and lose your project.
- **Trusting an alert's absence.** No alerts may mean that nothing happened, or that the sensor died.
- **Disabling Defender because you have an EDR.** Many EDRs run alongside it in passive mode, and that keeps AMSI data flowing.

?? A server stops sending logs at 02:00, with no reboot. What should you assume first?
+ Possible tampering, until you have proved a different cause
- Nothing happened, since there are no alerts from it
- A routine scheduled task has just cleared disk space
- The SIEM's licence must have expired that very night
=> Silence is a signal. A sensor that goes dark for no known reason deserves investigation, not relief.

## Exercise

::: law Lab only
Work on your own Windows VM. Don't disable security tools on any machine that's not yours, and don't look for bypasses against real systems.
:::

1. Run `Get-MpComputerStatus`, and note whether tamper protection is on.
2. In your lab, create an App Control policy in audit mode that uses the default Windows template. Run a program from `%TEMP%`, then read event 3076.
3. Run a harmless test string through PowerShell using the [EICAR test file](https://www.eicar.org/download-anti-malware-testfile/), and find the Defender event.
4. Enable script block logging. Run a base64-encoded `Get-Date`, then find the decoded content in event 4104.
5. In your SIEM, write a "host went silent" rule, and test it by stopping log forwarding.

?! Design a phased rollout of App Control across 500 laptops. Say what you'd do first, how you'd measure, and what would make you stop.

## Further reading

- [AMSI documentation](https://learn.microsoft.com/en-us/windows/win32/amsi/antimalware-scan-interface-portal).
- [About Event Tracing](https://learn.microsoft.com/en-us/windows/win32/etw/about-event-tracing), for how ETW works.
- [App Control and AppLocker overview](https://learn.microsoft.com/en-us/windows/security/application-security/application-control/app-control-for-business/appcontrol-and-applocker-overview).
- [Attack Surface Reduction rules reference](https://learn.microsoft.com/en-us/defender-endpoint/attack-surface-reduction-rules-reference).
- [ATT&CK's Defense Impairment tactic](https://attack.mitre.org/tactics/TA0112/).
