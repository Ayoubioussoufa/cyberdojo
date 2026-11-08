---
title: Executables and linking
summary: What's inside an ELF or PE file, how a process is laid out in memory, and how the GOT and PLT let programs share libraries. The map behind binary security.
level: foundation
side: defence
minutes: 45
attack: none
needs: 05-01-x86-64-assembly, 02-02-linux-boot-and-linking
pair: 05-01-x86-64-assembly
source: ELF specification, Linux manual elf(5) | https://man7.org/linux/man-pages/man5/elf.5.html
words: ELF, section, GOT
---
A compiled program isn't just code. It's a structured file that tells the loader what to put where, and which libraries it needs. Learning that structure explains how programs start, and it's a fast route to understanding a binary before you've read a single instruction. Project P03 and lesson 67 met these formats. This module explains them.

@term ELF = Executable and Linkable Format, the standard binary format on Linux.
@term PE (Portable Executable) = The executable file format on Windows.
@term GOT (Global Offset Table) = A table of addresses that a program fills in at runtime for functions and data in shared libraries.
@term PLT (Procedure Linkage Table) = Small stubs that let code call shared library functions through the GOT.

## Concept

### Fundamentals: from source to process

@flow Preprocess > Compile > Assemble > Link > Load

The **linker** joins object files and records what's still needed from shared libraries. The **loader** maps the file into memory, and [`ld.so`](/modules/02-02-linux-boot-and-linking/) resolves the rest.

### Inside an ELF

An ELF has a header, program headers for the loader, and section headers for tools.

| Section | Holds | Permissions |
|---|---|---|
| `.text` | Code | Read, execute |
| `.rodata` | Constants, strings | Read |
| `.data` | Initialised globals | Read, write |
| `.bss` | Zeroed globals | Read, write |
| `.plt`, `.got` | Dynamic linking | Varies |
| `.symtab` | Symbols, if not stripped | Not loaded |

Here's real `readelf` output for a test program in this domain:

```
Type:    DYN (Position-Independent Executable file)
Machine: Advanced Micro Devices X86-64
GNU_STACK  ... RW
GNU_RELRO  ... R
FLAGS_1    Flags: NOW PIE
```

Those few lines already tell you about [mitigations](/modules/05-06-exploit-mitigations/): the stack isn't executable, and it's a position-independent binary with full RELRO.

### Process memory layout

| Region | Holds | Grows |
|---|---|---|
| Text | Code | Fixed |
| Data, BSS | Globals | Fixed |
| Heap | `malloc` allocations | Up |
| Memory-mapped | Libraries, files | Varies |
| Stack | Calls and locals | Down |
| Kernel | Not reachable by user code | Fixed |

`/proc/<pid>/maps` shows this for a live process, as [Linux processes](/modules/02-01-linux-processes-and-proc/) showed.

### Dynamic linking: GOT and PLT

A program doesn't know where `printf` lives until it runs, especially with [ASLR](/modules/05-06-exploit-mitigations/). So a call goes through a stub in the **PLT**, which jumps to an address stored in the **GOT**. With *lazy binding*, the first call asks the dynamic linker to find the function and fill in that GOT entry, and later calls go straight there. You saw this as `call 1070 <strcpy@plt>` in the disassembly.

@flow Code > PLT stub > GOT entry > Library function

A writable table of function pointers is a sensitive thing. That's why **RELRO** exists: full RELRO resolves everything at load time, then marks the GOT read-only.

### Advanced: PE files and metadata

Windows's [PE format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format) has the same ideas under other names.

| ELF | PE |
|---|---|
| `.text`, `.data` | `.text`, `.data`, `.rdata` |
| GOT, PLT | Import Address Table |
| Dynamic section | Import and export tables |
| Symbol table | Separate PDB files |

Metadata helps analysts. Import lists hint at behaviour, a *stripped* binary lacks symbols, and a PE's Authenticode signature shows who signed it. Debug paths left in a binary sometimes reveal a developer's folder names. **Static linking** bundles libraries in, with no external dependencies, which means larger files, and patches need a rebuild.

?? What does the PLT help a program do?
+ Call shared functions that are resolved later
- Encrypt its own code before loading it
- Store user passwords in a hidden section
- Measure how much memory each thread uses
=> The PLT and GOT let code call functions whose addresses aren't known until the program is loaded.

## Threat model

Binary structure matters to attackers since writable pointers such as the GOT are tempting targets, and to defenders since headers reveal hardening. Malware also abuses format features, with packed sections, or imports resolved at runtime to hide intent. Altered PE files can carry a stolen or invalid signature, so check signatures properly.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `file` | Identifies a type | The first step |
| `readelf -a`, `objdump -x` | Read ELF headers | Linux binaries |
| `nm`, `strings` | List symbols and text | Quick triage |
| `ldd`, `readelf -d` | Show dependencies | Understanding loading |
| PE-bear, PEStudio | Read PE files | Windows binaries |
| `checksec` | Reports mitigations | Hardening review |

## Defence

- **Compile with hardening flags:** PIE, full RELRO, NX, and stack protection.
- **Check builds in CI** with `checksec`, or a script using `readelf`.
- **Strip release builds,** and keep debug symbols privately.
- **Sign your binaries.**
- **Watch your dependencies.** Static linking hides them from scanners, so produce an [SBOM](/modules/13-03-slsa-and-maturity/).

## Pitfalls

- **Running `ldd` on unknown binaries.** It can execute code. Use `readelf -d`.
- **Trusting symbol names.** Malware can fake them.
- **Assuming a file extension tells you its type.**
- **Reading only section headers.** The loader uses program headers, and those can differ.
- **Forgetting that libraries have their own vulnerabilities.**

?? Which section normally holds executable code?
+ `.text`
- `.data`
- `.bss`
- `.got`
=> `.text` holds instructions and is mapped read and execute, whereas the others hold data.

## Exercise

::: law Lab only
Use programs that you compiled. Licences may restrict reverse engineering of commercial software.
:::

1. Compile a small C program with `gcc -g -o demo demo.c`. Run `file`, then `readelf -h`, then `readelf -S`.
2. Run `readelf -lW demo`, and check GNU_STACK and GNU_RELRO.
3. Compile again with `-no-pie -z norelro`, and compare the output.
4. Run the program under `sleep`-style input, and read `/proc/<pid>/maps`.
5. Use `objdump -d` to find a `call ...@plt`, and follow it to the GOT.
6. Write a short script that fails if a binary lacks PIE or RELRO.

?! A vendor sends you a Linux binary with no source. List what you can learn safely, before you run it, and with which commands.

## Further reading

- [elf(5)](https://man7.org/linux/man-pages/man5/elf.5.html).
- [PE format](https://learn.microsoft.com/en-us/windows/win32/debug/pe-format).
- [How programs get run](https://lwn.net/Articles/631631/), from LWN.
- [ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html).
- [Beginner's guide to linkers](https://www.lurklurk.org/linkers/linkers.html).
