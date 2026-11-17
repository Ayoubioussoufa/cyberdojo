---
title: ps
summary: Lists running processes with their owner, parent, start time and command line.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/ps.1.html
aka: pstree, htop
alt: lsof, osquery
---
## What it's for
`ps` takes a snapshot of the processes running on a Linux or macOS machine: who owns each one, which process started it, when, and with what command line. On Windows, `tasklist` and PowerShell's `Get-Process` play the same part. It's the first look at a host you suspect.

## How it works
On Linux, `ps` reads `/proc`, where the kernel exposes one folder per process ID. `ps aux` (BSD style) and `ps -ef` (System V style) both list everything, and `-o` chooses the columns. The parent process ID (PPID) is the most telling column in an investigation, because it shows who started what: a shell whose parent is a web server isn't normal. `pstree` draws that chain as a tree, and `htop` shows it live. The [Linux processes and /proc](/modules/02-01-linux-processes-and-proc/) module explains what lies underneath.

## Try it
```
ps aux --sort=-%cpu | head
ps -eo pid,ppid,user,lstart,cmd --forest
pstree -p
ps -fp $$
ls -l /proc/$$/exe
```

`$$` is your own shell's process ID. Find your shell, then follow its parents up to PID 1.

## What defenders see
Look for processes running from odd places such as `/tmp` or `/dev/shm`, names dressed up as kernel threads but with a real command line, a shell whose parent is a web or database server, and programs whose file was deleted while running (`/proc/<pid>/exe` then ends in "(deleted)"). A rootkit can hide processes from `ps`, so compare its list with a direct look in `/proc` or with [osquery](/tools/osquery/).

?! `ps` shows a process called `[kworker/0:2]` owned by `www-data`, with a long command line. Why is that suspicious?
