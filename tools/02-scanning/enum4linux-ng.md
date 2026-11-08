---
title: enum4linux-ng
summary: Gathers information from Windows and Samba hosts over SMB.
side: both
use: own
docs: https://github.com/cddmp/enum4linux-ng
kali: enum4linux-ng
aka: enum4linux
alt: smbclient, nbtscan
---
## What it's for
enum4linux-ng asks a Windows or Samba host what it will reveal: its domain, policy, shares and users. It's a rewrite of the older `enum4linux`.

## How it works
It wraps Samba tools and makes a series of RPC and SMB requests. Each one tests what the host allows, often through a session with no password. Old systems answer too generously. Its output in JSON or YAML makes results easy to compare over time.

## Try it
::: law Your lab only
Only test a lab server you set up.
:::

```
enum4linux-ng -A 192.168.56.10 -oY result
```

`-A` runs all simple checks, and `-oY` saves YAML. Now harden the server, and run it again to prove the change.

## What defenders see
Many SMB and RPC requests in quick succession from one workstation are unusual. Require authentication for these interfaces, and restrict anonymous access, through the Windows settings `RestrictAnonymous` and `RestrictAnonymousSAM`.

?! Why is before-and-after evidence better than a screenshot of a changed setting?
