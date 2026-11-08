---
title: httpx
summary: Probes a list of hosts and reports which ones run a web server, and what it runs.
side: both
use: own
docs: https://docs.projectdiscovery.io/tools/httpx/overview
kali: httpx-toolkit
aka: httpx-toolkit
alt: subfinder, nuclei, whatweb
---
## What it's for
You've got 500 hostnames. Which ones serve a website, and what are they? httpx answers this in seconds. It's ProjectDiscovery's probe, and it isn't related to the Python library that shares its name.

## How it works
For each host it tries HTTP and HTTPS, follows options you set, and records the status code, page title, server header and certificate details. With technology detection, it matches responses against fingerprints. It's a normal web client running many requests in parallel, so it's active: each target receives a request.

## Try it
::: law Your assets only
This sends requests to each host. Use your own assets or a lab.
:::

```
httpx -l hosts.txt -status-code -title -tech-detect -o live.txt
```

On Kali, the package and the command are both called `httpx-toolkit`, because Python's `httpx` already took the name. That catches many people out.

## What defenders see
Web logs show one client hitting many virtual hosts, with a tool's default user agent unless it's been changed. It's a useful inventory check for defenders too: run it on your own ranges, and any unknown title or forgotten admin panel is your first finding.

?! Why does a name clash between two tools matter in a security workflow? What could go wrong if you ran the wrong `httpx`?
