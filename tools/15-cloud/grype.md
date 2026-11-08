---
title: Grype
summary: Finds known vulnerabilities in container images and file systems.
side: both
use: open
docs: https://github.com/anchore/grype
alt: trivy, syft
---
## What it's for
Grype, from Anchore, scans an image or directory for known vulnerabilities. It pairs with Syft, which lists what's inside, so together they tell you what you have and what's wrong with it.

## How it works
Syft produces a software bill of materials, a complete list of components. Grype then matches that list against vulnerability data. Separating the two steps is deliberate: you generate the bill of materials once, and can rescan it later as new vulnerabilities are disclosed, without rebuilding the image. [Dependency attacks](/modules/13-01-dependency-attacks/) explains why that inventory matters.

## Try it
```
grype python:3.9-slim
syft python:3.9-slim -o spdx-json > sbom.json
grype sbom:sbom.json
```

Generate a bill of materials, then scan it. Keep it, and scan it again next week.

## What defenders see
Keeping a bill of materials for each release lets you answer "are we affected?" the day a new flaw like Log4Shell appears, without touching production. Store these artifacts, and automate the rescan. This is becoming an expectation, and regulations increasingly ask for it.

?! Why is a stored software bill of materials so valuable the moment a new critical vulnerability is announced?
