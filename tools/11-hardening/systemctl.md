---
title: systemctl
summary: Starts, stops and inspects the services that systemd runs on a Linux machine.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/systemctl.1.html
alt: journalctl, ss
---
## What it's for
On most Linux systems, systemd starts everything after boot, and `systemctl` is how you talk to it: which services run, which start at boot, why one failed. Turning off what you don't need is one of the simplest hardening steps there is.

## How it works
Each service is a *unit*, described in a unit file such as `/usr/lib/systemd/system/ssh.service`. Files in `/etc/systemd/system/` take priority over those, which is where local changes go. A unit file says which program to run, as which user, and after what. *Enabled* means it starts at boot and *active* means it runs now, and the two are independent. Timers, `.timer` units, are systemd's way of scheduling jobs.

## Try it
```
systemctl list-units --type=service --state=running
systemctl list-unit-files --state=enabled
systemctl status ssh
sudo systemctl disable --now cups
systemctl list-timers
systemctl cat ssh
```

`disable --now` stops a service and keeps it from starting at boot. List what runs on your machine, and justify each one.

## What defenders see
A new unit file in `/etc/systemd/system/`, or a new timer, is a common way for an intruder to make a program start at every boot, and ATT&CK lists it as a persistence technique. Compare enabled units with a baseline, check what each unit's `ExecStart` line runs, and read unit files with `systemctl cat`. The [Linux persistence](/modules/02-05-linux-persistence-and-audit/) module covers the other places to look.

?! `systemctl list-timers` shows a timer called `sys-update.timer` that nobody remembers adding. What do you look at to decide whether it's malicious?
