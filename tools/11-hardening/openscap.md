---
title: OpenSCAP
summary: Checks a system against formal security policies, such as CIS or STIG.
side: defence
use: open
docs: https://www.open-scap.org/
kali: openscap-scanner
aka: oscap
alt: lynis, cis-cat
---
## What it's for
Large organisations must prove that systems meet a defined standard, such as a CIS Benchmark or a DISA STIG. OpenSCAP checks a machine against these formal policies and reports which rules pass.

## How it works
SCAP is a set of standards for expressing security policy in a machine-readable form. A profile lists rules, each with a check and often a fix. `oscap` runs the checks and produces a report, and many profiles can even generate a remediation script. So compliance becomes repeatable and automatic, rather than a manual checklist.

## Try it
```
oscap xccdf eval --profile xccdf_org.ssgproject.content_profile_cis \
  --results result.xml --report report.html \
  /usr/share/xml/scap/ssg/content/ssg-ubuntu2404-ds.xml
```

Generate the HTML report, open it, and read a failing rule together with its rationale and fix.

## What defenders see
This underpins compliance programmes. Automate it so that every server is checked regularly, track the trend, and keep reports as evidence for auditors. Distinguish real risk reduction from box-ticking: a passing score isn't the same as being secure, as [governance](/modules/12-04-nist-rmf-and-controls/) discusses.

?! What's the difference between a system that passes a benchmark and a system that's actually secure?
