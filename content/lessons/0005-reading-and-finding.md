---
title: Reading files and finding anything
summary: Read files of any size, search inside them with grep, search for them with find, and use the manual instead of guessing.
month: 1
minutes: 30
builds: find a needle in a 5,000-line log and locate any file on a disk
source: GNU grep manual | https://www.gnu.org/software/grep/manual/grep.html
words: grep, stdout, stderr
---
Servers don't have a pretty window showing what happened. They have text files, sometimes millions of lines long. This lesson gives you the tools to reduce a mountain of text to the three lines that matter.

@term grep = A command that prints only the lines of text matching a pattern.
@term find = A command that searches a directory tree for files by name, size, owner and more.
@term man page (manual page) = The built-in documentation for a command, opened with man.
@term stdout (standard output) = The stream where a program writes its normal results.
@term stderr (standard error) = The separate stream where a program writes errors and warnings.
@term log = A file where a system records events as they happen.
@term regular expression (regex) = A pattern language for matching text, used by grep and many tools.

## Looking at files

| Command | What it does | When to use it |
|---|---|---|
| `cat file` | Print the whole file | Short files |
| `less file` | Scroll through it, `q` to quit | Long files, on a real machine |
| `head -n 20 file` | First 20 lines | See the format of a log |
| `tail -n 20 file` | Last 20 lines | See the newest entries |
| `tail -f file` | Keep showing new lines as they arrive | Watch a log live, on a real machine |
| `wc -l file` | Count lines | How big is this? |

## The manual: your first primary source

Every standard command has a **manual page**. Type `man grep`. It's dense, and you don't need to read it all: look at the name, the synopsis, and the option you're after.

::: key Read the manual before you guess
The roadmap's first practical skill is "read man pages instead of guessing". It matters more than any single command, because it's how you verify AI too. If an AI suggests a flag, `man` tells you whether it exists.
:::

## grep: search inside files

`grep` prints the lines that match. That's all it does, and it's one of the most used tools in security.

```
grep "Failed password" /var/log/auth.log     lines containing that text
grep -i error app.log                        ignore upper and lower case
grep -v heartbeat app.log                    lines NOT containing it
grep -c ALERT app.log                        just count them
grep -n root /etc/passwd                     show line numbers
grep -r password /etc/app                    search a whole folder
```

Quote your pattern when it has spaces. Otherwise the shell splits it into separate arguments.

?? You want every line in `app.log` except the thousands of `heartbeat` lines. Which command?
+ `grep -v heartbeat app.log`
- `grep -c heartbeat app.log`
- `grep -i heartbeat app.log`
- `grep -n heartbeat app.log`
=> `-v` inverts the match. Removing noise is often as useful as finding signal.

### A taste of patterns

grep's pattern is a **regular expression**, a tiny language for describing text:

| Pattern | Matches |
|---|---|
| `^root` | Lines starting with root |
| `bash$` | Lines ending with bash |
| `[0-9]` | Any one digit |
| `.` | Any one character |
| `a.*z` | a, then anything, then z |

You'll use more of this in Month 4. For now `^` and `$` already make you dangerous: `grep "^root:" /etc/passwd`.

## find: search for files

`grep` looks inside files. `find` looks for the files themselves, walking down a tree.

```
find /etc -name "*.conf"             by name, * means anything
find /home -type d                   directories only
find /var -size +10M                 larger than 10 MB
find / -user sam                     owned by sam
find /opt -name keys.bak -exec cat {} \;     run a command on each result
```

The pattern is `find WHERE WHAT`. Quote names that contain `*`, so that `find` gets the star rather than the shell.

@term wildcard (glob) = A * or ? in a command, which the shell expands into matching file names.

?? Which command finds files named `report.pdf` anywhere under `/home`?
+ `find /home -name report.pdf`
- `grep report.pdf /home`
- `ls report.pdf /home`
- `cat /home/report.pdf`
=> `find` searches for files by their properties. `grep` searches the text inside files, and it would complain that `/home` is a directory.

## Two output streams

Run `find /` as a normal user and you'll see hundreds of `Permission denied` lines mixed in with your results. Here's why that's fixable.

Every program has two separate output streams. **stdout** carries results, and **stderr** carries errors. Both appear on your screen by default, but you can redirect them separately. `2>` means "send stream number 2, the errors, somewhere else", and `/dev/null` is a special file that throws away whatever it gets:

```
find / -name pass.txt 2>/dev/null
```

Now you see only results. You'll use this every day.

@term /dev/null = A special file that discards everything written to it.

@range find-things

?! A colleague says "grep and find do the same thing". Correct them in two sentences.

## What you can do now

You can pull one line out of thousands and find any file on a disk. Next, you'll chain these tools together, and that's where the real power starts.
