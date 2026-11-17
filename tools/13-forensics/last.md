---
title: last
summary: Shows who logged in to a Linux machine, from where and for how long.
side: defence
use: open
docs: https://man7.org/linux/man-pages/man1/last.1.html
aka: lastb, lastlog
alt: journalctl
---
## What it's for
`last` lists recent logins and logouts, reboots and shutdowns, newest first. `lastb` lists failed logins, and `lastlog` shows each account's most recent login. Together they answer the first questions of an investigation: who was on this machine, from where, and when.

## How it works
Each successful login is recorded in the binary file `/var/log/wtmp`, failed ones in `/var/log/btmp` (readable only by root), and each user's latest login in `/var/log/lastlog`. `last` reads wtmp and pairs each login with its logout to show the session's length. "still logged in" means no logout yet, and "gone - no logout" usually means a crash or a reboot. Some newer distributions replace wtmp with a database, `wtmpdb`, which `last` then reads instead. `who` and `w` show who is logged in right now.

## Try it
```
last -n 20
last -i
last reboot
sudo lastb -n 20
lastlog | grep -v 'Never'
w
```

`-i` shows addresses instead of host names. Check that every login of the last week matches someone you know.

## What defenders see
A login at an odd hour, from a country your team isn't in, or to a service account that never logs in interactively deserves a question. These files are easy to tamper with for anyone with root, so a clean `last` proves little after a compromise: compare it with the auth log in the [journal](/tools/journalctl/) and with central copies, and treat a wtmp that is suddenly empty or truncated as a finding in itself.

?! `last` shows nothing unusual, but the SSH log shows a successful root login at 03:12 from an unknown address. Which source do you trust, and why?
