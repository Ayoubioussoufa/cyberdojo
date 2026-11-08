---
title: ufw
summary: A simple front end to the Linux firewall, common on Ubuntu.
side: defence
use: open
docs: https://help.ubuntu.com/community/UFW
kali: ufw
alt: firewalld, nftables
---
## What it's for
ufw, the "uncomplicated firewall", is the easy way to manage the firewall on Ubuntu and Debian. It's ideal for a single server, where firewalld's zones would be more than you need.

## How it works
It translates simple commands into the kernel's rules. You set a default policy, usually deny incoming and allow outgoing, then open the few ports you need by name or number. That default-deny stance is the key idea: everything is blocked unless you've allowed it. It handles the common cases, and for anything complex you drop to nftables.

## Try it
::: law Your machine only
Keep another way in before you enable it, so a mistake doesn't lock you out.
:::

```
sudo ufw default deny incoming
sudo ufw allow 22/tcp
sudo ufw enable
sudo ufw status verbose
```

Enable it on a lab server, allow only SSH, and confirm that other ports are refused from another machine.

## What defenders see
On a server, allow only the ports that serve a purpose, and review the list when services change. The first project hardens a server this way. Combine it with [Fail2ban](/tools/fail2ban/) for exposed services.

?! Why is "deny incoming by default, then allow what you need" safer than "allow everything, then block known bad"?
