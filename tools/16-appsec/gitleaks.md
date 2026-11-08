---
title: Gitleaks
summary: Finds secrets such as keys and tokens in code and git history.
side: both
use: open
docs: https://github.com/gitleaks/gitleaks
alt: trufflehog, trivy
---
## What it's for
Secrets leak into code: an API key committed in haste, a password in a config file. Gitleaks finds them, including in a repository's whole history, where a secret stays even after it's deleted from the current files.

## How it works
It scans file contents against patterns for known secret formats, such as cloud keys and tokens, and against high-entropy strings that look random. Crucially, it walks the entire git history, because removing a secret in a new commit leaves it in every old one. Anyone with the repository can still read it, which is why a leaked secret must be rotated, not just deleted.

## Try it
::: law Your repositories only
Scan code you own or are authorised to review.
:::

```
gitleaks detect --source . --report-path leaks.json
```

Commit a fake key to a test repository, delete it in a later commit, then run Gitleaks and watch it find the key in the history.

## What defenders see
Run it as a pre-commit hook to stop secrets getting in, and in CI as a backstop. When one is found, the first step is always to rotate the secret, since you must assume it's exposed. Then clean the history. [CI/CD attacks](/modules/13-02-cicd-attacks/) covers why leaked pipeline secrets are so damaging.

?! A secret was committed, then removed in the next commit. Why is deleting it not enough, and what must you do?
