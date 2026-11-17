---
title: sed
summary: Edits text as it streams past: replaces, deletes or picks out lines.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/sed.1.html
alt: awk, grep
---
## What it's for
`sed`, the stream editor, changes text without opening an editor: replace a value in a configuration file, strip comments, or cut a range of lines out of a huge log. It works in scripts, so a change can be made the same way on a hundred servers.

## How it works
`sed` reads its input line by line and applies commands to it. The most used is `s/old/new/`, which replaces the first match on each line, and a `g` at the end replaces every match. `-n` with `p` prints only the lines you pick, and `d` deletes. An address before a command limits it to some lines: a number, a range such as `10,20`, or a pattern such as `/error/`. `-i` edits a file in place, so keep a backup with `-i.bak`.

## Try it
```
sed -n '100,120p' big.log
sed 's/password=[^&]*/password=REDACTED/g' access.log
sed '/^#/d; /^$/d' /etc/ssh/sshd_config
sudo sed -i.bak 's/^#\?PermitRootLogin.*/PermitRootLogin no/' /etc/ssh/sshd_config
```

The second line masks passwords in a log before you share it. The last changes an SSH setting and keeps the original as `sshd_config.bak`; check the result with `sudo sshd -t` before restarting the service.

## What defenders see
`sed` is mostly a defender's tool: hiding secrets in logs before sharing them, and applying hardening the same way everywhere. On a compromised host, though, `sed -i` on configuration or log files can be an intruder quietly changing settings or deleting lines that mention them, which is why log integrity relies on copies sent off the machine.

?! You run `sed -i 's/admin/user/' users.conf`, and later find that the line `administrator=1` became `useristrator=1`. Why, and how would you write the command safely?
