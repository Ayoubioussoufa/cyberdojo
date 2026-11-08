---
title: CIS-CAT
summary: Assesses systems against CIS Benchmarks.
side: defence
use: open
docs: https://www.cisecurity.org/cybersecurity-tools/cis-cat-pro
aka: CIS Benchmarks
alt: openscap, lynis
---
## What it's for
The CIS Benchmarks are well-respected, consensus-built hardening guides for operating systems and software. CIS-CAT is the tool that checks a system against them. The benchmark documents themselves are free and worth reading on their own.

## How it works
Each benchmark is a detailed list of settings with a rationale for each. CIS-CAT reads the system and reports conformance, much as OpenSCAP does with SCAP content. The value is the curation: a respected community has decided what matters and why, so you don't start from a blank page. The Lite version covers some benchmarks for free.

## Try it
Download a CIS Benchmark PDF for an operating system you use, pick a section such as SSH, and apply its recommendations by hand on a lab VM. Then check with [Lynis](/tools/lynis/) or [OpenSCAP](/tools/openscap/) that the change took effect.

```
sshd -T | grep -iE 'permitrootlogin|passwordauthentication'
```

Use a command like this one to confirm a setting.

## What defenders see
Benchmarks give you a defensible baseline, and reading the rationale teaches you why each setting matters, which is more valuable than the score. Pick a level that fits your needs, since the strictest profile can break legitimate use.

?! Why is the rationale beside each benchmark rule often more useful than the rule itself?
