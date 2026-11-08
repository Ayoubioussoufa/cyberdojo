---
title: auditd
summary: Records security-relevant events in the Linux kernel.
side: defence
use: open
docs: https://man7.org/linux/man-pages/man8/auditd.8.html
kali: auditd
aka: Linux audit
alt: osquery, wazuh
---
## What it's for
When something happens on a Linux server, auditd is how you know. It's the kernel's audit system, recording who ran what, who touched which file, and which system calls were made.

## How it works
Rules tell the kernel what to record. A watch on a file logs every access to it. A system call rule logs calls such as `execve`, which captures every command run. The kernel writes these events to a log that an attacker with only user rights can't quietly change. That's why it's trusted evidence, where a shell history isn't. The volume can be huge, so rules must be focused.

## Try it
```
sudo auditctl -w /etc/passwd -p wa -k passwd_changes
sudo ausearch -k passwd_changes
```

The first line watches a file for writes, and the second reads the matching events. The [Linux persistence module](/modules/02-05-linux-persistence-and-audit/) covers a fuller rule set.

## What defenders see
auditd is a foundation of Linux detection. The widely used rules from Florian Roth and the [auditd rules project](https://github.com/Neo23x0/auditd) map to ATT&CK. Ship the logs off the host quickly, so they survive a compromise, and watch for the audit service being stopped, which is itself an alert.

?! Why is an auditd record more trustworthy as evidence than a user's shell history?
