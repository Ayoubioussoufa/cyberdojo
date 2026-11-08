---
title: Users, groups and permissions
summary: How Linux decides who can do what to each file, and how to read and set those permissions.
month: 1
minutes: 35
builds: read any ls -l line and fix permission problems with chmod
source: chmod(1) manual page | https://man7.org/linux/man-pages/man1/chmod.1.html
words: owner, group, least privilege
---
In lesson 3 you learned that the kernel checks every request. Now you'll see exactly what it checks. This is the most asked-about topic in junior technical interviews, and the base of everything you'll audit for privilege escalation in Month 10.

@term user = An identity on the system. The kernel knows it by a number, the UID.
@term UID = User ID, the number that the kernel uses to identify a user.
@term group = A named set of users who share access to files.
@term root (superuser) = The administrator account, UID 0, which the kernel lets bypass normal permission checks.
@term sudo = A command that runs another command as root, if you're allowed to.
@term permissions (mode) = The rules on a file saying who may read, write or execute it.
@term chmod = The command that changes a file's permissions.
@term octal = Base-8 numbers, used as a short way to write permissions, such as 755.

## Who are you?

```
$ id
uid=1000(ana) gid=1000(ana) groups=1000(ana),2001(sec)
```

You're a **user**, and to the kernel that's just a number, your **UID**. You also belong to **groups**: named sets of users, like a team. `/etc/passwd` lists all users. It's readable by everyone, but it holds no passwords. The password hashes live in `/etc/shadow`, which ordinary users can't read.

One account is special. **root** has UID 0, and the kernel lets it bypass the usual permission checks. That's why attackers want it, and why you don't work as root day to day. When you need admin power, `sudo command` borrows it for one command, and logs that you did.

::: why Names don't matter, numbers do
The kernel only sees numbers. Any account with UID 0 *is* root, whatever it's called. Adding a second UID 0 account is a classic backdoor, and your Month 3 audit script will hunt for it.
:::

?? An account named `backup` has UID 0. What can it do?
+ Everything root can, as kernels only see numbers
- Only backups, because of the name it's given
- Nothing yet, until someone adds it to `sudo`
- Read files, but it can never change them
=> UID 0 is what makes root. The name is only a label for people.

## Reading a permission line

`ls -l` shows the permissions:

```
-rw-r----- 1 ana sec 1024 Oct 27 09:14 report.txt
│└┬┘└┬┘└┬┘   └┬┘ └┬┘
│ │  │  │     │   └─ group
│ │  │  │     └───── owner
│ │  │  └─────────── others: ---  nothing
│ │  └────────────── group:  r--  read only
│ └───────────────── owner:  rw-  read and write
└─────────────────── type:   -  file, d directory, l link
```

Three classes of people, three possible rights:

| Letter | On a file | On a directory |
|---|---|---|
| `r` read | See its contents | List the names inside |
| `w` write | Change its contents | Create, delete and rename files inside |
| `x` execute | Run it as a program | Enter it and reach files inside |

::: trap Directories are different
To delete a file, you need write permission on the **directory**, not on the file. A file you can't write to can still be deleted by anyone who can write to its folder. That surprises people, and it matters.
:::

?? In `-rwxr-x---`, what can a member of the group do?
+ Read and run it, but not change it
- Read, change and run it, like the owner
- Nothing at all, as it's a private file
- Run it, but they can't ever read it
=> The middle three letters are for the group: `r-x`. So they can read and run it, with no `w`.

## How the kernel decides

The check is simple, and it stops at the first match:

@flow Are you the owner? use owner bits > Else in the group? use group bits > Else use others bits

The kernel **doesn't fall through**. If you're the owner and the owner bits say no, you're refused, even if "others" would be allowed.

?? A file is `----r--r--` and owned by ana. Ana tries to read it. What happens?
+ Refused, because the owner bits are checked alone
- Allowed, because everyone else already has read access
- Allowed, because owners can always read their files
- Refused, because the file has no execute bit
=> Ana is the owner, so only the owner bits count, and they're `---`. It looks odd, but it's how the check works. Ana could `chmod` it, though, since owners control the mode.

@drill perm-who

## Numbers for permissions

Each right has a value: **r = 4, w = 2, x = 1**. Add them up for each class.

| Rights | Sum | Number |
|---|---|---|
| `rwx` | 4+2+1 | 7 |
| `rw-` | 4+2 | 6 |
| `r-x` | 4+1 | 5 |
| `r--` | 4 | 4 |
| `---` | 0 | 0 |

So `rwxr-x---` is **750**: owner 7, group 5, others 0.

@perm rwxr-x---
 A few numbers appear everywhere: **644** for ordinary files, **755** for programs and directories, **600** for secrets, **700** for private directories.

```
chmod 640 report.txt      set exactly rw-r-----
chmod u+x script.sh       add execute for the user (owner)
chmod g-w shared.txt      remove write from the group
chmod o= secret.txt       others get nothing
```

Only a file's owner or root can change its permissions. To change the owner, you need root: `sudo chown sam file`.

@drill rwx-octal

@drill octal-rwx

?? What's the permission string for mode 640?
+ `rw-r-----`
- `rwxr-----`
- `rw-rw----`
- `r--r-----`
=> 6 is `rw-` for the owner, 4 is `r--` for the group, and 0 is `---` for others.

## Least privilege

Everything above serves one principle: **give each person and program exactly the access they need, and nothing more.** NIST defines [least privilege](https://csrc.nist.gov/glossary/term/least_privilege) along those lines. Every permission you remove is one a mistake or an attacker can't use.

@term least privilege = Giving each user and program only the access it needs to do its job.

@range perms

?? Which mode is right for a private SSH key?
+ 600, because only owners may read it
- 644, because SSH needs to read it
- 755, because all keys must be executable
- 777, because any program may need it
=> SSH refuses to use a key that others can read. Anyone who can read a private key can impersonate you.

?! You run `cat report.txt` and get `Permission denied`. List, step by step, how you'd work out why.

## What you can do now

You can read any `ls -l` line, reason as the kernel does, and fix permissions. Next come the special bits that attackers hunt for first.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [credentials(7): user and group IDs, explained by the manual](https://man7.org/linux/man-pages/man7/credentials.7.html)
- [ArchWiki: File permissions and attributes](https://wiki.archlinux.org/title/File_permissions_and_attributes)
