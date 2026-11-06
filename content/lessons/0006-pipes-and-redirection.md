---
title: Pipes: from a log to an answer
summary: Join small tools into pipelines and answer a real SOC question with one line.
month: 1
minutes: 35
builds: extract the top attacking IPs from auth.log, a Month 1 exit-gate skill
source: Bash Reference Manual, Pipelines and Redirections | https://www.gnu.org/software/bash/manual/bash.html#Pipelines
words: pipe, redirection, field
---
Here's a real question from a real SOC: *"Which IP address is attacking our server the hardest?"* A beginner opens the log and starts reading. By the end of this lesson, you'll answer it in one line.

@term pipe = The | symbol, which sends one program's output into the next program's input.
@term redirection = Sending a program's output to a file, or reading its input from one, with > >> or <.
@term stdin (standard input) = The stream a program reads its input from.
@term field = One column of text in a line, usually separated by spaces or another character.
@term IP address = A number that identifies a device on a network, such as 203.0.113.7.
@term brute force = Trying many passwords until one works.

## The Unix idea

Decades ago, the designers of Unix made a decision that still shapes computing: [write programs that do one thing well, and make them work together](https://en.wikipedia.org/wiki/Unix_philosophy). Text is the common language between them.

The **pipe**, written `|`, connects them. It takes what one program prints and feeds it to the next.

```
grep "Failed password" auth.log | wc -l
```

`grep` keeps the matching lines, and `wc -l` counts them. Neither knows about the other.

## The tools you'll join

| Tool | Job | Example |
|---|---|---|
| `sort` | Put lines in order | `sort -n` numeric, `-r` reversed |
| `uniq` | Collapse repeated **neighbouring** lines | `uniq -c` adds a count |
| `cut` | Pick columns by a separator | `cut -d: -f1 /etc/passwd` |
| `awk` | Pick columns split on spaces | `awk '{print $11}'` |
| `head` / `tail` | Keep the first or last lines | `head -5` |
| `wc -l` | Count lines | |
| `tr` | Swap or delete characters | `tr a-z A-Z` |

::: trap uniq only compares neighbours
`uniq` doesn't know about the whole file. It only collapses lines that are next to each other, so you nearly always `sort` first. This trips up everyone once.
:::

Let's see it on data. A line of `auth.log` looks like this:

```
Oct 27 03:14:15 web1 sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2
```

Count the words, separated by spaces: `Oct` is field 1, and the IP is field **11**. So `awk '{print $11}'` pulls it out.

## Build the pipeline, one step at a time

Never write the whole line at once. Add one tool, look at the result, then add the next.

```
grep "Failed password" auth.log                  keep failures
... | awk '{print $11}'                          keep only the IP
... | sort                                       group equal IPs together
... | uniq -c                                    count each group
... | sort -rn                                   biggest number first
... | head -5                                    top five
```

The result:

```
     61 203.0.113.7
      9 198.51.100.23
      8 192.0.2.44
```

The shape is always the same: **filter, extract, sort, count, sort, top.** Memorise the shape, not the flags: it works on web logs, DNS logs, firewall logs, anything.

@flow grep: filter > awk: extract > sort: group > uniq -c: count > sort -rn: rank > head: top

?? In that pipeline, what goes wrong if you remove the first `sort`?
+ Equal IPs aren't adjacent, so counts get split
- `uniq` simply refuses to run on unsorted input
- The final `sort` can no longer order anything
- Nothing changes, because `uniq` scans the whole file
=> `uniq -c` counts runs of identical neighbouring lines. Without sorting, one IP appears many times with small counts.

@drill pipeline

## Sending output to a file

Pipes go to programs. **Redirection** goes to files.

| Symbol | Meaning |
|---|---|
| `> file` | Write output to file, **replacing** what's there |
| `>> file` | **Add** to the end of the file |
| `< file` | Read input from the file |
| `2> file` | Write errors to file |
| `2>&1` | Send errors wherever output is going |

::: trap `>` deletes first
The shell empties the file before the command even starts. `sort log.txt > log.txt` leaves you with an empty file. Write to a new name instead.
:::

?? You want to add today's findings to `notes.txt` without losing what's there. Which is right?
+ `grep ALERT app.log >> notes.txt`
- `grep ALERT app.log > notes.txt`
- `grep ALERT app.log < notes.txt`
- `grep ALERT app.log | notes.txt`
=> `>>` appends. `>` would replace the file, `<` reads from it, and `|` needs a program on the right, not a file.

@range pipes

?! Explain the pipeline `grep Failed auth.log | awk '{print $11}' | sort | uniq -c | sort -rn | head -1` to a friend who has never seen a terminal.

## What you can do now

That pipeline is a real exit-gate skill, and it works in interviews too. If you can explain each stage, you've understood more than many people who only copy it.
