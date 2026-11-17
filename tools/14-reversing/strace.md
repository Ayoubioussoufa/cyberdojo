---
title: strace
summary: Shows every system call a Linux program makes, and what the kernel answered.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/strace.1.html
aka: ltrace
alt: gdb, procmon
---
## What it's for
A program can only touch files, the network or other processes by asking the kernel, through system calls. `strace` prints those calls as they happen, with their arguments and results, so you see what a program really does without its source code. `ltrace` does the same for calls into shared libraries.

## How it works
It uses the kernel's `ptrace` interface to stop the program at each system call, read the arguments and the return value, then let it go on. Each line reads like a function call: `openat(AT_FDCWD, "/etc/passwd", O_RDONLY) = 3` means the file opened as descriptor 3, while `= -1 ENOENT` means it doesn't exist. `-f` follows child processes, `-e` filters by call or class, and `-p` attaches to a running process. It slows the program down a lot, so it's for debugging and analysis, not production.

## Try it
```
strace -e trace=openat cat /etc/hostname
strace -f -e trace=%file,%network -o trace.txt curl -s https://example.com
strace -c ls /
sudo strace -p 1234
```

`-c` counts calls and their time instead of printing each one. Run the second line and find, in `trace.txt`, the file curl reads to get its trusted certificates.

## What defenders see
In a lab, `strace` is quick dynamic analysis of a suspicious Linux program: which files it reads, where it connects, what it runs. Do it only in an isolated VM. On a live host, an intruder can use `ptrace` to read another process's memory, which is why many distributions restrict it with the `kernel.yama.ptrace_scope` setting. The [dynamic analysis](/modules/05-08-dynamic-analysis-and-debugging/) module explains both sides.

?! A service fails at start-up with no useful log. How would `strace` show you which file or permission it's tripping over?
