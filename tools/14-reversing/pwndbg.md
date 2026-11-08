---
title: pwndbg
summary: A gdb plug-in for exploitation research and binary analysis.
side: both
use: own
docs: https://github.com/pwndbg/pwndbg
aka: gef, peda
alt: gdb, radare2
---
## What it's for
Plain [gdb](/tools/gdb/) is powerful but spartan for security work. pwndbg, like the similar GEF and PEDA, adds a view built for analysing binaries: registers, stack and nearby code shown after every step.

## How it works
It's a set of Python extensions to gdb. On each stop it displays the processor state, the top of the stack, and the instructions around the current one, so you see the effect of every step at a glance. It adds commands for examining memory layout and heap structures. It's the standard environment for learning binary security on legal practice platforms.

## Try it
::: law Lab only
Debug your own programs or public practice binaries in a VM.
:::

Install pwndbg, compile a small program with `-g`, and step through it, watching how the stack and registers change. [pwn.college](https://pwn.college/) offers structured, legal exercises that use this environment.

## What defenders see
For a defender, this is how you understand a crash or confirm a bug's impact during [exploitability assessment](/modules/05-05-exploitation-concepts/), without writing a weapon. The same enriched view that aids research aids understanding. Keep this work in an isolated lab.

?! How does seeing the stack and registers after each instruction help you understand a crash?
