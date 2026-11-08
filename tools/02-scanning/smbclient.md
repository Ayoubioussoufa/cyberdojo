---
title: smbclient
summary: Lists and accesses Windows file shares from Linux.
side: both
use: own
docs: https://www.samba.org/samba/docs/current/man-html/smbclient.1.html
kali: samba
alt: enum4linux-ng
---
## What it's for
smbclient, part of Samba, talks to Windows file shares. Administrators use it to check that a share is available, and auditors use it to see what's exposed without a login.

## How it works
SMB is Windows' file sharing protocol, on TCP port 445. smbclient gives you an FTP-like prompt on a share. A null session is a login with no credentials. It's disabled on modern systems by default, though old servers and bad settings still allow it, and that's what you're checking for.

## Try it
::: law Your lab only
Only test your own lab servers.
:::

```
smbclient -L //192.168.56.10 -N
smbclient //192.168.56.10/public -U labuser
```

`-L` lists shares, and `-N` tries with no password. If a share opens with no login, then find out why.

## What defenders see
Windows records share access in events 5140 and 5145 when auditing is on. Disable SMBv1, require signing, block port 445 at the network edge, and review who can read each share. Sensitive files on a share open to everyone are a common finding.

?! An audit finds a share readable by all staff with a file named `passwords.xlsx`. What are your first three actions?
