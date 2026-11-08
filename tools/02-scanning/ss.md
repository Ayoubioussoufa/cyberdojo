---
title: ss
summary: Shows which ports are listening and who's connected on a Linux host.
side: both
use: open
docs: https://man7.org/linux/man-pages/man8/ss.8.html
kali: iproute2
aka: netstat
alt: nmap
---
## What it's for
`ss` shows a host's sockets from the inside. It replaced `netstat` on Linux, and Windows still has `netstat`. A scanner guesses from outside, while `ss` asks the kernel directly.

## How it works
It reads socket information from the kernel through the netlink interface, which is quicker than `netstat`'s reading of `/proc/net`. For each socket it shows the state, addresses, and, with root, the owning process. A service listening on `127.0.0.1` can't be reached from outside, while `0.0.0.0` means every interface.

## Try it
```
sudo ss -tulpn
ss -tn state established
```

`-t` is TCP, `-u` UDP, `-l` listening, `-p` process and `-n` numeric. List each listening port on your machine, and justify it.

## What defenders see
A rootkit can hide from these tools, so compare with an outside scan. On a server, an unknown listener or a long connection to an odd address deserves attention. Attackers use `netstat` to learn about a host, so on Windows it's an ATT&CK-listed tool, and a burst of such commands is a useful signal.

?! A service shows `127.0.0.1:5432` in `ss`. Can a remote attacker reach it directly? What could change that?
