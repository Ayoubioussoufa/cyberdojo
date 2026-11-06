---
title: How operating systems really work
summary: User mode and kernel mode, processes and threads, virtual memory, handles and DLLs: the ideas behind every Windows attack.
month: 5
minutes: 25
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

- **User mode:** where your programs run. They can't touch hardware or other programs' memory.
- **Kernel mode:** where the kernel runs, with full access.

A program crosses over only through a **system call**: a controlled gate where the kernel checks the request. [OSTEP](https://pages.cs.wisc.edu/~remzi/OSTEP/) explains this as limited direct execution: programs run fast on the real CPU, but within limits.

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

?? What actually runs on the CPU?
+ A thread, inside a process
- A file, inside a folder
- A handle, inside a key
- A user, inside a group
=> A process is the container, and threads do the work.

## Virtual memory

Each process believes it has the whole memory to itself. The addresses it sees are **virtual**, and the CPU and kernel translate them to real RAM behind the scenes.

Here's the security payoff: address `0x1000` in your browser and `0x1000` in your email client are different physical locations. One process can't even name the other's memory. That's what makes processes isolated.

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

?? A signed Microsoft program loads a malicious DLL from its own folder. Why do attackers like this?
+ Attacker code runs inside a fully trusted process
- It deletes the original program's digital signature file
- It lets that program run in kernel mode
- It stops that program from reaching the network
=> The process looks legitimate to anyone glancing at it. Defenders watch for trusted programs loading DLLs from unusual locations.

@term LOLBin (living off the land) = A legitimate system tool that attackers abuse to avoid dropping their own malware.

?! Explain virtual memory to a friend. Then say how process injection gets around it.
