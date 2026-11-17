---
title: Chainsaw
summary: Hunts through Windows event logs quickly, with Sigma rules and keyword searches.
side: defence
use: open
docs: https://github.com/WithSecureLabs/chainsaw
alt: sigma, get-winevent, velociraptor
---
## What it's for
During an incident you often receive a folder of `.evtx` event log files from a Windows machine and need answers fast. Chainsaw, an open-source tool from WithSecure, searches them in seconds and runs [Sigma](/tools/sigma/) detection rules over them, with no SIEM needed.

## How it works
It reads EVTX files directly, so it also runs on Linux and macOS. `search` finds keywords or patterns in events. `hunt` applies Sigma rules, through a mapping file that says which Windows event fields each rule refers to, along with its own rules for things such as cleared logs and new services. Results come out as a table, CSV or JSON.

## Try it
```
chainsaw search mimikatz -i evtx/
chainsaw search -t 'Event.System.EventID: =4625' evtx/
chainsaw hunt evtx/ -s sigma/rules --mapping mappings/sigma-event-logs-all.yml
chainsaw hunt evtx/ -s sigma/rules --mapping mappings/sigma-event-logs-all.yml --csv --output results
```

Practise on a public set of sample attack logs, such as the EVTX-ATTACK-SAMPLES repository, and then on your own lab VM's logs.

## What defenders see
Chainsaw sits on the defender's side, and its answers are only as good as the logs: if process creation auditing (event 4688) or [Sysmon](/tools/sysmon/) wasn't on, many rules have nothing to match. Treat its hits as leads to verify, since generic Sigma rules also fire on legitimate admin work. Pair it with [Get-WinEvent](/tools/get-winevent/) for a closer look at single events.

?! Chainsaw finds nothing in a machine's logs, yet you know the machine was compromised. Give three reasons why the logs might stay silent.
