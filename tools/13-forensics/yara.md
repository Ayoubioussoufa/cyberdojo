---
title: YARA
summary: Matches files and memory against patterns you define.
side: defence
use: open
docs: https://yara.readthedocs.io/
kali: yara
alt: volatility, clamav
---
## What it's for
YARA is how analysts describe and detect malware families. You write rules that look for tell-tale strings or byte patterns, and YARA scans files, processes or memory for them.

## How it works
A rule has a set of strings, text or hexadecimal, and a condition that combines them. The condition can require several strings, a count, or a position. So a rule captures what's characteristic of a family, not just one sample's hash, which means it still catches small variants. Rules are shared widely, and many threat reports include one.

## Try it
::: law Lab only
Scan samples only in an isolated VM.
:::

```
yara -r myrule.yar /path/to/scan
```

Write a rule that matches a harmless string you put in a test file, then scan a folder for it. The [safe malware triage lesson](/courses/0067-safe-malware-triage/) shows realistic rules.

## What defenders see
YARA is everywhere in defence: in scanners, in [Volatility](/tools/volatility/) for memory, and in email gateways. Good rules are specific enough to avoid false positives but general enough to catch variants. Keep your rules in version control, and test them against known-good files too.

?! Why does a YARA rule catch variants of a malware family when a file hash catches only one exact file?
