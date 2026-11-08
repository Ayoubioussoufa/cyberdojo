---
title: Fail2ban
summary: Blocks addresses that show signs of attack in log files.
side: defence
use: open
docs: https://github.com/fail2ban/fail2ban
kali: fail2ban
alt: ufw, auditd
---
## What it's for
Any service exposed to the Internet gets a constant stream of login attempts. Fail2ban watches the logs and temporarily blocks addresses that fail too often, which cuts the noise and slows down guessing.

## How it works
It reads log files and matches lines against patterns called filters, grouped into jails. When one address trips a threshold within a window, an action runs, usually a firewall rule that blocks it for a set time. So it turns log evidence into an automatic, temporary block. It reacts to what the logs show, so it only catches what's logged.

## Try it
::: law Your server only
Configure it on a server you own.
:::

```
sudo systemctl status fail2ban
sudo fail2ban-client status sshd
```

Enable the SSH jail on a lab server, make a few failed logins from another machine, and watch the address get banned.

## What defenders see
It's a useful layer, not a complete defence. Key-only SSH, no password login and multi-factor matter far more, since they remove the thing being guessed. Watch that you don't lock yourself out, and allow-list your own management addresses.

?! Fail2ban reduces brute-force noise, but what single SSH change makes password guessing pointless altogether?
