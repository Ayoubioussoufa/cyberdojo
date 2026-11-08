---
title: Semgrep
summary: Finds bugs and risky patterns in source code using simple rules.
side: both
use: open
docs: https://semgrep.dev/docs/
alt: codeql, bandit, trivy
---
## What it's for
Semgrep searches source code for patterns, like grep that understands code structure. Teams use it to catch insecure patterns, enforce standards, and find bugs, across many languages, fast enough for every commit.

## How it works
Unlike a text search, it parses code into a syntax tree, so a rule matches the structure rather than the exact characters. A rule looks much like the code it catches, with `...` for "anything here", which makes rules easy to write. It mostly reasons within a file, which keeps it fast, at the cost of missing some flows that cross files. Thousands of community rules already exist.

## Try it
```
semgrep --config=auto .
```

Run it on a small project, read one finding, then write a one-rule file that flags a dangerous function such as `eval`, and catch it in test code.

## What defenders see
This is a core secure-development tool. Run it in CI, start with a focused rule set to avoid alert fatigue, and write custom rules for your own risky patterns, which is where it shines. [CI/CD attacks](/modules/13-02-cicd-attacks/) and the secure SDLC lessons give the wider context.

?! Why does matching code structure beat a plain text search for finding an insecure function call?
