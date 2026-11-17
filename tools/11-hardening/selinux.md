---
title: SELinux
summary: Labels every file and process on Linux, and allows only what its policy permits between labels.
side: defence
use: open
docs: https://github.com/SELinuxProject/selinux-notebook
aka: getenforce, setenforce
alt: apparmor, auditd
---
## What it's for
SELinux is the mandatory access control system of Red Hat, Fedora, Rocky Linux and Android. Like [AppArmor](/tools/apparmor/), it limits what a program may do whoever runs it, but it works with labels instead of paths, which makes it finer and stricter.

## How it works
Every process and every file carries a label, its *context*, such as `httpd_t` for the web server process and `httpd_sys_content_t` for web content. The policy lists which process types may do what to which file types, and everything else is refused, even for root. A web server taken over by an attacker therefore still can't read `/etc/shadow` or users' home folders. There are three modes: *enforcing* blocks, *permissive* only logs, and *disabled* turns it off.

## Try it
```
getenforce
sestatus
ls -Z /var/www/html
ps -eZ | grep httpd
sudo ausearch -m AVC -ts recent
sudo restorecon -Rv /var/www/html
```

`-Z` shows contexts. A file moved into the web folder can keep the wrong label, and the server then refuses it: `restorecon` gives it the label its location expects.

## What defenders see
Refusals land in the audit log as `AVC denied` messages, which [auditd](/tools/auditd/) and `ausearch` read and `audit2why` explains. The most common mistake is to fix a problem with `setenforce 0`, which switches the whole protection off, often for good. Fix the label, or turn on a documented boolean with `setsebool`, and alert when a server leaves enforcing mode.

?! A website returns "403 Forbidden" for a file that `ls -l` shows as readable by everyone. How might SELinux explain this, and which two commands confirm and fix it?
