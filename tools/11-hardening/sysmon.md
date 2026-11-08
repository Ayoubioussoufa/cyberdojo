---
title: Sysmon
summary: Records detailed activity on Windows, far beyond the default logs.
side: defence
use: open
docs: https://learn.microsoft.com/en-us/sysinternals/downloads/sysmon
aka: System Monitor
alt: wazuh, sigma
---
## What it's for
Windows' default logging misses much of what defenders need. Sysmon, a free Sysinternals tool, fills the gap, recording process creation, network connections, file changes and more, with the detail that detection relies on.

## How it works
It installs as a service and a driver, and writes to its own event log. A configuration file decides what to record and what to ignore, which is essential, since recording everything would overwhelm you. Its process-creation events include the command line, the parent process and a hash, which together catch patterns such as [living off the land](/modules/06-03-living-off-the-land/). Event ID 1 is process creation, and ID 3 is a network connection.

## Try it
::: law Your machine only
Install it on a Windows VM you own.
:::

Install Sysmon with a community configuration such as the widely used one from Olaf Hartong or SwiftOnSecurity. Then open a few programs, and read the process-creation events, noting the parent-child relationships.

## What defenders see
Sysmon is the backbone of Windows detection in many organisations. Pair it with a good configuration, ship the events to your SIEM, and write [Sigma rules](/tools/sigma/) against them. Watch for Sysmon itself being unloaded, which a capable attacker may try.

?! Why is the parent process of a new process so useful for detection? Give an example of a suspicious pairing.
