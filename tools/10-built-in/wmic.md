---
title: WMIC and WMI
summary: A Windows management interface used to run commands and gather information, locally and remotely.
side: both
use: know
docs: https://learn.microsoft.com/en-us/windows/win32/wmisdk/wmi-start-page
aka: wmi
alt: powershell, sysmon
---
## What it's for
Windows Management Instrumentation, reached through the older `wmic` command and through PowerShell, is a built-in system for managing Windows machines. It's powerful and remote-capable, which is exactly why intrusions use it to gather information, run programs and move between machines.

## How it works
WMI can query almost anything about a system and start processes, locally or on a remote host, over channels that are normal in a Windows network. So an attacker uses it to learn about a machine, to run a command on another computer, and to persist by subscribing to system events. All of this uses legitimate Windows machinery, which is what makes it blend in. The `wmic` command is deprecated, but WMI itself remains central.

## Practise safely
Focus on telling normal from abnormal. On a lab, observe that routine management produces WMI activity too, so volume alone isn't the signal. The useful signals are WMI starting unusual child processes, remote WMI from a host that has no reason to manage others, and WMI event subscriptions used for persistence. [Sysmon](/tools/sysmon/) can log WMI event subscriptions directly.

## What defenders see
Watch for WMI spawning command shells or scripting engines, for remote WMI between workstations, and for new permanent event subscriptions. Restrict who can use WMI remotely, and log it. Because it's so woven into Windows, removing it isn't an option, so visibility and least privilege are the defence.

?! WMI activity is normal on every Windows network, so why is volume a poor signal? What's a better one?
