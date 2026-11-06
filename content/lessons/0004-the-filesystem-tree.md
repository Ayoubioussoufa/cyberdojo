---
title: Moving around the filesystem
summary: How Linux organises everything into one tree, and how to walk it with pwd, ls and cd.
month: 1
minutes: 25
builds: navigate any Linux machine, and find hidden files
source: The Linux Command Line, chapters 1–3 | https://linuxcommand.org/tlcl.php
words: absolute path, relative path, home directory
---
Windows has `C:\`, `D:\` and folders. Linux has **one tree**, and everything hangs from a single point called the root. Once you can picture that tree and move around it, every machine you'll ever land on feels familiar.

@term root directory (/) = The top of the Linux filesystem tree. Every file lives somewhere below it.
@term path = The address of a file or directory in the tree.
@term absolute path = A path starting from the root, like /home/ana/notes.txt. It works from anywhere.
@term relative path = A path starting from where you are now, like notes.txt or ../logs.
@term working directory = The directory your shell is currently in.
@term home directory = Your personal directory, usually /home/yourname, written ~ for short.
@term hidden file (dotfile) = A file whose name starts with a dot, left out of a plain ls.
@term option (flag) = An extra setting for a command, usually starting with a dash, like -l.
@term argument = Something you give a command to work on, such as a file name.

## One tree

```
/                  the root: everything starts here
├── etc/           system configuration files
├── home/          one folder per user
│   └── ana/       your home directory, also written ~
├── var/
│   └── log/       logs: the first place defenders look
├── tmp/           temporary files, writable by everyone
├── usr/bin/       the programs you run
└── root/          the administrator's home folder
```

You don't need to memorise this. But you'll visit `/etc`, `/var/log`, `/home` and `/tmp` constantly. The [Filesystem Hierarchy Standard](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html) defines what each is for.

::: why
`/tmp` can be written by every user, so attackers often drop their tools there. `/var/log` is where the evidence is, so attackers often try to clear it. Knowing the map tells you where to look.
:::

?? On a compromised Linux server, where would you look first for evidence?
+ In `/var/log`, where the system's logs live
- In `/usr/bin`, where the programs are kept
- In `/home`, which holds only personal photos
- In `/etc`, which only holds empty folders
=> Logs record what happened, which is why attackers often try to clear them.

## Where am I, and what's here?

Your shell always stands in one directory, the **working directory**. Three commands do most of the work:

| Command | Meaning | Example |
|---|---|---|
| `pwd` | Print working directory: where am I? | `pwd` → `/home/ana` |
| `ls` | List what's here | `ls /var/log` |
| `cd` | Change directory: go there | `cd /var/log` |

Commands take **options** that change how they behave, and **arguments** saying what to work on:

```
ls -la /var/log
│   │   └── argument: which directory
│   └────── options: -l long format, -a show all
└────────── the command
```

?? In `ls -la /var/log`, what's the argument?
+ `/var/log`, the folder listed
- `ls`, the program itself
- `-la`, two output options
- `-l`, one output option
=> `ls` is the command, and `-la` holds two options. The argument says what to work on.

## Two ways to give an address

A **path** is an address. Think of directions in a city:

- **Absolute path:** the full postal address. It starts with `/` and works from anywhere: `/home/ana/notes.txt`.
- **Relative path:** "two doors down from here". It depends on where you stand: `notes.txt`, or `projects/report.txt`.

Three shortcuts make relative paths powerful:

| Symbol | Means |
|---|---|
| `.` | This directory |
| `..` | The directory above (the parent) |
| `~` | Your home directory |

So from `/home/ana/projects`, `cd ..` takes you to `/home/ana`, and `cd ../../sam` takes you to `/home/sam`. Plain `cd` with nothing after it always takes you home.

?? You're in `/var/log`. What does `cd ../tmp` do?
+ It moves you into the directory /var/tmp
- It moves you into the directory /tmp
- It moves you into /var/log/tmp below you
- It fails, because .. only works alone
=> `..` goes up one level to `/var`, then `tmp` goes down into `/var/tmp`. For `/tmp` you'd need the absolute path, or `cd ../../tmp`.

@drill paths

## Hidden files

Any name starting with a dot is hidden from plain `ls`. That's a convention, not a security feature: `ls -a` shows everything. Configuration files use it to keep your home folder tidy, such as `.bashrc` and `.ssh/`. Attackers use it for the same reason: a folder called `.x` in `/tmp` is easy to miss.

::: tip Two habits that make you fast
Press **Tab** to complete names: you'll type less and make fewer typos. Press **↑** to bring back earlier commands. Professionals do both constantly.
:::

?? Does putting a dot at the start of a file's name protect it?
+ No, it only hides it from plain `ls`
- Yes, only root can open such files then
- Yes, because the kernel encrypts all those files
- No, because dots aren't allowed in Linux names
=> It's a display convention, not a security feature. Anyone can read it, if its permissions allow.

## Names with spaces

The shell splits what you type on spaces, so `cat my file.txt` means two files, `my` and `file.txt`. Put the name in quotes to keep it together: `cat "my file.txt"`. Remember this one: quoting matters far beyond file names.

@range navigate

?? Why does `ls` not show `.secret`, while `ls -a` does?
+ Names starting with a dot are skipped by default
- The file's permissions block it from all plain listings
- The kernel hides all such files from normal users
- Hidden files are stored in a separate disk area
=> It's just a display rule in `ls`. There's no protection at all, which is why you always use `ls -a` when investigating.

?! Without looking, explain the difference between an absolute path and a relative path. Give an example of a situation where only the absolute one is safe to use.

## What you can do now

You can walk any Linux machine. Next: finding one line in a million.
