---
title: RustScan
summary: Finds open ports fast, then passes them to Nmap.
side: both
use: own
docs: https://github.com/bee-san/RustScan
kali: rustscan
alt: nmap, masscan
---
## What it's for
RustScan speeds up the first step of a scan. It finds open ports quickly, then hands them to [Nmap](/tools/nmap/) for the detailed part.

## How it works
It opens many full TCP connections in parallel, using an async runtime, and treats a completed connection as an open port. So unlike masscan it doesn't need raw packets, though it's limited by your open file limit. Then it starts Nmap with only the ports it found, which saves a lot of time on single hosts.

## Try it
::: law Your lab only
Use it on your own lab hosts. A fast scan can disturb fragile services.
:::

```
rustscan -a 192.168.56.10 -- -sV
```

Everything after `--` goes to Nmap.

## What defenders see
Full connections appear in application logs, so it's noisier on the target than a half-open scan. Host and network sensors see a burst of short connections from one address.

?! Why might a full connect scan appear in a service's logs when a SYN scan doesn't?
