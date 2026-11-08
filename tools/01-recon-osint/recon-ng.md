---
title: recon-ng
summary: A modular recon framework with a console and a database of findings.
side: both
use: own
docs: https://github.com/lanmaster53/recon-ng/wiki
kali: recon-ng
alt: theharvester, spiderfoot, maltego
---
## What it's for
recon-ng works like an organised notebook for OSINT. Each module collects one kind of data, and everything lands in a database, so one step's output feeds the next.

## How it works
It's a Python framework with a console like a shell. You create a workspace per project, install modules from its marketplace, and load one at a time. A module reads from tables such as `domains` and writes to `hosts` or `contacts`. That shared schema is the real design idea: modules chain without any glue from you. API keys unlock many modules.

## Try it
::: law Your domain only
Keep workspaces to a domain you own or are authorised to assess.
:::

```
recon-ng -w lab
marketplace install recon/domains-hosts/hackertarget
modules load recon/domains-hosts/hackertarget
options set SOURCE example.com
run
show hosts
```

The first line starts it with a workspace, and the rest run inside its console.

## What defenders see
Most modules use third parties, so you'll see little. The defence is the same as for other passive tools: know your exposure, and treat the collected data as sensitive if you hold it.

?! What's the benefit of a shared database between modules, compared with running separate scripts?
