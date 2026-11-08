---
title: Program analysis and the kernel
summary: Finding bugs by reasoning about code. Symbolic execution and its limits, static analysis at scale, why the kernel is such a critical surface, and how it's being hardened.
level: advanced
side: defence
minutes: 45
attack: T1068
needs: 05-09-fuzzing, 02-03-linux-confinement
pair: 05-09-fuzzing
source: Linux kernel self-protection | https://docs.kernel.org/security/self-protection.html
words: symbolic execution, SMT solver, kernel attack surface
---
Fuzzing tries inputs. Program analysis reasons about all inputs at once, by treating them as unknowns. Each method reaches what the other misses. This module also turns to the most valuable target in any system: the kernel, in which one flaw can break every boundary above it.

@term symbolic execution = Running a program with symbols instead of concrete values, in order to work out which inputs reach each path.
@term SMT solver = A tool that finds values which satisfy a set of logical constraints.
@term taint analysis = Tracking how untrusted data flows through a program.
@term kernel attack surface = The code in the kernel that unprivileged programs can reach.

## Concept

### Fundamentals: reasoning about paths

Take this code:

```c
if (x * 3 + 1 == 22) {
    bug();
}
```

A random fuzzer would rarely hit `x == 7`. **Symbolic execution** treats `x` as an unknown, collects the condition, and asks an **SMT solver** such as Z3 for a value that satisfies it. The answer comes back at once.

@flow Treat input as symbols > Collect path conditions > Ask the solver > Get a concrete input

### The trade-off

| Method | Finds | Weakness |
|---|---|---|
| Fuzzing | Real crashes, at scale | Struggles with exact checks |
| Symbolic execution | Precise paths | Path explosion |
| Static analysis | Patterns across all code | False positives |
| Formal verification | Proofs | Expensive, as [Formal methods](/modules/16-05-formal-methods/) showed |

**Path explosion** is the core limit. Every branch doubles the paths, and loops multiply them. So tools limit their search. **Concolic** execution runs concretely and symbolically together, and hybrid fuzzers such as Driller use a solver only when a fuzzer gets stuck. [KLEE](https://klee-se.org/) and [angr](https://angr.io/) are the main tools, and DARPA's Cyber Grand Challenge in 2016 showed automated systems finding and patching bugs on their own.

### Static analysis at scale

**Taint analysis** traces untrusted data from sources to dangerous sinks, and it's the basis of tools like CodeQL. You can query code like a database, and that's what [variant analysis](/modules/05-05-exploitation-concepts/) uses. It finds whole classes across millions of lines, at the cost of false positives. Static tools work best when they're tuned for your code, and wired into CI.

### The kernel

The kernel runs with full privilege, and it parses input from every process. So a flaw there defeats [containers](/modules/10-05-container-escape-and-runtime/), and every user boundary.

**The attack surface** includes system calls, device drivers, filesystems, network stacks and eBPF. Drivers are the largest and weakest part. So **reducing what's reachable** is a powerful defence: [seccomp](/modules/02-03-linux-confinement/) cuts system calls, Android restricts them heavily, and sandboxed runtimes like gVisor avoid direct exposure.

**Finding kernel bugs.** [syzkaller](https://github.com/google/syzkaller), Google's coverage-guided kernel fuzzer, has found thousands of Linux bugs, and it [reports them publicly](https://syzkaller.appspot.com/upstream) on syzbot. KASAN is the kernel version of AddressSanitizer.

### Advanced: hardening the kernel

| Defence | Effect |
|---|---|
| KASLR | Randomises kernel addresses |
| SMEP, SMAP | Kernel can't run or read user pages by accident |
| KPTI | [Isolates kernel mappings](/modules/15-05-microarchitectural-attacks/) |
| Stack protector, CFI | Same ideas as in user space |
| `kptr_restrict`, `dmesg_restrict` | Reduce information leaks |
| Module signing, lockdown | Limit what can load |
| Windows HVCI | A hypervisor enforces code integrity |

**Memory-safe kernels.** Rust is now [officially part of Linux](https://docs.kernel.org/rust/index.html) for some drivers, and Windows has Rust components as well. Google [reported](https://security.googleblog.com/2024/09/eliminating-memory-safety-vulnerabilities-Android.html) that memory safety bugs in Android fell a great deal as new code moved to memory-safe languages. Since drivers cause so many flaws, that's a good place to begin.

**CVE volume.** The Linux kernel became a CVE numbering authority in 2024, and now assigns many CVEs, because almost any bug might matter. So patching means following a stable kernel, rather than chasing each CVE.

?? What's the main limit of symbolic execution?
+ Path explosion as the program's branches multiply
- It can only analyse Python source code
- It must run on a quantum computer
- It needs the program's original developers present
=> Paths grow exponentially with branches and loops, so a complete analysis of big programs isn't feasible.

## Threat model

Local [privilege escalation](https://attack.mitre.org/techniques/T1068/) through the kernel is the classic second stage after a foothold, and it's a way out of containers. Attackers with admin rights may load [vulnerable drivers](/modules/06-05-evasion-concepts/). On mobile, kernel flaws feature in spyware chains.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Z3 | SMT solver | Learning constraints |
| angr | Binary symbolic execution | Research, CTF |
| KLEE | Source-level symbolic execution | Testing C code |
| CodeQL, Semgrep | Static analysis | Your repositories |
| syzkaller | Kernel fuzzing | Kernel development |
| `seccomp`, gVisor | Reduce kernel exposure | Production |

## Defence

- **Combine methods:** static analysis, fuzzing and review.
- **Reduce kernel exposure** with seccomp and sandboxes.
- **Remove unneeded modules and drivers.**
- **Keep kernels updated,** on a supported stable series.
- **Apply the driver block list.**
- **Enable KASLR, SMEP, SMAP, HVCI.**
- **Write new drivers in safer languages** where that's possible.

## Pitfalls

- **Expecting symbolic execution to scale** to a whole browser.
- **Treating a static analyser's silence as proof.**
- **Chasing each kernel CVE individually.**
- **Assuming that containers isolate kernel flaws.**
- **Loading third-party drivers without review.**

?? Why is the kernel such valuable attack surface?
+ A flaw there breaks every isolation above
- It holds the organisation's main customer database
- It's the only code that isn't compiled
- It runs only on the company's laptops
=> User separation, containers and most security tools all rely on the kernel being correct.

## Exercise

::: law Lab only
Run everything on your own VM. Use your own small programs, or public CTF binaries.
:::

1. Install Z3 for Python, and solve `x * 3 + 1 == 22`. Add a constraint, and solve again.
2. Use `angr` to find the input that reaches a `win` function in a small program of yours.
3. Write a nested loop, and watch `angr` slow down. Explain why.
4. Write a CodeQL or Semgrep query that traces data into `strcpy`.
5. Run `cat /proc/sys/kernel/kptr_restrict`, and check `grep . /sys/devices/system/cpu/vulnerabilities/*`.
6. Write a seccomp profile for a small program, and show that an unneeded system call fails.

?! Your team runs untrusted code in containers. List three ways to reduce the kernel's attack surface, with the cost of each.

## Further reading

- [Linux kernel self-protection](https://docs.kernel.org/security/self-protection.html).
- [syzkaller](https://github.com/google/syzkaller).
- [Z3](https://github.com/Z3Prover/z3).
- [angr documentation](https://docs.angr.io/).
- [CodeQL documentation](https://codeql.github.com/docs/).
