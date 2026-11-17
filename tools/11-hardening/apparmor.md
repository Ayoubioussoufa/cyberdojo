---
title: AppArmor
summary: Confines Linux programs to the files and capabilities that their profile allows.
side: defence
use: open
docs: https://apparmor.net/
aka: aa-status
alt: selinux, auditd
---
## What it's for
Normal Linux permissions ask "which user is this?". AppArmor adds "which program is this, and what may it touch?". A confined web server, even one running as root, can only open the paths its profile lists. It's on by default in Ubuntu, Debian and SUSE.

## How it works
Each profile is attached to a program by its path, and lists what it may read, write and run, which network access it gets and which root powers (capabilities) it keeps. The kernel checks every access against the profile. A profile is in one of two modes: *enforce* blocks and logs anything not allowed, while *complain* only logs, which is how you write a new profile without breaking the program. `aa-complain` and `aa-enforce`, given a profile file, switch between them.

## Try it
```
sudo aa-status
ls /etc/apparmor.d/
sudo journalctl -k --since today | grep -i apparmor
```

`aa-status` lists every loaded profile, its mode, and the processes it confines. Find one confined process on your machine and read its profile in `/etc/apparmor.d/`.

## What defenders see
A `DENIED` line in the kernel log (`apparmor="DENIED" operation="open" profile=...`) means a confined program tried something outside its profile: a bug, a missing rule, or an intruder who took over the program and is finding its walls. Watch for those lines, and check that important services are confined at all, since an unconfined one gets no protection. Docker gives containers an AppArmor profile by default; the [Linux confinement](/modules/02-03-linux-confinement/) module covers it alongside SELinux and seccomp.

?! You switch a profile to enforce mode and the service stops working. How do you find out exactly what it was denied, without simply turning AppArmor off?
