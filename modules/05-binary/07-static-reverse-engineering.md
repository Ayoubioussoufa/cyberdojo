---
title: Static reverse engineering
summary: Understanding a program without running it. A triage workflow, Ghidra and its peers, why decompiled code misleads, and how to deal with obfuscation.
level: intermediate
side: defence
minutes: 45
attack: T1027
needs: 05-01-x86-64-assembly, 05-02-executables-and-linking
pair: 06-04-malware-analysis-in-depth, 05-08-dynamic-analysis-and-debugging
source: Ghidra project | https://ghidra-sre.org/
words: disassembler, decompiler, cross-reference
---
Sometimes all you have is a binary: a malware sample, a vendor's closed library, or firmware. Static analysis reads it without running it, which keeps you safe, and shows paths that might never execute. It's slower than dynamic analysis, yet it's the only way to see all of what's in a file.

@term disassembler = A tool that turns machine code back into assembly.
@term decompiler = A tool that reconstructs C-like code from machine code.
@term cross-reference = A link showing where a function or piece of data is used.

## Concept

### Fundamentals: a workflow

Don't start at `main`. Start with cheap questions, and narrow down.

@flow Identify the file > Strings and imports > Find interesting functions > Follow cross-references > Rename and annotate > Summarise

| Step | Tool | Looking for |
|---|---|---|
| Identify | `file`, Detect It Easy | Format, compiler, packer |
| Strings | `strings`, FLOSS | URLs, paths, error messages |
| Imports | `readelf`, PEStudio | Network, crypto, process APIs |
| Overview | Ghidra | Functions, call graph |
| Focus | Cross-references | Who uses that string or API? |

The trick is to work **backward from something interesting**. If a binary contains the string `password incorrect`, find what references it, and you've found the login check. If it imports `connect`, look at what calls it.

### Ghidra and friends

| Tool | Strength | Cost |
|---|---|---|
| [Ghidra](https://ghidra-sre.org/) | Free, NSA-released, with a decompiler and scripting | Free |
| IDA Pro | Industry standard, excellent analysis | Expensive, free version exists |
| Binary Ninja | Modern API | Moderately priced |
| radare2, Cutter | Open-source, scriptable | Free |

In Ghidra, the left panel lists functions, the middle shows assembly, and the right shows decompiled C. The main work is **annotation**: rename `FUN_00401230` to `decrypt_config`, set types, and the code gradually becomes readable. This is like solving a crossword, with each answer helping the next.

### Decompilers lie

A decompiler guesses. Names, types and structure were lost during compilation, so what you see is a reconstruction.

| Lost in compilation | Result |
|---|---|
| Variable names | `local_28`, `param_1` |
| Types | Pointers shown as integers |
| Structs | Offsets, such as `*(p + 0x18)` |
| Macros, inlining | Unfamiliar expanded code |
| Control flow | Odd `goto`s |

So when something matters, check the assembly. Decompiled output can also be wrong in optimised code, or when a calling convention is misdetected.

### Advanced: obfuscation and scale

Malware and protected software resist analysis. [Packing](/modules/06-04-malware-analysis-in-depth/) hides code until it runs. **Control-flow flattening** breaks up a function into a dispatcher. **String encryption** hides clues. **API hashing** resolves imports at runtime. **Virtualisation** turns code into custom bytecode. Each raises the cost, and none makes analysis impossible. Combine static work with [dynamic analysis](/modules/05-08-dynamic-analysis-and-debugging/), letting the program unpack itself.

**Scale.** BinDiff and Diaphora compare versions, which shows what a security patch changed. FLIRT and Function ID recognise library code, so that you skip it. Scripts automate renaming and decoding. AI assistants now help to summarise functions, yet you must check their work, as they'll state wrong things confidently.

**Law.** Reverse engineering for interoperability or security research has legal protection in some places, and EULAs often forbid it. Check before you publish anything.

?? Why shouldn't you fully trust decompiler output?
+ It's a reconstruction, and names were lost
- It always contains malware from the vendor
- It can't show any of the strings
- It only works on encrypted binaries today
=> Compilation removes information, so decompilers guess. Check the assembly for anything that matters.

## Threat model

Attackers reverse patches to find flaws, and software to find secrets. Defenders reverse malware, and check vendor software. If your own product hides a key in a binary, then assume that someone will find it. Obfuscation ([T1027](https://attack.mitre.org/techniques/T1027/)) slows them, but no more.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Ghidra | Disassemble, decompile | Default free choice |
| `strings`, FLOSS | Find text | First look |
| capa | Identifies capabilities | Fast triage |
| BinDiff | Compares binaries | Patch analysis |
| Detect It Easy | Identifies packers | Before starting |
| YARA | Finds code patterns | Turning findings into rules |

## Defence

- **Don't hide secrets in binaries.**
- **Strip symbols** from releases.
- **Use reversing to verify** what vendors ship, under your contract's terms.
- **Write YARA rules** from code patterns.
- **Work in a VM** when handling suspicious files, even for static work.
- **Record your notes,** as a future you will need them.

## Pitfalls

- **Reading linearly from the entry point.** You'll drown in runtime setup code.
- **Skipping annotation.** Unnamed code stays unreadable.
- **Trusting strings.** They can be decoys.
- **Reversing library code.** Identify it, and skip it.
- **Publishing proprietary findings** with no legal advice.

?? What's the best first step on an unknown binary?
+ Check its type, strings and imports
- Run it as root and watch
- Upload its sensitive data to forums
- Patch its entry point with NOPs
=> Cheap static checks tell you a lot, safely, before you invest time or run anything.

## Exercise

::: law Lab only
Use programs you compiled, or crackmes made for practice, such as those on crackmes.one, or Practical Malware Analysis's labs. Reverse engineering commercial software may break its licence.
:::

1. Write a small C program with a hardcoded password check. Compile with `-O0`, and strip it with `strip`.
2. Run `strings`, and try to find the password.
3. Import it into Ghidra. Find `main` through `entry`, and rename variables.
4. Compile with `-O2`, and compare the decompiled output. What's harder?
5. Solve an easy crackme from [crackmes.one](https://crackmes.one/).
6. Use capa on your program. Does it notice anything?

?! A vendor claims that its appliance stores your API key "securely in the firmware". How would you check that, and what would you do with what you find?

## Further reading

- [Ghidra documentation](https://ghidra-sre.org/).
- Eagle and Nance, *The Ghidra Book*.
- Dennis Yurichev, [Reverse Engineering for Beginners](https://beginners.re/).
- [Ghidra's cheat sheet](https://ghidra-sre.org/CheatSheet.html).
- [crackmes.one](https://crackmes.one/).
