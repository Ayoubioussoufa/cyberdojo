---
title: How operating systems really work
summary: User mode and kernel mode, processes and threads, virtual memory, handles and DLLs: the ideas behind every Windows attack.
month: 5
minutes: 45
builds: explain why one process can't normally read another's memory
source: Operating Systems Three Easy Pieces (OSTEP), free textbook | https://pages.cs.wisc.edu/~remzi/OSTEP/
words: user mode, kernel mode, virtual memory
---
Most enterprise endpoints run Windows, so this month is about understanding it the way defenders and attackers do. First, the ideas that apply to every operating system. You've met some already. Now we go one level deeper.

@term user mode = The restricted CPU mode that normal programs run in.
@term kernel mode = The privileged CPU mode that the kernel runs in, with full hardware access.
@term system call (syscall) = A program's request to the kernel to do something on its behalf.
@term thread = A sequence of execution inside a process. A process can have many.
@term virtual memory = The illusion that gives each process its own private address space.
@term handle = A process's reference to an object the kernel manages, such as an open file.
@term DLL (dynamic-link library) = A Windows file of shared code that programs load while running.
@term process injection = Running attacker code inside another process's memory.

## Two modes

The CPU itself enforces the wall from lesson 3. It has at least two modes:

@stack
User mode | your programs | can't touch hardware
System call | the controlled gate | the kernel checks each request
Kernel mode | the kernel and drivers | full access
Hardware | CPU, memory and disks |

- **User mode:** where your programs run. They can't touch hardware or other programs' memory.
- **Kernel mode:** where the kernel runs, with full access.

A program crosses over only through a **system call**: a controlled gate where the kernel checks the request. [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) explains this as limited direct execution: programs run fast on the real CPU, but within limits.

You don't have to take this on trust. On your Linux VM, `strace` prints every system call a program makes. Install it with `sudo apt install strace`, then watch the humble `ls` at work:

```
$ strace ls
execve("/usr/bin/ls", ["ls"], 0x7ffd3c1e8a40 /* 23 vars */) = 0
…
openat(AT_FDCWD, ".", O_RDONLY|O_NONBLOCK|O_CLOEXEC|O_DIRECTORY) = 3
getdents64(3, 0x55d0c3a5e2f0 /* 4 entries */, 32768) = 112
write(1, "notes.txt  report.md\n", 21) = 21
exit_group(0)                           = ?
```

Each line is one trip through the gate: the name of the call, what the program asked for, and after the `=` what the kernel answered. `ls` can't read a folder by itself, so it asks with `openat`, gets back the number 3, asks for the entries with `getdents64`, and asks again with `write` to put text on your screen. Listing a folder took dozens of requests, and the kernel could have refused any one of them.

Try `strace cat /etc/shadow` as a normal user and you'll see a refusal as it happens:

```
openat(AT_FDCWD, "/etc/shadow", O_RDONLY) = -1 EACCES (Permission denied)
```

The program asked, the kernel checked your identity against the file's permissions, and the answer was no. Every permission you set in Month 1 is enforced at exactly this point.

::: key
If malicious code reaches kernel mode, it can hide from everything above it. That's why a kernel driver is so dangerous, and why loading one needs high privilege.
:::

?? How does a program get something done in kernel mode?
+ Through a system call, which is checked
- By writing directly to the hardware itself
- By asking another user for their password
- By restarting the computer in safe mode
=> System calls are the controlled gate. That's where the kernel checks permissions.

## Processes and threads

A **process** is a container: its memory, its open handles, its security identity. A **thread** is what actually runs. A process has one or more. Think of the process as a kitchen and the threads as cooks sharing it.

Both systems will show you the numbers. On Linux, `ps -o pid,nlwp,cmd -p 1` prints one process with its thread count in the `NLWP` column. On Windows, open Task Manager, go to **Details**, right-click a column header, choose **Select columns** and tick **Threads** and **Handles**. A browser will show dozens of threads in each of its processes.

Why does the difference matter for security? Threads in the same process share everything: the same memory, the same open files, the same identity. There's no wall between them. Walls exist only between processes, which is why a browser gives every tab its own process: a tab that gets taken over is trapped in its own container.

?? What actually runs on the CPU?
+ A thread, inside a process
- A file, inside a folder
- A handle, inside a key
- A user, inside a group
=> A process is the container, and threads do the work.

## Virtual memory

Each process believes it has the whole memory to itself. The addresses it sees are **virtual**, and the CPU and kernel translate them to real RAM behind the scenes.

Here's the security payoff: address `0x1000` in your browser and `0x1000` in your email client are different physical locations. One process can't even name the other's memory. That's what makes processes isolated.

Linux lets you look at a process's address space. Each line of this file is one region of virtual memory, with its address range and its permissions:

```
$ cat /proc/self/maps
55e4c7a2b000-55e4c7a2d000 r--p … /usr/bin/cat
55e4c7a2d000-55e4c7a32000 r-xp … /usr/bin/cat
7f3a9c200000-7f3a9c228000 r--p … /usr/lib/x86_64-linux-gnu/libc.so.6
7ffc1b5e0000-7ffc1b601000 rw-p … [stack]
```

Read the permission letters as you read file permissions: `r` read, `w` write, `x` execute. The program's code is `r-x`, so it can run but can't be changed. The stack, where the program keeps its working data, is `rw-`, so it can be changed but can't run. Memory that is both writable and executable is rare in normal programs, which is why defenders treat it as a warning sign.

Run the command twice and the addresses change. That's deliberate: **ASLR**, address space layout randomisation, places things differently on every run, so that an attacker can't know in advance where anything is.

If a program touches an address that isn't in its map, the CPU stops it and the kernel ends the process. Linux calls that a segmentation fault, and Windows calls it an access violation. A crash like that is the wall doing its job.

?? Why can't a normal program just read the password stored in another program's memory?
+ Each process sees only its own virtual addresses
- Passwords are always encrypted inside RAM by default
- The disk blocks all reads between different programs
- Programs can only run one at a time
=> Virtual memory gives every process a separate address space. Access across processes must go through the kernel, which checks permissions.

## But attackers do exactly that

Operating systems offer legitimate ways to reach across, used by debuggers. With enough privilege, a process can open another with a **handle**, then write into its memory and start a thread there. That's **process injection**. ATT&CK files it as [T1055](https://attack.mitre.org/techniques/T1055/). Malware does this to hide inside a trusted process, or to steal credentials from one.

Sysmon can record this: **event ID 8** logs CreateRemoteThread, and **event ID 10** logs one process accessing another. You'll use both this month.

?? Why would malware inject itself into a trusted process?
+ To hide inside something that looks normal
- To make that program run much faster
- To install a new version of Windows
- To free up more memory for users
=> Activity from a trusted process draws far less attention.

## Handles and DLLs

A **handle** is a process's ticket to an object: a file, a registry key, another process. The kernel checks permissions when the handle is opened, not on each use.

A **DLL** is a library of code that programs load at runtime. Windows has rules for where it looks for one, and if an attacker can put a malicious DLL in the right place, a trusted program will load it. That's [DLL search-order hijacking](https://attack.mitre.org/techniques/T1574/001/).

You can list what a running program has loaded. On Windows, open Notepad, then in PowerShell:

```powershell
(Get-Process notepad).Modules | Select-Object ModuleName, FileName
```

Every line is a DLL, with the folder it came from. Nearly all of them come from `C:\Windows\System32`. That's the defender's check in one glance: the name of a DLL proves nothing, because anyone can name a file `version.dll`. The path is what matters. A system DLL loaded from a Downloads or Temp folder is a finding.

?? A signed Microsoft program loads a malicious DLL from its own folder. Why do attackers like this?
+ Attacker code runs inside a fully trusted process
- It deletes the original program's digital signature file
- It lets that program run in kernel mode
- It stops that program from reaching the network
=> The process looks legitimate to anyone glancing at it. Defenders watch for trusted programs loading DLLs from unusual locations.

@term LOLBin (living off the land) = A legitimate system tool that attackers abuse to avoid dropping their own malware.

## What a defender watches

Each idea in this lesson leaves a trace that a sensor can record. This table is the reason you learned the theory: when you read Sysmon events later this month, you'll know what each one means.

| Idea | What an attacker does with it | What records it |
|---|---|---|
| Process | Starts a tool or a script | Sysmon 1, process creation, with the full command line |
| DLL | Gets a trusted program to load attacker code | Sysmon 7, image loaded, with the DLL's path |
| Thread | Starts a thread inside another process | Sysmon 8, CreateRemoteThread |
| Handle | Opens another process to read its memory | Sysmon 10, process access |
| Kernel mode | Loads a driver to hide from everything | Sysmon 6, driver loaded |

?? `strace` shows `openat("/etc/shadow", O_RDONLY) = -1 EACCES`. Who refused the request?
+ The kernel, when it checked the call
- The `cat` program, before it even asked
- The disk, when it found the file
- The shell, when it read the command
=> The program asked through a system call and the kernel said no. Permission checks happen at that gate, not inside the program.

?? Sysmon event 7 shows a signed program loading `version.dll` from a user's Downloads folder. Why is that worth a look?
+ System DLLs load from Windows folders
- Signed programs never load any DLLs
- Downloads folders can't hold DLL files
- Event 7 only fires on malware
=> The name matches a real system DLL, but the path doesn't. A trusted program loading code from a folder that any user can write to is the pattern behind search-order hijacking.

::: try See the wall yourself
1. On your Linux VM, run `strace -c ls`. The `-c` option counts the calls: note how many system calls one `ls` makes.
2. Run `strace cat /etc/shadow` as a normal user and find the line with `EACCES`.
3. Run `cat /proc/self/maps` twice and compare the first address of each run.
4. On Windows, add the Threads and Handles columns in Task Manager and find the process with the most handles.
5. List the DLLs of Notepad with the PowerShell line above, and check that every path starts with `C:\Windows`.
:::

?! Explain virtual memory to a friend. Then say how process injection gets around it.
