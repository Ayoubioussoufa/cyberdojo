---
title: Stack memory safety
summary: Why writing past a buffer matters. Stack overflows as a coding bug, how they appear in review, and what a canary and a sanitizer do when you trigger one on your own code.
level: intermediate
side: defence
minutes: 45
attack: T1203
needs: 05-01-x86-64-assembly, 05-02-executables-and-linking
pair: 05-06-exploit-mitigations
source: CWE-121, Stack-based Buffer Overflow | https://cwe.mitre.org/data/definitions/121.html
words: buffer overflow, bounds check, memory safety
---
Memory corruption has been a leading cause of serious vulnerabilities for over thirty years. CWE-787 and CWE-121 are in the 2025 Top 25, and major vendors have repeatedly said that about 70% of their severe security bugs are memory safety issues. This module is written for a code reviewer and defender. It shows what the bug is, how it's caught, and how to get rid of it. How attackers turn such bugs into exploits belongs to courses like pwn.college, with their own labs.

@term buffer overflow = Writing past the end of a memory buffer.
@term bounds check = Verifying that an index or length stays within a buffer.
@term undefined behaviour = Code whose effect the C standard doesn't define, so that anything may happen.

## Concept

### Fundamentals: C trusts you

C has no bounds checks. An array is just an address, and writing to `buf[100]` in a 16-byte array simply writes to whatever lies there. That's **undefined behaviour**: the language makes no promises.

```c
void copy(const char *s) {
    char buf[16];
    strcpy(buf, s);     // the bug: no length check
}
```

`strcpy` copies until it finds a NUL byte. The input's length, not the buffer's size, decides how much gets written.

### Why the stack makes it serious

From the [assembly module](/modules/05-01-x86-64-assembly/): local variables live on the stack, near the saved frame pointer and the **return address**. So an overflow can corrupt not only other variables, but the record of where the function should return to. That's why a simple copy bug can turn from a crash into a security problem: control data sits right next to attacker-influenced data.

### What really happens

This program was compiled and run for this module, with a 64-character argument.

| Build | Result |
|---|---|
| `-fstack-protector-all` | `*** stack smashing detected ***: terminated`, exit code 134 (abort) |
| `-fno-stack-protector` | Segmentation fault, exit code 139 |
| `-fsanitize=address` | Precise report, below |

```
ERROR: AddressSanitizer: stack-buffer-overflow
WRITE of size 65
    #0 in strcpy
```

The three runs make the lesson plain: the bug is the same each time, and only how it's noticed changes. The canary stopped the function from returning. The unprotected build crashed by luck. AddressSanitizer named the exact fault, the size and the place.

### Dangerous patterns

| Pattern | Safer choice |
|---|---|
| `gets` | Removed from C11. Use `fgets` |
| `strcpy`, `strcat` | `strlcpy` where available, or track lengths |
| `sprintf` | `snprintf` |
| `scanf("%s")` | Use a width: `%15s` |
| `memcpy` with an untrusted length | Validate against the buffer's size first |
| Off-by-one in a loop | `i < n`, not `i <= n` |

`strncpy` isn't a safe swap: it may leave a string without a terminator.

### Advanced: the wider class

Stack overflows are one of several **spatial** memory errors, along with out-of-bounds reads ([CWE-125](https://cwe.mitre.org/data/definitions/125.html)) and writes ([CWE-787](https://cwe.mitre.org/data/definitions/787.html)). Reads matter too. **Heartbleed** was an out-of-bounds read in OpenSSL, in which a length field wasn't checked, so that servers leaked memory containing keys and passwords. No control flow was affected, and it was still catastrophic.

[Microsoft](https://msrc.microsoft.com/blog/2019/07/a-proactive-approach-to-more-secure-code/) and the [Chromium project](https://www.chromium.org/Home/chromium-security/memory-safety/) have each reported that around 70% of their serious bugs are memory safety issues. That's why governments now urge [memory-safe languages](https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps). Rust's borrow checker and bounds checks stop these classes at compile time or at runtime, and Android [reported a sharp fall](https://security.googleblog.com/2024/09/eliminating-memory-safety-vulnerabilities-Android.html) in such flaws as new code moved to memory-safe languages.

?? Why is `gets` banned from modern C?
+ It can't limit how much it writes
- It prints each password to the screen
- It only reads from network sockets today
- It runs much slower than other functions
=> It has no size argument, so any long input overflows the buffer, which is why C11 removed it.

## Threat model

Memory bugs in anything that parses untrusted data, such as image libraries, network daemons, browsers and file formats, are high-value targets. They can support [exploitation for client execution](https://attack.mitre.org/techniques/T1203/). Real exploitation is harder today, thanks to [mitigations](/modules/05-06-exploit-mitigations/), yet still practical for determined attackers. So treat a crash on untrusted input as a security bug until shown otherwise.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| AddressSanitizer | Catches memory errors at runtime | Testing every build |
| Valgrind | Finds memory errors, slower | Without recompiling |
| `-Wall -Wextra -Wformat-security` | Compiler warnings | Always |
| clang-tidy, CodeQL, Semgrep | Find unsafe patterns | Review |
| [Fuzzers](/modules/05-09-fuzzing/) | Generate inputs | Finding what review missed |
| gdb | Examines a crash | Triage |

## Defence

- **Prefer memory-safe languages** for new code that handles untrusted input.
- **Run tests under ASan and UBSan.**
- **Check lengths** before every copy.
- **Ban unsafe functions** with a lint rule.
- **Enable hardening flags:** see [Mitigations](/modules/05-06-exploit-mitigations/).
- **Fuzz parsers.**
- **Sandbox risky parsing,** so that a bug doesn't reach anything useful.

## Pitfalls

- **"It only crashes."** A crash means that memory was corrupted.
- **Believing that the canary fixed it.** It detected the overflow, and the bug remains.
- **Assuming that `strncpy` is safe.**
- **Trusting a length from the input.** That was Heartbleed.
- **Testing without sanitizers.** A small overflow can go unnoticed.

?? What does a stack canary do when it's overwritten?
+ The program aborts before the function returns
- The kernel restarts it with more memory
- The compiler rebuilds the function at runtime
- The stack is copied to the heap
=> The value is checked just before returning, so a change stops the program before it can use a corrupted return address.

## Exercise

::: law Lab only
Use your own small programs in a VM. This exercise is about seeing a crash and its detection, and it doesn't involve building an exploit. For offensive practice, use pwn.college.
:::

1. Save the `copy` function above in a small program. Compile three builds: `-fstack-protector-all`, `-fno-stack-protector` and `-fsanitize=address`.
2. Run each with `hello`, then with a 64-character argument. Record the outputs and exit codes.
3. Replace `strcpy` with `snprintf(buf, sizeof buf, "%s", s)`, and run all three again.
4. Read the assembly with `objdump`, and find the canary load and check.
5. Compile with `-Wall -Wextra`. Which warnings appear?
6. Run `semgrep` or `clang-tidy` on the original.

?! A colleague says "it's an internal tool, so a buffer overflow doesn't matter". Write a reply, and say what evidence would change your view.

## Further reading

- [CWE-121](https://cwe.mitre.org/data/definitions/121.html) and [CWE-787](https://cwe.mitre.org/data/definitions/787.html).
- [CISA: The Case for Memory Safe Roadmaps](https://www.cisa.gov/resources-tools/resources/case-memory-safe-roadmaps).
- [Chromium memory safety](https://www.chromium.org/Home/chromium-security/memory-safety/).
- [SEI CERT C Coding Standard](https://wiki.sei.cmu.edu/confluence/display/c/SEI+CERT+C+Coding+Standard).
- [AddressSanitizer documentation](https://github.com/google/sanitizers/wiki/AddressSanitizer).
