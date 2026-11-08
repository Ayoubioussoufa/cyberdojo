---
title: Fuzzing
summary: Let a machine find your bugs before someone else does. How coverage-guided fuzzing works, writing a harness, running with sanitizers, and making it a routine part of your pipeline.
level: intermediate
side: defence
minutes: 50
attack: none
needs: 05-03-stack-memory-corruption
pair: 05-04-heap-and-integer-bugs, 05-10-symbolic-execution-and-kernels
source: Google, Fuzzing documentation | https://github.com/google/fuzzing
words: fuzzing, harness, code coverage
---
Fuzzing throws huge numbers of generated inputs at a program, and watches for crashes. It sounds crude, yet it has found thousands of serious bugs in software that experts had reviewed for decades. Google's [OSS-Fuzz](https://github.com/google/oss-fuzz) has found tens of thousands of bugs in open-source projects. It's now a standard defensive practice, and any team that parses untrusted data should use it.

@term fuzzing = Testing a program with automatically generated inputs to find crashes and misbehaviour.
@term fuzz harness = A small piece of code that feeds fuzzer input to the function under test.
@term code coverage = A measure of which parts of a program a test has run.
@term corpus = A set of inputs a fuzzer keeps and mutates.

## Concept

### Fundamentals: from random to guided

| Generation | Approach | Weakness |
|---|---|---|
| Dumb | Random bytes | Stops at the first format check |
| Grammar-based | Inputs follow a format | Needs a grammar |
| **Coverage-guided** | Keep inputs that reach new code | Needs instrumentation |

The big idea came from [AFL](https://lcamtuf.coredump.cx/afl/), by Michał Zalewski. The fuzzer instruments the target, so that it can see which paths an input reaches. Any input reaching new code joins the **corpus**, and gets mutated further. So the fuzzer evolves valid-looking input, without knowing the format.

@flow Pick an input > Mutate it > Run the target > New coverage? Keep it > Crash? Save it

### Harnesses

A fuzzer needs an entry point. With libFuzzer, that's one function.

```c
int LLVMFuzzerTestOneInput(const uint8_t *data, size_t size) {
    parse_config(data, size);   // the function under test
    return 0;
}
```

```
clang -g -O1 -fsanitize=fuzzer,address harness.c parser.c -o fuzz
./fuzz corpus/
```

A good harness is **fast**, and it's **deterministic**, doesn't leak memory, and focuses on code that handles untrusted input. Most of the skill of fuzzing lies in choosing targets, and in writing good harnesses.

### Sanitizers make it work

A memory bug doesn't always crash. So fuzz with **AddressSanitizer**, and it turns silent corruption into an immediate, labelled failure. **UBSan** catches integer and type problems, and **MemorySanitizer** finds uninitialised reads. As shown in [Stack memory safety](/modules/05-03-stack-memory-corruption/), ASan names the exact fault.

### Tools

| Tool | Best for |
|---|---|
| libFuzzer | In-process C and C++ libraries |
| AFL++ | Binaries and C or C++ code, widely used |
| Honggfuzz | Another strong general fuzzer |
| Atheris | Python |
| cargo-fuzz | Rust |
| Jazzer | Java |
| Go's built-in fuzzing | Go |
| Schemathesis | Web APIs |

### Advanced: running it seriously

**Seed corpus.** Start with small valid samples, so that the fuzzer needn't discover the format from nothing.

**Dictionaries** provide tokens, such as magic numbers and keywords.

**Structure-aware fuzzing.** For complex formats, mutate the structure, not the bytes, using `libprotobuf-mutator`.

**Measuring.** Watch coverage. When it stops growing, write a better harness, rather than wait longer.

**Triage.** Crashes get deduplicated and minimised. See [Assessing exploitability](/modules/05-05-exploitation-concepts/).

**In CI.** Keep a short fuzz run on each pull request, and a long one overnight. [ClusterFuzzLite](https://google.github.io/clusterfuzzlite/) does this for small teams. Add every crash found to your regression tests. **OSS-Fuzz** runs for free for important open-source projects.

**Where else?** Fuzzing extends to [kernels](/modules/05-10-symbolic-execution-and-kernels/), protocols, and hardware designs. AI is now being used to generate harnesses, and Google has [reported](https://security.googleblog.com/2023/08/ai-powered-fuzzing-breaking-bug-hunting.html) real gains in coverage from that.

?? What does coverage guidance give a fuzzer?
+ Feedback on which inputs reach new code
- Proof that the program has no bugs
- A list of each of its users
- A signed certificate for the tested binary
=> Keeping inputs that reach new paths lets it explore deeper, rather than testing the same parser step forever.

## Threat model

Attackers fuzz too, especially on parsers and closed-source products. If you don't fuzz your code, then someone else might. [OSS-Fuzz data](https://security.googleblog.com/) shows steady finds in widely used libraries, and a flaw in a shared library affects everyone who uses it.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| AFL++ | Coverage-guided fuzzer | General purpose |
| libFuzzer | In-process fuzzing | Libraries |
| ASan, UBSan | Detect faults | Always with fuzzing |
| ClusterFuzzLite | CI integration | Your repository |
| OSS-Fuzz | Free large-scale fuzzing | Open-source projects |
| CASR | Groups crashes | Triage |

## Defence

- **Fuzz every parser** of untrusted input.
- **Write harnesses** next to the code, with the same review.
- **Run in CI,** with a nightly long run.
- **Turn crashes into regression tests.**
- **Track coverage.**
- **Fuzz after refactoring,** since new bugs appear.
- **Prefer memory-safe rewrites** of whatever keeps crashing.

## Pitfalls

- **Fuzzing without sanitizers.** You'll miss most memory bugs.
- **A slow harness.** Fuzzers need thousands of runs per second.
- **Harness bugs.** A crash in your harness isn't a target bug.
- **Starting with no seeds.**
- **"We fuzzed it, so it's safe."** Fuzzing finds bugs, and it can't prove there are none.
- **Fuzzing production services.** Use a test build.

?? Why run fuzzers with AddressSanitizer?
+ It turns silent memory errors into crashes
- It makes the target run much faster
- It writes the fix for each bug
- It encrypts every input before testing it
=> Without it, a small overflow may do nothing visible, so the fuzzer would never notice.

## Exercise

::: law Lab only
Fuzz your own code, or open-source code on your own machine. Don't fuzz someone else's live service. It's a denial-of-service risk, and may be illegal.
:::

1. Write a small parser in C with a hidden bug: for instance, a length field that isn't checked.
2. Write a libFuzzer harness. Compile with `-fsanitize=fuzzer,address`.
3. Run it, and time how long it takes to find the bug.
4. Read the ASan report, then fix the bug.
5. Add a dictionary, and a seed corpus, and compare the speed.
6. Use `llvm-cov` to see what wasn't reached.
7. Add a short fuzz job to a GitHub Action.

?! Choose a piece of software you depend on. Which part would you fuzz first, and how would you write its harness?

## Further reading

- [Google's fuzzing documentation](https://github.com/google/fuzzing).
- [The Fuzzing Book](https://www.fuzzingbook.org/), free and interactive.
- [AFL++ documentation](https://aflplus.plus/docs/).
- [libFuzzer](https://llvm.org/docs/LibFuzzer.html).
- [OSS-Fuzz](https://github.com/google/oss-fuzz).
