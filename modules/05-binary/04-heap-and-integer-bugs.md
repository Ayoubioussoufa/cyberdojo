---
title: Heap, integer and format bugs
summary: The other memory safety classes. Use-after-free, double free, integer overflow, format strings and type confusion, as a code reviewer sees them, and how tools catch each.
level: advanced
side: defence
minutes: 45
attack: T1203
needs: 05-03-stack-memory-corruption
pair: 05-09-fuzzing
source: CWE-416, Use After Free | https://cwe.mitre.org/data/definitions/416.html
words: use-after-free, integer overflow, type confusion
---
Stack overflows are the famous case, but the bugs at the top of today's browsers and kernels are mostly elsewhere: objects used after they were freed, sizes that wrapped around, and types confused for one another. These are about **time** and **logic**, rather than a copy that's too long. This module teaches you how to recognise them in code and in tool output.

@term use-after-free = Using memory after it has been released.
@term dangling pointer = A pointer to memory that has already been freed.
@term integer overflow = An arithmetic result too large for its type, which wraps around or is undefined.
@term type confusion = Treating an object as a different type than it really is.

## Concept

### Fundamentals: spatial and temporal safety

| Class | Failure | Examples |
|---|---|---|
| Spatial | Outside the bounds | [Buffer overflows](/modules/05-03-stack-memory-corruption/), out-of-bounds reads |
| Temporal | Outside the lifetime | Use-after-free, double free |
| Type | The wrong interpretation | Type confusion |
| Initialisation | Reading uninitialised memory | Leaks |

### Heap lifetime bugs

The heap holds objects whose lifetimes programmers manage by hand.

```c
char *p = malloc(32);
free(p);
// ... much later, somewhere else ...
p[0] = 'x';         // use-after-free
```

After `free`, the allocator may hand that same memory to another object. A **dangling pointer** now aliases something else entirely, so writes through it corrupt unrelated data. It often passes tests, since nothing breaks right away. In large programs with callbacks and shared ownership, working out who frees what is really hard. [CWE-416](https://cwe.mitre.org/data/definitions/416.html) remains in the Top 25 for this reason.

**Double free** releases one block twice, confusing the allocator's bookkeeping. Modern allocators detect many cases, and abort.

**Fixes** include clear ownership, setting pointers to `NULL` after freeing, and smart pointers (`std::unique_ptr`) in C++. Rust enforces ownership at compile time.

### Integers

Integers wrap, and mistakes around sizes turn into memory bugs.

```c
size_t total = count * sizeof(item);   // can wrap around
char *p = malloc(total);               // far too small
```

If `count * sizeof(item)` exceeds the type's maximum, `total` wraps to a small value, then later code writes `count` items into a tiny buffer. **Signedness** mistakes are also common: a negative length becomes huge when it's converted to `size_t`. Use checked arithmetic, such as `__builtin_mul_overflow`, or `calloc`, which checks the multiplication itself.

### Format strings

```c
printf(user_input);       // wrong
printf("%s", user_input); // right
```

If input becomes the format, directives in it read or even write memory. It's the same root cause as [injection](/modules/04-03-injection-beyond-sql/): data used as instructions. `-Wformat-security` catches it, and modern hardening helps as well.

### Advanced: type confusion and browsers

C++ objects hold pointers to virtual function tables. If a program treats an object as the wrong type, it can misinterpret fields, including those pointers. JavaScript engines are a major source, because their just-in-time compilers make speculative assumptions about types. A wrong assumption becomes memory corruption. That's why browsers such as Chrome add sandboxes, and the [V8 sandbox](https://v8.dev/blog/sandbox), and it's why JIT flaws recur in the KEV list.

**Hardened allocators** make these bugs less useful: guard pages, randomisation, and delayed reuse. [MiraclePtr](https://security.googleblog.com/2022/09/use-after-freedom-miracleptr.html) protects Chromium against some use-after-free cases. Memory tagging detects misuse in hardware. See [Mitigations](/modules/05-06-exploit-mitigations/).

?? What is a use-after-free?
+ Code touches memory after it's been released
- Code allocates far more memory than required
- Code reads a file before opening it
- Code writes a log after closing it
=> The pointer still looks valid, but the memory may already belong to something else.

## Threat model

These bugs matter most in software that handles attacker-controlled data for many users: browsers, office suites, media parsers, kernels. Google's Project Zero tracks [zero-days exploited in the wild](https://googleprojectzero.blogspot.com/p/0day.html), and memory corruption dominates that list. That places them in [client execution](https://attack.mitre.org/techniques/T1203/), and in spyware chains such as those in [iOS](/modules/15-04-ios-and-mobile-testing/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| AddressSanitizer | Finds use-after-free and overflows | Testing |
| UndefinedBehaviorSanitizer | Finds integer and type problems | Testing |
| MemorySanitizer | Finds uninitialised reads | Testing |
| Valgrind | Runtime memory checks | Without recompiling |
| CodeQL | Finds patterns across code | Review |
| Rust, modern C++ | Prevent classes of bug | New code |

## Defence

- **Run all three sanitizers in CI.**
- **Use smart pointers** and clear ownership rules in C++.
- **Use checked arithmetic** for sizes.
- **Keep format strings as constants,** and enable `-Wformat-security`.
- **Fuzz** with sanitizers on, as in [the fuzzing module](/modules/05-09-fuzzing/).
- **Sandbox** risky parsers.
- **Migrate new components** to memory-safe languages.

## Pitfalls

- **"Tests pass, so memory's fine."** These bugs often appear only under specific timing.
- **Setting a pointer to NULL in one place.** Other copies still dangle.
- **Ignoring compiler warnings about signedness.**
- **Trusting a size from a file header.**
- **Rewriting everything at once.** Start with new code, and the riskiest parsers.

?? What's the fix for a format string flaw?
+ Never pass user input as the format
- Compile the program with a newer standard
- Print the message using a larger buffer
- Convert every string to upper case first
=> Use a constant format, and pass the input as an argument.

## Exercise

::: law Lab only
Use small programs you wrote, in a VM. Run them only to see tools report the bug. Don't go further into exploitation outside legal training platforms.
:::

1. Write the use-after-free above. Compile with `-fsanitize=address`, and read the three stacks: use, free and allocation.
2. Run it with no sanitizer. Does anything look wrong?
3. Write the integer multiplication example. Compile with `-fsanitize=undefined,integer` using Clang, or use `__builtin_mul_overflow`.
4. Compile `printf(argv[1])` with `-Wformat-security`, and read the warning.
5. Rewrite the first example in Rust, and read the compiler's error.

?! Your team maintains a 500,000-line C++ parser. Propose a realistic memory safety plan for the next 12 months.

## Further reading

- [CWE-416](https://cwe.mitre.org/data/definitions/416.html) and [CWE-190](https://cwe.mitre.org/data/definitions/190.html).
- [Project Zero's 0day tracking](https://googleprojectzero.blogspot.com/p/0day.html).
- [Secure by Design: memory safety](https://security.googleblog.com/2024/10/safer-with-google-advancing-memory.html).
- [C++ Core Guidelines](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines).
- [The Rust Book, on ownership](https://doc.rust-lang.org/book/ch04-00-understanding-ownership.html).
