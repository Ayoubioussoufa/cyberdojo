---
title: Trivy
summary: Scans images, file systems and code for vulnerabilities and misconfigurations.
side: both
use: open
docs: https://trivy.dev/latest/docs/
alt: grype, checkov
---
## What it's for
Trivy, from Aqua Security, is a popular all-in-one scanner. It finds known vulnerabilities in container images and dependencies, and it also flags misconfigurations and leaked secrets. Teams put it in the build pipeline so problems are caught before release.

## How it works
It reads what's there and compares it with databases. For an image, it lists the installed packages and matches them against vulnerability feeds. For code, it reads lock files to find vulnerable dependencies. For infrastructure files, it checks against built-in policies. So one tool covers several checks that used to need several tools, which is why it spread quickly.

## Try it
```
trivy image python:3.9-slim
trivy fs --scanners vuln,secret,misconfig .
```

Scan an old image tag, and see how many known issues it carries. Then scan a newer one, and compare.

## What defenders see
This is a defender's tool. Run it in CI and fail a build on new critical findings, but allow a documented exception path, since not every finding is reachable in your context. Scan images you already run, too, as new vulnerabilities are found in old images every day.

?! Scanning the same image a month apart gives more findings the second time, with no change to the image. Why?
