---
title: Linux processes and /proc
summary: How a process really starts, what fork and exec do, why everything is a file descriptor, and how /proc and strace let you see a running program from the outside.
level: foundation
side: both
minutes: 50
attack: T1057, T1055.009, T1003.007
needs: 0009-processes-and-signals, 0030-how-operating-systems-work
pair: 08-07-linux-forensics
source: The Linux man-pages project, proc(5) | https://man7.org/linux/man-pages/man5/proc.5.html
words: fork, execve, file descriptor
---
Most incident response on Linux comes down to one question: what is this process, where did it come from, and what is it touching? The kernel will tell you, if you know where to look. This module covers the small set of mechanisms underneath every program.

@term fork = A system call that creates a new process as a near-copy of the caller.
@term execve = A system call that replaces a process's program with a new one, keeping the same process ID.
@term inode = The filesystem record that holds a file's metadata and points to its data. A file's name lives separately, in a directory.

## Concept

### Fundamentals: every process has a parent

A shell starts a command in two steps. **`fork`** duplicates the shell. In the child, **`execve`** replaces that copy with the new program. The split seems odd until you see what it allows: between the two calls, the child can change its own file descriptors. That gap is how redirection and pipes work.

@flow Shell > fork makes a child > Child sets up redirection > execve runs the program > Parent waits

So every process has a parent, all the way back to PID 1. That chain of parents is one of your best detection signals: `nginx` starting `sh`, which starts `curl`, tells a story on its own.

### File descriptors and inodes

A process holds a table of small integers, the **file descriptors**. By default, 0 is standard input, 1 standard output and 2 standard error. A descriptor can point to a file, a pipe, a socket or a device.

A filename isn't the file. A directory maps a name to an **inode**, which holds the permissions, owner, timestamps and block pointers. Two consequences matter a lot:

- **Deleting isn't erasing.** `rm` removes a name. If a process still has the file open, the data lives on until it closes. Attackers delete their binary after starting it, and you can still recover it.
- **Hard links** are two names for one inode.

### /proc: the kernel's own report

`/proc` is a virtual filesystem, and reading a file in there asks the kernel a question.

| Path | Tells you |
|---|---|
| `/proc/<pid>/exe` | Link to the executable, even if deleted |
| `/proc/<pid>/cmdline` | The arguments, which a process can overwrite |
| `/proc/<pid>/environ` | Its environment variables |
| `/proc/<pid>/fd/` | Every open file and socket |
| `/proc/<pid>/maps` | Its memory regions and loaded libraries |
| `/proc/<pid>/status` | User IDs, capabilities, parent PID |
| `/proc/<pid>/cwd` | Its current directory |

### Advanced: trust what's hard to fake

Some of those fields are controlled by the process. `argv[0]` and even `/proc/<pid>/cmdline` can be rewritten, so a process can call itself `[kworker/0:1]` in `ps`. `/proc/<pid>/exe` is harder to lie about, because the kernel maintains it. If it reads `/tmp/.x (deleted)`, that's a strong finding, and you can even copy the binary back out through that link.

Memory is readable as well. With the right privileges, `/proc/<pid>/mem` and the `ptrace` system call let one process read and write another. Debuggers depend on this, and so do attackers who [inject code](https://attack.mitre.org/techniques/T1055/009/) or dump secrets. Kernel setting `kernel.yama.ptrace_scope` limits who can do it.

To see what a program does rather than what it says, trace it. `strace` intercepts system calls through `ptrace`, so you see each file opened and socket connected.

```
strace -f -e trace=execve,openat,connect ./program
```

?? A process shows `[kworker/0:1]` in `ps`, but `/proc/<pid>/exe` points to `/tmp/.x (deleted)`. What does that mean?
+ A userland binary is pretending to be a kernel thread
- The kernel moved one worker thread into its temporary storage
- The filesystem is damaged and should be repaired with fsck
- The process finished and left a harmless record behind it
=> Real kernel threads have no executable. The name came from the process, but the link came from the kernel, so believe the link.

## Threat model

| Technique | ATT&CK | Note |
|---|---|---|
| Listing processes | [T1057](https://attack.mitre.org/techniques/T1057/) | The first thing after a foothold |
| Injecting through `/proc/<pid>/mem` | [T1055.009](https://attack.mitre.org/techniques/T1055/009/) | Needs privileges or a matching user |
| Dumping credentials from memory | [T1003.007](https://attack.mitre.org/techniques/T1003/007/) | Reading `/proc` for secrets |
| Secrets in arguments or environment | Readable by the same user, sometimes more widely | Avoid putting secrets there |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ps auxf`, `pstree -p` | Show the process tree | Checking the parent chain |
| `lsof -p <pid>` | Lists open files and sockets | Asking what a process is touching |
| `strace`, `ltrace` | Trace system and library calls | Watching behaviour directly |
| `ss -tnp` | Connects sockets to processes | Finding what talks to where |
| `gcore`, `/proc/<pid>/maps` | Inspect process memory | Live response |
| `stat`, `debugfs` | Show inode details | Investigating timestamps and deleted files |

## Defence

- **Restrict process visibility.** Mount `/proc` with `hidepid=2`, so that users can't see each other's processes.
- **Restrict tracing.** Set `kernel.yama.ptrace_scope=1` or higher. Containers should drop `CAP_SYS_PTRACE`.
- **Keep secrets out of arguments and environments.** Pass them through files with tight permissions, or a secrets manager.
- **Log execution.** Use `auditd` on `execve`, or an eBPF-based tool like Tetragon or Falco. See [Linux persistence and audit](/modules/02-05-linux-persistence-and-audit/).
- **Detect by parentage.** Alert on web servers, database daemons or cron jobs spawning shells.
- **Hunt for deleted executables:** `ls -l /proc/*/exe 2>/dev/null | grep deleted`.

## Pitfalls

- **"`ps` shows the truth."** It shows what's in `/proc`, some of which the process wrote itself, and a rootkit can filter it.
- **"Deleted means gone."** Open file handles keep data alive, which is a gift to forensic analysts.
- **"Killing the process first is safest."** You may destroy evidence. Capture memory and `/proc` details before you act.
- **Reading `cmdline` without care.** Arguments are separated by NUL bytes, so use `tr '\0' ' '`.
- **Running `strace` on production casually.** It can slow a target by a large factor.

?? Why does `rm` not free the disk space used by a large open log file?
+ The inode survives while any one process holds it open
- The kernel keeps a separate backup of each removed file
- Log files are stored in a protected part of memory
- Only the root user is able to free disk blocks
=> `rm` removes one name. The data stays until the last name and the last open descriptor are gone.

## Exercise

::: law Lab only
Run this on your own Linux VM, tracing your own processes. Don't inspect other people's processes on a shared machine.
:::

1. Run `sleep 300 &`. Read `/proc/$!/status`, and find its parent PID. Trace the parent chain to PID 1 with `pstree -sp $!`.
2. Run `strace -f -e trace=execve,clone bash -c 'ls | wc -l'`, and find the fork and exec steps of a pipeline.
3. Write a tiny C program that calls `sleep(300)`, and compile it to `/tmp/demo`. Copying `/bin/sleep` won't work on current Ubuntu, where coreutils is one multi-call binary that goes by its own name. Run it in the background, note its hash, and delete the file. Find it through `ls -l /proc/<pid>/exe`, then recover it with `cp /proc/<pid>/exe recovered`, and compare hashes with `sha256sum`.
4. Open a file with `exec 3> /tmp/held.txt`, write to it, and `rm` it. Show that it still exists with `ls -l /proc/$$/fd/3`, and `exec 3>&-` to close it.
5. Remount `/proc` with `hidepid=2` on your VM, and check what a normal user can now see.

?! Write the triage steps you'd follow for a suspicious PID on a live Linux server, in order. Say which fields you'd trust and which you wouldn't, and why.

## Further reading

- [proc(5)](https://man7.org/linux/man-pages/man5/proc.5.html), the definitive list of what `/proc` exposes.
- [fork(2)](https://man7.org/linux/man-pages/man2/fork.2.html) and [execve(2)](https://man7.org/linux/man-pages/man2/execve.2.html).
- [Yama's ptrace_scope](https://www.kernel.org/doc/html/latest/admin-guide/LSM/Yama.html), in the kernel documentation.
- Michael Kerrisk, *The Linux Programming Interface*, the deepest reference on all of this.
- [Operating Systems: Three Easy Pieces](https://pages.cs.wisc.edu/~remzi/OSTEP/), a free textbook on processes and memory.
