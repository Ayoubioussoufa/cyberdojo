---
title: journalctl
summary: Reads and filters the systemd journal, where most Linux logs now live.
side: defence
use: open
docs: https://man7.org/linux/man-pages/man1/journalctl.1.html
alt: auditd, wazuh
---
## What it's for
On any Linux system that runs systemd, the journal collects the logs of the kernel, of every service and of logins in one indexed store, and `journalctl` is how you search it. It's the first stop when a service fails, and when you investigate what happened on a host.

## How it works
Each entry is structured: besides the message it carries fields such as the unit (`_SYSTEMD_UNIT`), process ID, user ID and an exact timestamp, so you filter by field instead of searching text. The journal is kept in `/var/log/journal` when it's persistent, or only in memory until the next reboot when it isn't, which is worth checking before you rely on it. Reading system logs needs root, or membership of the `adm` or `systemd-journal` group.

## Try it
```
journalctl -u ssh --since "1 hour ago"
journalctl -p err -b
journalctl -f
journalctl _UID=1000 --since today
journalctl -k
journalctl -o json -n 5
```

`-p err` shows errors and worse, `-b` this boot only, `-f` follows new lines live, `-k` the kernel, and `-o json` every field. Find your own last login in the journal.

## What defenders see
For a defender the journal is evidence, and attackers know it: `journalctl --vacuum-time`, `--rotate` or deleted files under `/var/log/journal` can mean someone is erasing tracks. Forwarding logs to a central server as they happen, with rsyslog or an agent like [Wazuh](/tools/wazuh/), keeps a copy an attacker can't reach. The [Linux forensics](/modules/08-07-linux-forensics/) module shows how to build a timeline from it.

?! An attacker had root on a server for an hour, and the journal shows nothing for that hour. What could explain the gap, and where would you look for a copy?
