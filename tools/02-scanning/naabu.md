---
title: naabu
summary: A simple, fast port scanner built for pipelines.
side: both
use: own
docs: https://docs.projectdiscovery.io/tools/naabu/overview
kali: naabu
alt: nmap, masscan, httpx
---
## What it's for
naabu is a port scanner from ProjectDiscovery. It fits between [subfinder](/tools/subfinder/) and [httpx](/tools/httpx/) in an automated pipeline.

## How it works
It sends SYN packets when it has the rights to, and falls back to full connections otherwise. It takes hostnames or addresses on standard input and prints plain `host:port` lines, so other tools can read them. That simple output is the design: each tool in the chain does one thing.

## Try it
::: law Your lab only
Scan your own hosts.
:::

```
naabu -host 192.168.56.10 -top-ports 100 -silent
```

Then pipe the output into `httpx` to see which ports serve web pages.

## What defenders see
It looks like any other scan: many ports, one source, a short time. Detection rules for scanning apply unchanged.

?! What do you gain by building a pipeline of small tools instead of using one big scanner?
