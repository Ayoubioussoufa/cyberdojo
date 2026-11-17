---
title: chmod
summary: Sets who may read, write and run a file on Linux and macOS.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/chmod.1.html
aka: chown, umask
alt: sudo, lynis
---
## What it's for
Every file on Linux has an owner, a group, and three sets of permissions: for the owner, for the group and for everyone else. `chmod` changes the permissions, `chown` the owner and group, and `umask` sets what new files get by default. Much of hardening, from SSH keys to web folders, comes down to getting these right.

## How it works
`ls -l` shows them as `-rwxr-x---`: the first character is the type, then three groups of read (`r`), write (`w`) and execute (`x`) for owner, group and others. As a number, each group is a sum, read 4, write 2 and execute 1, so `750` means all rights for the owner, read and execute for the group, and nothing for others. On a folder, `x` means "may enter" and `r` "may list". There are special bits too: setuid, shown as `s` in the owner's execute place, makes a program run as its owner, which is how `passwd` can change a file that only root may write.

## Try it
```
ls -l ~/.ssh
chmod 600 ~/.ssh/id_ed25519
chmod 700 ~/.ssh
chmod u+x script.sh
sudo chown www-data:www-data /var/www/uploads
umask
```

SSH refuses a private key that others can read, so `600` (only you, read and write) is required, not just advised.

## What defenders see
Files anyone can write in system folders, secrets anyone can read, and unexpected setuid programs are what audits look for:

```
find / -xdev -perm -4000 -type f 2>/dev/null
find /etc -xdev -perm -o+w -type f 2>/dev/null
```

The first line lists setuid programs. Compare it with a known-good list, since a new one may be someone's way back in. [Lynis](/tools/lynis/) runs these checks for you.

?! A script `deploy.sh` has permissions `-rwxrwxrwx` and runs as root every night from cron. Why is that dangerous, and what should its permissions be?
