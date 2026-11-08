---
title: Studying hands-on, labs, CTFs and write-ups
summary: Practical habits from people who learned this field by doing it, from a time-box for getting stuck to terminal shortcuts, lab notebooks and how to learn from other people's write-ups.
group: Study skills
minutes: 16
source: The GNU Bash manual, commands for manipulating the history | https://www.gnu.org/software/bash/manual/html_node/Commands-For-History.html
---
Security is a hands-on craft. You learn it the way you learn to cook: by doing it badly, noticing why, and doing it again. This guide collects the habits that make lab time count. Most of them come from the culture of CTFs and training platforms; where research backs a habit, it's cited.

## The lab notebook

Keep a notebook *while* you work, not afterwards. Reconstructed notes forget the dead ends, and the dead ends are where most of the learning was.

A useful entry has four parts:

1. **Goal**: one line. "Find why the web server returns 500 on login."
2. **Log**: every command that mattered, with its output or a one-line summary, and the time.
3. **Dead ends**: what you tried that didn't work, and *why* it didn't. Future you will hit the same wall.
4. **Takeaway**: three lines, written from memory at the end. That's retrieval practice, see [How memory works](/guides/s1-how-memory-works/).

Two tools make the log easy:

- `script lab-2026-11-08.log` records everything you type and everything printed until you type `exit` ([man page](https://man7.org/linux/man-pages/man1/script.1.html)).
- [asciinema](https://asciinema.org/) records a terminal session you can replay later, or share in a write-up.

::: tip Name things by date
Name notes and logs `YYYY-MM-DD-topic`. They sort in order, and in six months you'll find "the night I fixed DNS" in seconds.
:::

@term lab notebook = A record kept during hands-on work: the goal, the commands and outputs, the dead ends and the takeaway.

## The time-box: how long to stay stuck

Some struggle helps you learn (see *productive failure* in [How memory works](/guides/s1-how-memory-works/)). Endless struggle doesn't. Use a simple ladder:

| Time stuck | What to do |
|---|---|
| 0 to 20 min | Work it yourself. Reread the task, and check your assumptions one by one |
| 20 to 30 min | Write down exactly what you know and what you've tried. Writing it often reveals the gap |
| 30 min | Take the smallest hint available, for example the first hint here or a nudge from your AI tutor ("don't give the answer, ask me a question") |
| 60 min | Look at the solution, then **close it and redo the task from scratch** without looking |
| Next day | Do it again cold. If you can't, it goes on a flashcard or a review list |

The step people skip is the last one at 60 minutes. Reading a solution feels like understanding. Redoing it without looking is the only way to know.

?? You've been stuck for 70 minutes and finally read the solution. What should you do next?
+ Close the solution and redo the task yourself
- Move straight on, now that you understand it
- Copy the whole solution into your notes, verbatim
- Read three more solutions to similar tasks first
=> Reading a solution builds familiarity, not skill. Redoing the task without looking turns it into retrieval and practice, and tells you whether you really understood.

## Learning from other people's write-ups

Write-ups of retired CTF challenges and machines are one of the best free resources in the field. Two well-known ones are [0xdf's write-ups](https://0xdf.gitlab.io/) and IppSec's videos, which are searchable by technique on [ippsec.rocks](https://ippsec.rocks/).

Use them in this order:

1. **Try first.** At least the time-box above. A write-up read before trying teaches little.
2. **Read one step at a time.** Stop after each step and predict the next one before reading on.
3. **Note the technique, not the answer.** "Checked writable cron scripts" transfers to the next machine. "The password was in /opt/backup" doesn't.
4. **Redo it** on the same box without the write-up.
5. **Write your own.** Explaining it is the final test. See [Write-ups and reports](/guides/h3-write-ups-and-reports/).

::: law Publishing write-ups
Only publish write-ups for retired challenges and machines, and follow each platform's rules. Some, like pwn.college, ask people not to publish solutions at all. Never publish anything about a real system unless its owner has authorised it.
:::

## Terminal habits that save hours

These work in Bash on almost any Linux system:

| Keys or command | What it does |
|---|---|
| <kbd>Ctrl</kbd>+<kbd>R</kbd> | Search your command history as you type. Press it again for older matches |
| <kbd>Tab</kbd>, twice | Complete a name, or list every option if there's more than one |
| `!!` | Repeat the last command, for example `sudo !!` after a "permission denied" |
| `cd -` | Go back to the previous directory |
| <kbd>Ctrl</kbd>+<kbd>A</kbd> / <kbd>Ctrl</kbd>+<kbd>E</kbd> | Jump to the start or end of the line |
| <kbd>Ctrl</kbd>+<kbd>U</kbd> | Delete everything before the cursor |
| `history \| grep ssh` | Find that command you ran last week |
| `man -k word` | Search manual pages by keyword when you don't know the command's name |
| `/word` inside `less` or `man` | Search forward; <kbd>n</kbd> for the next match |
| `command 2>&1 \| tee out.txt` | See the output and save it, errors included |

Sources: the [Bash manual](https://www.gnu.org/software/bash/manual/html_node/Commands-For-History.html) for history, and each tool's `man` page.

Two websites explain commands you meet in the wild: [explainshell.com](https://explainshell.com/) breaks a command into its parts, and [tldr pages](https://tldr.sh/) give short practical examples. Use them to understand, then close them and type the command yourself.

**tmux** keeps your sessions alive when your connection drops, and splits one terminal into panes: notes on the left, the lab on the right ([tmux wiki](https://github.com/tmux/tmux/wiki)).

?? You ran a long command an hour ago and need it again. What's fastest?
+ Press Ctrl+R and type part of the command
- Scroll up through the terminal output for it
- Retype the whole command from your own memory
- Open your notes and search for the command
=> Ctrl+R searches your shell history as you type. It's the single most useful terminal habit, and it works over SSH too.

## Debugging like an analyst

Most lab time is spent on things that don't work. Treat that as practice for the job, not as an obstacle to it:

- **Read the whole error message**, then search for its exact text in quotes.
- **Change one thing at a time.** Two changes at once and you won't know which one fixed it, or which one broke it.
- **Check the boring layers first**: is it running, is it listening, is the firewall open, is the name resolving? The [ports sheet](/sheets/ports/) helps.
- **Write a hypothesis before each test.** "I think DNS fails because the resolver is wrong. If so, `dig @8.8.8.8` will work." This is exactly how incident analysts work.
- **Snapshot your lab VM before risky changes.** Rolling back takes a minute; rebuilding takes an evening.

## A study session that works

For a 60-minute session:

1. **5 min, retrieval.** Before opening anything, write what you remember from last time.
2. **40 min, doing.** A lesson's questions, a terminal mission or a lab, with the notebook open.
3. **10 min, writing.** The notebook's takeaway, from memory, then one flashcard for anything you had to look up twice.
4. **5 min, planning.** Write tomorrow's first task. Starting is the hardest part, so make it obvious.

Then clear [Review](/review/). Short sessions most days beat one long session a week: that's the spacing effect.

## Avoiding "tutorial hell"

Tutorial hell is watching course after course and never building anything alone. The way out:

- **Follow the 2:1 rule** from [The learning system](/guides/j1-the-learning-system/): two hours of hands-on work for every hour of video.
- **Change one thing.** After each tutorial, redo it with one change: another target, another tool, a new log source.
- **Build something nobody asked for.** A script that parses your own logs teaches more than three courses on log parsing.
- **Publish small things.** A one-page write-up a month is proof of skill, and proof for your CV.

@term tutorial hell = Consuming course after course without building anything on your own.

?? Which activity best gets you out of tutorial hell?
+ Redo the last tutorial alone, changing one thing
- Start a new, longer and more advanced course
- Watch the same tutorial again at normal speed
- Collect more bookmarks on topics for later study
=> Redoing the tutorial alone, with one change, is retrieval plus transfer. A new course only moves you deeper into the same pattern.

## Tips and tricks, in short

- **Predict before you press Enter.** Every command, every time. That's the generation effect.
- **Read the source.** RFCs, man pages and vendor docs beat blog posts. The [SANS posters](https://www.sans.org/posters/) are excellent printed summaries.
- **Build your own cheat sheet from your mistakes**, not someone else's. You'll actually read it.
- **Teach it to someone, or to a recording.** If you can't explain it simply, you haven't got it yet.
- **One lab, many angles.** After solving something as an attacker on a legal platform, find the logs it produced and write the detection.
- **Ask good questions in communities**: what you tried, the exact error, and what you expected. People answer those.
- **Stop at a known next step.** End a session mid-task with tomorrow's first command written down, and starting tomorrow is easy.

?! Pick the habit from this guide you're least likely to do on your own. Write how you'll make it automatic, for example by tying it to something you already do every day.

## Go further

- [OverTheWire wargames](https://overthewire.org/wargames/): the classic place to practise these terminal habits.
- [The platforms guide](/guides/e1-platforms/): where to practise legally.
- Previous: [Memorising what must be instant](/guides/s2-memorising-what-must-be-instant/). Next: [Staying in it for two years](/guides/s4-staying-in-it/).
