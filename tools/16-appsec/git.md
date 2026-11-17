---
title: git
summary: Tracks every change to a project's files, and who made it.
side: both
use: open
docs: https://git-scm.com/docs
alt: gitleaks, trufflehog
---
## What it's for
Git records the history of a project: every change, its author, its date and a message saying why. Every piece of code you write in this course lives in it, and in security it matters twice over: history is evidence, and history leaks. A secret committed once stays in the history even after the file is fixed.

## How it works
A repository is a database of snapshots, called commits, each identified by a hash of its content and of its parent, so history can't be changed quietly: changing an old commit changes every hash after it. `git add` stages changes, `git commit` records them, and `git push` sends commits to a remote such as GitHub. The author's name and email are whatever the committer configured, so they prove nothing unless commits are signed.

## Try it
```
git log --oneline --graph -15
git show HASH
git log -p -S 'password' --all
git blame config.py
git log --show-signature -3
```

`-S` finds every commit that added or removed a string, here a word that should never be committed. `blame` shows who last changed each line of a file.

## What defenders see
Credentials leaked in repositories are among the most common causes of breaches. Scan the whole history with [Gitleaks](/tools/gitleaks/) or [TruffleHog](/tools/trufflehog/), not just the current files, and when a secret has been pushed, revoke it: rewriting history doesn't help once others have cloned it. Protect the main branch, require reviews, and sign commits so authors can be trusted. The [CI/CD attacks](/modules/13-02-cicd-attacks/) module covers the pipeline side.

?! You remove an API key from `config.py` and commit the fix. Why is the key still exposed, and what are the two steps you must take?
