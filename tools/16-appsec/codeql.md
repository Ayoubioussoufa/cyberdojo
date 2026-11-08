---
title: CodeQL
summary: Treats code as a database you can query for security flaws.
side: both
use: open
docs: https://codeql.github.com/docs/
alt: semgrep
---
## What it's for
CodeQL, from GitHub, lets you query code as if it were a database. It's powerful for finding whole classes of vulnerability, and for variant analysis: once you find one bug, you search for every sibling of it.

## How it works
It first builds a database that captures the code's structure and, importantly, how data flows through it. You then write queries in its language to find patterns, such as untrusted input reaching a dangerous function across several steps and files. That cross-file data-flow analysis is what lets it find deep bugs that a within-file scan misses, at the cost of a slower build step. [Assessing exploitability](/modules/05-05-exploitation-concepts/) describes variant analysis.

## Try it
```
codeql database create db --language=python
codeql database analyze db --format=sarif-latest --output=results.sarif
```

Build a database for a small project, run the standard security queries, and read one result's data-flow path from source to sink.

## What defenders see
It's widely used in open-source security, and it runs free on public repositories through GitHub code scanning. After any security bug, write a query to find its variants, since fixing one instance while siblings remain is a common and costly mistake.

?! Why is the ability to follow data flow across files the key to finding an injection bug that a single-file scanner misses?
