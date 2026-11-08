---
title: rundll32, regsvr32 and mshta
summary: Signed Windows programs that run code, which attackers use to launch payloads under a trusted name.
side: both
use: know
docs: https://lolbas-project.github.io/
aka: lolbas
alt: powershell, sysmon
---
## What it's for
rundll32, regsvr32 and mshta are legitimate Windows programs whose job is to run code: a library function, a registration script, an HTML application. Attackers use them as proxies, so their code runs under the name of a trusted, signed Microsoft program rather than a suspicious new process.

## How it works
Each was built for a real purpose. rundll32 runs a function inside a DLL; regsvr32 registers a component and can fetch a script to do so; mshta runs HTML applications that can contain script. The common thread is that all three execute code while appearing as expected system processes, so a defender watching only for unknown program names misses them. They're among the best-known entries in the [LOLBAS project](https://lolbas-project.github.io/).

## Practise safely
Learn their normal behaviour so the abnormal stands out. On a lab VM with [Sysmon](/tools/sysmon/), note what legitimate uses look like. The abuse signals are strong: these programs making network connections, being started by Office applications, running with script or URL arguments, or appearing with unusual parent processes. Read the community [Sigma](/tools/sigma/) rules to see the precise patterns.

## What defenders see
The parent-child relationship is often the giveaway: Word starting mshta, or regsvr32 reaching out to the Internet, has no honest explanation. Detailed command-line and process logging makes these visible, and application control can restrict their use. Focus on the context around the process, not the process name alone.

?! Why is the parent process often a stronger signal of abuse here than the program being run?
