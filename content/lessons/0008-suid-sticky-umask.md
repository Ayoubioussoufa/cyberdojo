---
title: The special bits attackers hunt for
summary: SUID, SGID, the sticky bit and umask, why they exist, and how a badly chosen one turns a user into root.
month: 1
minutes: 25
builds: hunt SUID files, abuse one in your lab, then fix it
source: credentials(7), on real and effective user IDs | https://man7.org/linux/man-pages/man7/credentials.7.html
words: SUID, sticky bit, privilege escalation
---
Here's a puzzle. You can change your own password with `passwd`, and passwords are stored in `/etc/shadow`, which only root can write. So how does your program, run by you, write to a root-only file?

@term SUID (set-user-ID) = A permission bit that makes a program run with its file owner's power, not the caller's.
@term SGID (set-group-ID) = Like SUID but for the group. On a directory, new files inherit the directory's group.
@term sticky bit = A directory bit that lets users delete only their own files inside it. /tmp uses it.
@term umask = A setting that removes permissions from every new file you create.
@term effective UID (euid) = The identity the kernel uses for permission checks on a running process.
@term privilege escalation = Gaining more access than you were given, such as going from a normal user to root.

## SUID: borrowing the owner's identity

A running process has two IDs: who **really** started it, and who it **acts as**. Normally they're the same. The [SUID bit](https://man7.org/linux/man-pages/man2/chmod.2.html), mode 4000, changes that: when a SUID program starts, its effective user ID becomes the file's **owner**.

```
$ ls -l /usr/bin/passwd
-rwsr-xr-x 1 root root 68208 Mar 14  /usr/bin/passwd
   ↑ the s means SUID
```

The `s` is where the owner's `x` would be. When you run `passwd`, it acts as root, so it can update `/etc/shadow`. That's the answer to the puzzle. It's safe only because `passwd` is written with great care to do one narrow job.

::: key Why attackers hunt SUID files
A SUID root program is a small door into root's power. If that program can be tricked into reading any file or running any command, you get root's power too. Finding those programs is step one of Linux privilege escalation.
:::

The exit-gate command for this month finds them all:

```
find / -perm -4000 -type f 2>/dev/null
```

`-perm -4000` means "these bits are set, whatever the others are". The `2>/dev/null` hides the permission errors.

@term GTFOBins = A public list of ordinary Unix programs that can be abused if given extra privileges.

You'll find mostly normal ones, like `passwd`, `sudo` and `mount`. The interesting ones are unusual: something in `/usr/local/bin` or `/opt`. The community list [GTFOBins](https://gtfobins.github.io/) shows how ordinary programs can be abused when they have this bit. You'll use it in Month 10, when you audit for this kind of thing.

?? `find` lists `/usr/bin/passwd` as SUID root. Is that a vulnerability?
+ No, it needs root for one narrow, careful job
- Yes, every SUID file on a system is bad
- Yes, because passwords should never be changed by users
- No, because SUID has no effect on modern kernels
=> Many SUID programs are expected. What matters is whether a program should have it, and whether it can be misused.

## SGID and the sticky bit

**SGID (2000)** does the same for the group. On a directory it's more useful: new files inside inherit the directory's group, which keeps a team's shared folder working.

**The sticky bit (1000)** solves a different problem. `/tmp` must be writable by everyone, but write permission on a directory lets you delete files in it. So anyone could delete anyone's files. The sticky bit adds a rule: **only a file's owner can delete it**.

```
$ ls -ld /tmp
drwxrwxrwt 12 root root 4096 Oct 27 09:00 /tmp
         ↑ the t means sticky
```

| Bit | Number | Shows as | Effect |
|---|---|---|---|
| SUID | 4000 | `s` in owner | Program runs as the file's owner |
| SGID | 2000 | `s` in group | Program runs as the group; directory passes on its group |
| Sticky | 1000 | `t` in others | Only the owner can delete files inside |

A capital `S` or `T` means the bit is set but the execute bit underneath isn't.

?? Why does `/tmp` have the sticky bit set?
+ So that users can't delete each other's files
- So that files stay there after a reboot
- So that only root is able to write
- So that programs always run as root there
=> Everyone can write to `/tmp`, and write access to a folder normally allows deleting. The sticky bit limits that to a file's owner.

## umask: the default for new files

Why is a new file `644` and not `666`? Because of the **umask**, which removes permissions from everything you create. New files start from 666 and directories from 777, and the umask's bits are taken away.

```
$ umask
0022
```

With `022`, files become 644 and directories 755. A stricter `077` gives 600 and 700. That's a simple hardening step for an account that handles sensitive data.

?? With umask `027`, what mode does a new directory get?
+ 750, since 777 loses the masked bits
- 640, since new directories start from 666
- 027, since the mask becomes the mode
- 777, since umask only affects plain files
=> Directories start from 777. Removing 027 clears write for the group and everything for others, leaving 750.

@range suid

::: law
You just escalated privileges in your own simulated lab. On any system you don't own, that's a crime, even if a SUID file is "just sitting there".
:::

?! Explain to a developer why making a backup script SUID root is dangerous, and suggest a safer way.

## What you can do now

You can explain SUID, SGID and the sticky bit, which is an exit-gate item, and you've walked the whole build-break-fix loop once. Next: processes.
