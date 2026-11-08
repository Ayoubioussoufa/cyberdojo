---
title: Dynamic analysis and debugging
summary: Watching a program run. gdb, strace and ltrace, what to look for in a crash, how debuggers work, and why software sometimes tries to detect that it's being watched.
level: intermediate
side: defence
minutes: 45
attack: T1622
needs: 05-01-x86-64-assembly, 02-01-linux-processes-and-proc
pair: 05-07-static-reverse-engineering
source: GDB documentation | https://sourceware.org/gdb/current/onlinedocs/gdb/
words: breakpoint, core dump, anti-debugging
---
Static analysis tells you what a program could do. Dynamic analysis shows what it does: with real values in registers, real files opened, and real decrypted strings in memory. For a defender, this is how you triage a crash, confirm a finding, or let a packed sample reveal itself safely inside a lab.

@term breakpoint = A marker that pauses a program at a chosen instruction.
@term core dump = A file holding a process's memory at the moment it crashed.
@term anti-debugging = Techniques a program uses to detect or resist being debugged.

## Concept

### Fundamentals: three levels of watching

| Level | Tool | Sees |
|---|---|---|
| System calls | `strace` | Files, sockets, processes |
| Library calls | `ltrace` | `strcmp`, `malloc`, and more |
| Instructions | gdb, x64dbg, WinDbg | Registers and memory |

Start at the top, as it's quick. `strace` often answers the question straight away.

```
strace -f -e trace=openat,connect,execve ./program
```

This says which files it opens, whom it connects to, and what it starts. `ltrace` can reveal a password compared with `strcmp`, for instance. On Windows, [Procmon](https://learn.microsoft.com/en-us/sysinternals/downloads/procmon) gives a similar view.

### gdb basics

| Command | Effect |
|---|---|
| `break main` | Pause at `main` |
| `run args` | Start |
| `next`, `step` | Next source line |
| `nexti`, `stepi` | Next instruction |
| `continue` | Run on |
| `bt` | Show the call stack |
| `info registers` | Show registers |
| `x/8gx $rsp` | Examine 8 words of stack |
| `finish` | Run until the function returns |
| `disassemble` | Show code |

Extensions such as [pwndbg](https://github.com/pwndbg/pwndbg) and GEF show registers and the stack after each step. **Compile with `-g`** when you have the source: debugging is much easier with symbols.

### Reading a crash

A crash is evidence. With `ulimit -c unlimited`, or `coredumpctl` on systemd, you get a **core dump**, which you can open later with `gdb program core`. Then ask:

1. What's the fault? `SIGSEGV`, `SIGABRT` or something else.
2. Which instruction? What address was it touching?
3. What's the call stack?
4. What do the registers and locals hold?

Earlier in this domain, a canary abort gave exit code 134 (`SIGABRT`), and a plain segfault gave 139 (`SIGSEGV`). The code is 128 plus the signal number. Knowing that lets you read a failure report at a glance.

### How debuggers work

On Linux, gdb uses the `ptrace` system call to attach to a process. A software breakpoint replaces an instruction with `int3`, a one-byte trap. When it fires, the kernel stops the process, and tells the debugger. Hardware breakpoints use CPU debug registers, and can watch memory for changes. That's the same `ptrace` that [Linux processes](/modules/02-01-linux-processes-and-proc/) mentioned, and it's why `ptrace_scope` limits it.

### Advanced: being watched

Malware may check for debuggers, and analysts need to recognise that ([T1622](https://attack.mitre.org/techniques/T1622/)). Common signs include `IsDebuggerPresent`, reading the process environment block, measuring timing, and `ptrace` self-attach on Linux. Each leaves a recognisable pattern in code, and analysts work around them in their own labs, or rely on a [sandbox](/modules/06-04-malware-analysis-in-depth/). Seeing such checks is useful in itself, as normal software rarely has them, so they're a good signal for [YARA rules](/courses/0067-safe-malware-triage/).

**Record and replay.** `rr` records a run, so that you can step *backward*, which is excellent for bugs that are hard to reproduce. **Frida** injects scripts into a running process, and it's useful for testing your own mobile apps. **Time-travel debugging** in WinDbg offers the same on Windows.

?? What does `strace` show?
+ System calls a program makes at runtime
- Source code lines from the original project
- Network packets on a different computer entirely
- Registry keys changed by other users today
=> It intercepts the program's requests to the kernel, which shows files, sockets and processes.

## Threat model

Attackers use debuggers to study software, find secrets in memory, and check their exploits. Malware detects them, to hide its real behaviour. On production systems, `ptrace` and core dumps are also a risk: they can expose secrets, so restrict them.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `strace`, `ltrace` | Trace calls | First look |
| gdb with pwndbg | Linux debugging | Instruction-level work |
| x64dbg | Windows debugger | Windows binaries |
| WinDbg | Windows and kernel debugging | Crash dumps |
| Procmon | Windows activity | Behaviour |
| `rr` | Record and replay | Hard bugs |

## Defence

- **Keep symbols privately,** so that you can read crash reports.
- **Collect crash data** from production, with care.
- **Restrict `ptrace`,** with `kernel.yama.ptrace_scope`, and drop `CAP_SYS_PTRACE`.
- **Treat core dumps as sensitive,** and limit who can read them.
- **Disable debug interfaces** in production.
- **Run suspicious code only in a VM.**

**Detection.** Alert on a debugger attaching to a production process, on `gdb` on a server, or on `ptrace` calls against sensitive daemons.

## Pitfalls

- **Debugging malware on your own host.** Use an isolated VM.
- **Timing bugs that vanish under a debugger.** Use `rr` or logging.
- **Forgetting that `strace` slows a target.**
- **Trusting one run.** Behaviour may depend on input, or on the date.
- **Leaving core dumps around,** full of passwords.

?? Why set a breakpoint?
+ To pause execution and inspect its state
- To stop the compiler from adding optimisations
- To encrypt the program's data in memory
- To speed up each loop in code
=> Pausing at a chosen point lets you read registers and memory as they really are.

## Exercise

::: law Lab only
Debug programs you wrote, or practice crackmes, in a VM. Don't attach debuggers to processes on shared or production systems.
:::

Install `gdb` and `strace` first, as neither was on the machine used to write this module.

1. Compile the `copy` program from [Stack memory safety](/modules/05-03-stack-memory-corruption/) with `-g`.
2. Run `strace ./with hello`, and find its first `openat`.
3. In gdb, `break copy`, `run hello`, then `x/8gx $rsp`. Find your string after `strcpy`.
4. Run with the long argument, and let it crash. Use `bt`, and read the frames.
5. Enable core dumps, and load one with `gdb`.
6. Solve a crackme using only `ltrace`.

?! A production service crashes once a week at random. Describe what you'd collect, how you'd protect that data, and how you'd analyse it.

## Further reading

- [GDB documentation](https://sourceware.org/gdb/current/onlinedocs/gdb/).
- [ptrace(2)](https://man7.org/linux/man-pages/man2/ptrace.2.html).
- [pwndbg](https://github.com/pwndbg/pwndbg).
- [rr](https://rr-project.org/).
- [ATT&CK T1622](https://attack.mitre.org/techniques/T1622/).
