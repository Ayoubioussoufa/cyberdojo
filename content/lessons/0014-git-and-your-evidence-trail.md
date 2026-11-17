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

### Why version control at all

Without it, a project's history is a pile of files called `notes-final.txt`, `notes-final-2.txt` and `notes-final-REALLY.txt`, and nobody knows which one holds what, or why a line changed. Version control replaces that with one folder and a complete, dated list of every change, who made it and why. You can see any earlier state, compare two of them, and undo a mistake without losing the work since. Git is the version control system almost everyone uses, and GitHub is a website that stores Git repositories online. They're different things: Git runs on your computer, with or without GitHub.

### The three places your files live

Everything about Git makes sense once you see that each file can be in three places:

| Place | What it is | How a file gets there |
|---|---|---|
| Working folder | The files you see and edit, like any folder | You edit them |
| Staging area | A waiting room for the changes you'll save next | `git add` |
| Repository | The saved history, kept in the hidden `.git` folder | `git commit` |

The staging area is the part that surprises beginners. It lets you choose: you changed five files, but only two belong in this snapshot, so you `git add` those two and commit them with a message that fits. Delete the `.git` folder and the history is gone, while your files remain as a plain folder.

### Your first repository, from zero

Before GitHub, do it once on your own computer, in an empty folder. `git init` turns the folder into a repository:

```
git init -b main notes
cd notes
echo "# Lab notes" > README.md
git status
```

```
On branch main

No commits yet

Untracked files:
  (use "git add <file>..." to include in what will be committed)
	README.md

nothing added to commit but untracked files present (use "git add" to track)
```

Read `git status` as Git talking to you. *Untracked* means Git sees the file but has never been asked to look after it, and the line in brackets even tells you the next command. Run `git add README.md` and `git status` again: the file moves under `Changes to be committed`, which is the staging area. Now save the snapshot:

```
git commit -m "Add README"
```

```
[main (root-commit) 198c634] Add README
 1 file changed, 1 insertion(+)
 create mode 100644 README.md
```

`198c634` is the start of the commit's ID, a hash of its contents. Add a line to the file, then ask what changed with `git diff`:

```
@@ -1 +1,2 @@
 # Lab notes
+Day 1: installed Ubuntu
```

Lines starting with `+` were added and lines with `-` removed. Commit again with `git commit -am "Note day 1"` (`-a` stages every file Git already tracks), and `git log --oneline` lists your history, newest first:

```
b47ac32 Note day 1
198c634 Add README
```

### Undoing things

Each kind of mistake has its own undo, and the safe ones never rewrite history:

| You want to | Command |
|---|---|
| Throw away edits to a file you haven't staged | `git restore FILE` |
| Take a file back out of the staging area | `git restore --staged FILE` |
| Fix the message of the commit you just made, before pushing | `git commit --amend` |
| Cancel a commit that's already pushed | `git revert HASH` |

`git revert` doesn't delete anything: it adds a new commit that does the opposite, so the history stays honest and others' copies stay valid. Commands such as `git reset --hard` or `git push --force` do rewrite history; leave them until you know exactly what they'll throw away.

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

### Connecting your computer to GitHub

GitHub stopped accepting account passwords for Git in 2021, so you prove who you are with an SSH key, the same kind you met in the SSH lesson. Create one if you don't have it, and copy the **public** half:

```
ssh-keygen -t ed25519 -C "you@example.com"
cat ~/.ssh/id_ed25519.pub
```

Paste that line into GitHub under Settings, then SSH and GPG keys. Test it with `ssh -T git@github.com`: GitHub answers that you've successfully authenticated but that it doesn't provide shell access, which is the expected reply. Then use the repository's SSH address, the one that starts with `git@github.com:`. `git remote -v` shows which address your repository uses, under the name `origin`, the default name for the copy you cloned from.

?? What's the difference between `git commit` and `git push`?
+ Commit saves locally, and push publishes it
- Commit publishes it, and push saves locally
- They're two names for the same action
- Commit deletes files, and push restores them
=> A commit is a snapshot on your machine. Nothing reaches GitHub until you push.

## Branches and pull requests

A **branch** lets you work without touching the main line, and a **pull request** asks to merge it. On a team that's where review happens. The roadmap asks you to do this even alone, so that you know the flow.

```
git switch -c add-bandit-notes
# edit, add and commit
git push -u origin add-bandit-notes
```

Then open a pull request on GitHub and merge it.

Write commit messages that say **why**, in the imperative: "Add SSH hardening notes", not "stuff". The exit gate asks for at least 8 meaningful commits, and interviewers do read them.

### What a branch really is

A branch isn't a copy of your files. It's a label that points at one commit, and that moves forward each time you commit on it. `main` is just the first label. `git switch -c firewall` creates a new label where you stand and moves you onto it, so new commits go there and `main` stays where it was. `git log --oneline --graph --all` draws the result:

```
* 12b4bdf Note the firewall rule
| * 8204eb7 Note the web port
|/
* b47ac32 Note day 1
* 198c634 Add README
```

Two lines of work grew from `b47ac32`: the firewall note on one branch, the web port on `main`.

### Merging, and your first conflict

`git merge firewall`, run on `main`, brings that branch's commits in. When the two branches changed different lines, Git combines them by itself. When both changed the *same* line, Git can't guess which you want, and stops:

```
Auto-merging README.md
CONFLICT (content): Merge conflict in README.md
Automatic merge failed; fix conflicts and then commit the result.
```

Nothing is lost. Git writes both versions into the file between markers:

```
<<<<<<< HEAD
Firewall: allow 22 and 443
=======
Firewall: allow 22 only
>>>>>>> firewall
```

Above `=======` is your current branch (`HEAD`), below it is the branch you're merging. Edit the file to say what's actually true, delete the three marker lines, then `git add README.md` and `git commit`. If you'd rather think first, `git merge --abort` puts everything back as it was before the merge.

### When Git refuses

Git's error messages usually say what to do next, if you read them to the end:

| You see | It means | Do this |
|---|---|---|
| `fatal: not a git repository` | You're in a folder that isn't a repository | `cd` into it, or run `git init` |
| `Please tell me who you are.` | Git doesn't know your name for the commit | The two `git config --global` lines above |
| `! [rejected] main -> main (fetch first)` | The remote has commits you don't have yet | `git pull`, deal with any conflict, then push again |
| `Support for password authentication was removed` | GitHub refused your password | Use an SSH key and the `git@github.com:` address |
| `CONFLICT (content): Merge conflict in FILE` | Both sides changed the same lines | Edit the file, remove the markers, `git add`, `git commit` |
| `You are in 'detached HEAD' state` | You checked out a commit, not a branch | `git switch main`, or `git switch -c NEW` to keep work |

The rejected push is the one you'll meet first, the day you work from two computers: the remote has a commit the other one pushed. Never "fix" it with `--force`, which deletes that commit from the remote.

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

### `.gitignore`, in practice

`.gitignore` is a plain text file at the top of the repository, with one pattern per line. Git acts as if matching files don't exist:

```
.env
*.log
```

With that file in place, a `.env` holding `API_KEY=abc` no longer appears in `git status` at all, so `git add .` can't sweep it in. `git check-ignore -v .env` tells you which rule hides a file:

```
.gitignore:1:.env	.env
```

Two limits matter. `.gitignore` only works for files Git doesn't track yet: a file that's already committed stays tracked until you `git rm --cached` it. And it's a convenience, not a guarantee, which is why a scanner such as gitleaks runs before each commit too.

?? You committed an API key and pushed it. You delete it and commit again. Is it safe now?
+ No, it stays in history, so rotate it
- Yes, the newest commit is all people see
- Yes, GitHub deletes old versions after a day
- No, but making the repository private fixes it
=> Anyone could have copied it already, and history keeps it. The key must be replaced. Automated bots scan public repositories for keys constantly.

## Your learning system

Create the vault from [the learning system](/guides/j1-the-learning-system/) and use the [lab note template](/guides/n1-templates/) from today. Write notes **during** a lab, not after.

?? When should you write your lab notes?
+ During the lab, while it's still happening
- A week later, when you've had time
- Only when something goes badly wrong there
- Never, because commands stay in your history
=> Notes written afterwards leave out the mistakes, and those are what teach you most.

## Your first write-up

The month's portfolio output is write-up #1, "What Bandit taught me about Linux", with no level spoilers. Use the [write-up template](/guides/n1-templates/), and keep it short. A finished 400 words beats an unfinished 2,000.

?? Which rule applies to a write-up of a wargame?
+ Share what you learned, with no level spoilers
- Publish each password so that readers can check
- Copy the fullest walkthrough that you can find
- Keep writing until it's at least 5,000 words
=> OverTheWire's rules forbid publishing credentials, and a short finished piece beats a long unfinished one.

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
