---
title: sudo
summary: Runs one command as another user, usually root, and logs who did it.
side: both
use: open
docs: https://www.sudo.ws/docs/man/sudo.man/
alt: auditd, last
---
## What it's for
On Linux the root account can do anything, so day-to-day work happens as an ordinary user, and `sudo` raises one command at a time to root after asking for your own password. Who may do what is written in the `sudoers` policy, and every use is logged.

## How it works
`sudo` checks the policy in `/etc/sudoers` and the files in `/etc/sudoers.d/`. A rule reads *who, on which host, as whom, may run what*: `sam ALL=(root) /usr/bin/systemctl restart nginx` lets sam restart one service and nothing else. After a correct password, sudo remembers it for a few minutes. Edit the policy only with `visudo`, which refuses to save a file whose syntax error would lock everyone out.

## Try it
```
sudo -l
sudo whoami
sudo -k
sudo visudo -c
sudo journalctl _COMM=sudo --since today
```

`-l` lists what you may run, `-k` forgets the remembered password, and `visudo -c` checks the policy's syntax. Read your own `sudo -l`: could any allowed command give you a full shell?

## What defenders see
Every use is logged with the user, the folder and the full command, so the log becomes a record of administration. The risky rules are the broad ones: `ALL=(ALL) NOPASSWD: ALL`, or an allowed program that can start a shell or write any file, such as an editor, `find` or a scripting language. These are classic routes to root, which [Linux privilege escalation](/modules/02-04-linux-privilege-escalation/) explains from the defender's side, and audit tools like [Lynis](/tools/lynis/) flag them.

?! A user's `sudo -l` shows `(root) NOPASSWD: /usr/bin/vim /etc/hosts`. Why is that rule far more dangerous than it looks?
