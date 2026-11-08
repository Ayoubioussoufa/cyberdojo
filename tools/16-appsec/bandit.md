---
title: Bandit
summary: Finds common security issues in Python code.
side: both
use: open
docs: https://bandit.readthedocs.io/
kali: bandit
alt: semgrep
---
## What it's for
Bandit is a focused scanner for Python. It looks for the mistakes that come up again and again: hard-coded passwords, unsafe deserialisation, shell calls with user input, weak cryptography.

## How it works
It parses Python into a syntax tree and runs a set of plugins, each looking for one risky pattern. It's quick and needs little setup, which makes it easy to add to a Python project's checks. It reasons within a file, so it won't trace a value across modules, but for catching obvious errors early it's effective.

## Try it
```
bandit -r myproject/
```

Run it on a small Python project, or write a file that builds a SQL string by concatenation and calls `subprocess` with user input, then watch Bandit flag both.

## What defenders see
Add it to CI for any Python codebase, and review its findings, since some are context-dependent, such as an `assert` used where it's actually fine. Pair it with dependency scanning, as your own code is only part of the risk. The AI and agent lessons use it on the project code.

?! Bandit flags a line that you know is safe in context. What should you do, and what should you not do?
