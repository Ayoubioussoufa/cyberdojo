---
title: Git and your evidence trail
summary: Track your work with Git, publish it on GitHub without leaking secrets, and write your first public note.
month: 1
minutes: 40
builds: a public cyber-journey repo with real commits and a first write-up
source: Pro Git book, free online | https://git-scm.com/book/en/v2
words: commit, repository, branch
---
Security hiring runs on evidence. Anyone can say "I know Linux". A public history of real work, written up clearly, is hard to fake. **Git** is how you keep that history, and it's also a tool you'll use every working day.

@term Git = A version control system that records the history of changes to files.
@term repository (repo) = A project folder tracked by Git, including its full history.
@term commit = A saved snapshot of your changes, with a message saying why.
@term branch = A separate line of work in a repository.
@term GitHub = A website that hosts Git repositories and helps people work on them together.
@term pull request (PR) = A proposal to merge one branch into another, with a chance to review it.
@term README = The main document of a repository, which explains what it is and how to use it.
@term secret = Sensitive data like a password, API key or private key.

## How Git thinks

Git takes **snapshots**. Each **commit** records the state of your files plus a message. You move work through three stages:

@flow Change files > git add: choose what to save > git commit: save a snapshot > git push: publish it

::: try Do this on your computer or in your Ubuntu VM
```
git config --global user.name "Your Name"
git config --global user.email "you@example.com"

git clone https://github.com/yourname/cyber-journey.git
cd cyber-journey
echo "# My cyber journey" > README.md
git add README.md
git commit -m "Add README with the purpose of this repo"
git push
```
First create the empty repository on [GitHub](https://github.com/new). For pushing, GitHub requires [an SSH key or a token](https://docs.github.com/en/get-started/git-basics/about-remote-repositories), not your password. You already know how to make a key.
:::

## Branches and pull requests

A **branch** lets you work without touching the main line, and a **pull request** asks to merge it. On a team that's where review happens. The roadmap asks you to do this even alone, so that you know the flow.

```
git switch -c add-bandit-notes
# edit, add and commit
git push -u origin add-bandit-notes
```

Then open a pull request on GitHub and merge it.

Write commit messages that say **why**, in the imperative: "Add SSH hardening notes", not "stuff". The exit gate asks for at least 8 meaningful commits, and interviewers do read them.

?? Which commit message would you want an interviewer to read?
+ Add firewall rules with a reason for each
- Update the files again after some small fixes
- Final version of the lab, really done now
- Changes from today after the long lab session
=> It says what changed and hints at why. Vague messages tell a reader nothing.

## Never publish a secret

::: law Git remembers forever
Deleting a password in a later commit doesn't remove it: it's still in the history. If you push a secret, treat it as stolen. Rotate it first, then clean up.
:::

- Keep secrets out of your repo entirely. Add files like `.env` to `.gitignore`.
- From Month 4, run [gitleaks](https://github.com/gitleaks/gitleaks) as a pre-commit hook.
- Never publish Bandit passwords, other people's data, or anything from an employer.

?? You committed an API key and pushed it. You delete it and commit again. Is it safe now?
+ No, it stays in history, so rotate it
- Yes, the newest commit is all people see
- Yes, GitHub deletes old versions after a day
- No, but making the repository private fixes it
=> Anyone could have copied it already, and history keeps it. The key must be replaced. Automated bots scan public repositories for keys constantly.

## Your learning system

Create the vault from [the learning system](/guides/j1-the-learning-system/) and use the [lab note template](/guides/n1-templates/) from today. Write notes **during** a lab, not after.

## Your first write-up

The month's portfolio output is write-up #1, "What Bandit taught me about Linux", with no level spoilers. Use the [write-up template](/guides/n1-templates/), and keep it short. A finished 400 words beats an unfinished 2,000.

## The Month 1 gate

Go to [Month 1 on the roadmap](/roadmap/1/). Tick each box only if you can do it unaided:

- Bandit level 20 or higher, with 70% solved without walkthroughs.
- Explain rwx, SUID, SGID and the sticky bit, and find all SUID binaries with one `find` command.
- A one-liner that extracts the top failed-login source IPs from `auth.log`.
- A lab of two VMs plus snapshots, documented in a README, with 8 or more meaningful commits.

If you miss one, that's useful information. Use the buffer days.

?! Write the first paragraph of your Bandit write-up: what surprised you about Linux?

## What you can do now

You've finished the first month's material. You can move around Linux, find anything, chain tools, reason about permissions and processes, speak the language of risk, run a lab and publish evidence. Next: how data actually moves.
