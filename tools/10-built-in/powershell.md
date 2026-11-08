---
title: PowerShell
summary: Windows' scripting engine, and a favourite of attackers for the same reasons admins love it.
side: both
use: know
docs: https://learn.microsoft.com/en-us/powershell/scripting/security/security-features
kali: powershell
aka: pwsh
alt: sysmon, sigma
---
## What it's for
PowerShell is Windows' powerful scripting and automation engine. Administrators depend on it, and so do attackers, because it's trusted, pre-installed, and can do almost anything. Understanding how it's abused, and how to watch it, is essential for any Windows defender.

## How it works
It's a full scripting language with deep access to the system. Attackers favour it because it's already present and often allowed, and because scripts can run entirely in memory, leaving little on disk. This fits the [living off the land](/modules/06-03-living-off-the-land/) pattern: use what's already trusted rather than bring a tool that antivirus might flag. The defender's job is to tell routine administration apart from abuse.

## Practise safely
Microsoft has built strong visibility into PowerShell, and turning it on is the whole game. Script block logging records what actually ran, even when it's obfuscated. Module logging and transcription add detail. The Antimalware Scan Interface lets antivirus inspect script content as it executes. Constrained Language Mode limits what untrusted scripts can do. Enable these on a lab VM, run a harmless script, and find the record in the event log.

## What defenders see
Watch for signs of abuse: heavily obfuscated commands, encoded command-line arguments, PowerShell launched by Office applications, and connections to outside hosts. [Sysmon](/tools/sysmon/) and [Sigma](/tools/sigma/) rules capture these well. The strongest footing is enabling the logging above, since without it PowerShell is nearly invisible, and with it, it's one of your richest sources.

?! Why do attackers prefer a built-in tool like PowerShell over bringing their own program? What does that tell you about where to focus detection?
