---
title: radare2
summary: A scriptable command-line reverse-engineering framework.
side: both
use: own
docs: https://book.rizin.re/
kali: radare2
aka: r2, rizin, cutter
alt: ghidra, gdb
---
## What it's for
radare2 is a powerful, scriptable framework for reverse engineering from the command line. It has a steep learning curve and a devoted following. Rizin is a friendly fork, and Cutter gives it a graphical interface.

## How it works
It does everything in one environment: disassemble, debug, patch and analyse. Its commands are terse, built from single letters, which is daunting at first but fast once learned, and scriptable for repeated work. `aaa` analyses a file, and `pdf` prints a function's disassembly. That scriptability is why people automate analysis with it.

## Try it
::: law Lab only
Analyse your own or public practice binaries; malware only in a VM.
:::

```
r2 -A ./program
pdf @ main
```

Open a small binary, analyse it, and print the `main` function. Then try the Cutter interface on the same file to see the two styles.

## What defenders see
It covers the same defensive ground as [Ghidra](/tools/ghidra/): understanding a sample and extracting indicators. The command line suits automation, such as pulling the same information from many samples. Keep analysis in an isolated environment.

?! When would a scriptable command-line tool suit reverse engineering better than a graphical one?
