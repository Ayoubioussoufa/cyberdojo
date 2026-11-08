---
title: Reading x86-64 assembly
summary: The language your CPU actually runs. Registers, the stack, calling conventions and how C turns into instructions, taught for reading, because defenders need to read far more than write.
level: foundation
side: defence
minutes: 50
attack: none
needs: 0030-how-operating-systems-work
pair: 05-02-executables-and-linking
source: Intel 64 and IA-32 Architectures Software Developer Manuals | https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html
words: register, stack frame, calling convention
---
Every program, whatever language it's written in, ends up as machine instructions. To analyse malware, review a crash, or understand a memory bug, you have to read them. The good news is that reading assembly is far easier than writing it: a few dozen instructions cover most of what you'll see.

@term register = A tiny, very fast storage location inside the CPU.
@term stack frame = The block of stack memory used by one function call.
@term calling convention = The agreed rules for how functions pass arguments and return values.

## Concept

### Fundamentals: registers

x86-64 has 16 general-purpose 64-bit registers, plus an instruction pointer.

| Register | Common role |
|---|---|
| `rip` | Address of the next instruction |
| `rsp` | Top of the stack |
| `rbp` | Often the base of the current frame |
| `rax` | Return value |
| `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9` | First six integer arguments on Linux |
| `rbx`, `r12` to `r15` | Preserved across calls |

Smaller names reach parts of a register: `eax` is the low 32 bits of `rax`, and `al` is the low 8.

### A handful of instructions

| Instruction | Meaning |
|---|---|
| `mov a, b` | Copy b into a (Intel syntax) |
| `lea a, [b]` | Load the address, not the contents |
| `add`, `sub`, `xor` | Arithmetic and logic |
| `cmp`, `test` | Compare, setting flags |
| `je`, `jne`, `jg` | Jump on a condition |
| `jmp` | Jump always |
| `call`, `ret` | Enter and leave a function |
| `push`, `pop` | Use the stack |

`xor eax, eax` is a common way to set a register to zero. Square brackets mean "the memory at this address". Two syntaxes exist: Intel (`mov rax, rbx`) and AT&T (`mov %rbx, %rax`), and `objdump -M intel` chooses the first.

### The stack and calls

The stack grows **downward**, toward lower addresses. `call` pushes the return address, and `ret` pops it into `rip`. Keep that in mind, as this is the fact behind [stack memory bugs](/modules/05-03-stack-memory-corruption/).

A typical function starts with a prologue, and ends by undoing it. Here's real output from `gcc` on a small function in this module's exercise:

```
push   rbp
mov    rbp,rsp
sub    rsp,0x30
mov    QWORD PTR [rbp-0x28],rdi
mov    rax,QWORD PTR fs:0x28
mov    QWORD PTR [rbp-0x8],rax
```

Read it line by line: save the caller's frame pointer, set up a new frame, reserve 48 bytes, and store the first argument on the stack. The last two lines copy a random value from `fs:0x28` next to the saved data, which is a [stack canary](/modules/05-06-exploit-mitigations/).

### Calling conventions

| Platform | First integer arguments |
|---|---|
| Linux, macOS (System V) | `rdi`, `rsi`, `rdx`, `rcx`, `r8`, `r9` |
| Windows x64 | `rcx`, `rdx`, `r8`, `r9` |

Knowing this lets you read a call in a disassembly: whatever was just moved into `rdi` is the first argument.

### Advanced: patterns you'll recognise

Compilers produce recognisable shapes.

| Source | Looks like |
|---|---|
| `if` | `cmp` followed by a conditional jump |
| `for` loop | A backward jump, with a counter |
| `switch` | A jump table |
| Struct access | `[reg+offset]` |
| Virtual call | Load a table pointer, then an indirect `call` |

Optimised code is harder: inlining, reordered instructions and removed frame pointers all blur the source. ARM64 now matters as well, on phones and Apple Silicon, with fixed-size instructions and many registers. The concepts carry over.

?? Which register holds the address of the next instruction?
+ `rip`
- `rsp`
- `rax`
- `rbp`
=> `rip` is the instruction pointer. `rsp` is the stack pointer, and `rax` usually holds return values.

## Threat model

Assembly isn't an attack in itself. It's the level at which malware and memory bugs are understood, when you've got no source code. Malware authors add obfuscation here, and analysts must see through it. [Static](/modules/05-07-static-reverse-engineering/) and [dynamic](/modules/05-08-dynamic-analysis-and-debugging/) analysis both rely on this skill.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [Compiler Explorer](https://godbolt.org/) | Shows C and assembly side by side | Learning |
| `objdump -d -M intel` | Disassembles binaries | Quick looks |
| `gcc -S` | Outputs assembly | Studying the compiler |
| Ghidra | Disassembler and decompiler | Larger programs |
| gdb | Steps through instructions | Watching registers |

## Defence

Reading assembly supports defensive work: triaging malware, confirming whether a binary contains a flaw, verifying a patch, and understanding a crash dump. It also helps you write better [YARA rules](/modules/06-04-malware-analysis-in-depth/), using code patterns that are hard for attackers to change. Compiler flags that add protections show up here too, so you can verify that a build really has them.

## Pitfalls

- **Trying to read every line.** Look for calls, strings and branches first.
- **Mixing up syntaxes.** Check which operand is the destination.
- **Forgetting that the stack grows down.**
- **Confusing `lea` with `mov`.** One takes an address, and the other reads memory.
- **Judging all code by `-O0` output.** Real software is optimised.

?? On Linux x86-64, where does a function's first integer argument go?
+ `rdi`
- `rax`
- `rsp`
- `r15`
=> System V uses `rdi`, `rsi`, `rdx`, `rcx`, `r8` and `r9`. Windows starts with `rcx`.

## Exercise

::: law Lab only
Use programs you wrote yourself, or training binaries. Licences may restrict reverse engineering commercial software.
:::

1. Open [Compiler Explorer](https://godbolt.org/). Write a function that adds two integers, and read the output at `-O0`, then `-O2`.
2. Add an `if` and a `for` loop. Find the compare and the jumps.
3. Compile a small program with `gcc -O0 -g`, and run `objdump -d -M intel`. Find `main`.
4. Identify a `call`, and work out its arguments.
5. Do the first levels of [pwn.college's assembly module](https://pwn.college/), or [Microcorruption](https://microcorruption.com/) for a gentle start.

?! Explain what happens to `rsp`, `rip` and the stack when a function is called and when it returns.

## Further reading

- [Intel Software Developer Manuals](https://www.intel.com/content/www/us/en/developer/articles/technical/intel-sdm.html), the reference.
- [Compiler Explorer](https://godbolt.org/).
- [System V ABI](https://gitlab.com/x86-psABIs/x86-64-ABI).
- Dennis Yurichev, [Reverse Engineering for Beginners](https://beginners.re/), free.
- [x64 calling convention on Windows](https://learn.microsoft.com/en-us/cpp/build/x64-calling-convention).
