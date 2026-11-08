---
title: Ghidra
summary: A free reverse-engineering suite with an excellent decompiler.
side: both
use: own
docs: https://ghidra-sre.org/
kali: ghidra
alt: radare2, cutter, gdb
---
## What it's for
Ghidra, released by the NSA, is a full reverse-engineering platform. Its decompiler turns machine code back into readable C-like code, which makes understanding a binary far easier. For malware analysis and for studying how software works, it's a first-class free tool.

## How it works
It loads a binary, finds the functions, disassembles the machine instructions, and then decompiles them into pseudocode. You read and rename as you go, building an understanding of what the program does. The decompiler is the star: reading approximate C is far quicker than reading raw assembly, though you still need the assembly knowledge from [x86-64 assembly](/modules/05-01-x86-64-assembly/) to check it.

## Try it
::: law Lab only
Analyse your own programs, public CTF binaries, or malware only in an isolated VM.
:::

Compile a small C program, open it in Ghidra, and compare the decompiled output with your source. Then strip the symbols, open it again, and see how much harder it is to read.

## What defenders see
This is central to [static reverse engineering](/modules/05-07-static-reverse-engineering/) and malware analysis. For a defender it's how you understand what a sample does, extract indicators, and write detection. Analyse live malware only in an isolated lab, and treat everything it tells you as a lead to verify dynamically.

?! Why does a decompiler speed up analysis, and why do you still need to understand assembly to use one well?
