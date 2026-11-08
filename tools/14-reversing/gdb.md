---
title: gdb
summary: The GNU debugger: runs a program under your control to see what it does.
side: both
use: own
docs: https://sourceware.org/gdb/current/onlinedocs/gdb/
kali: gdb
alt: pwndbg, radare2, strace
---
## What it's for
gdb is the standard debugger on Linux. It runs a program under your control, so you can pause it, step through it, and read its memory and registers as it runs. It's essential for understanding a crash and for dynamic analysis.

## How it works
It uses the kernel's `ptrace` facility to control another process. A breakpoint pauses execution at a chosen point by replacing an instruction with a trap, so the kernel stops the process and hands control to gdb. You can then read variables, walk the call stack, and step one line or one instruction at a time. [Dynamic analysis and debugging](/modules/05-08-dynamic-analysis-and-debugging/) covers the workflow, and plug-ins like [pwndbg](/tools/pwndbg/) make the view richer.

## Try it
::: law Lab only
Debug your own programs or public practice binaries, and malware only in an isolated VM.
:::

```
gdb ./program
break main
run
info registers
bt
```

Compile a small program with `-g`, set a breakpoint at `main`, run it, and read the registers and backtrace.

## What defenders see
For a defender, gdb is how you turn a crash into understanding: what faulted, which address, and what the stack held, which is the basis of [triage](/modules/05-05-exploitation-concepts/). On a production host, note that `ptrace` is powerful, so restrict it with `kernel.yama.ptrace_scope` and treat a debugger attaching to a live service as an alert.

?! Why is a debugger attaching to a running production service worth an alert?
