---
title: Bash scripting
summary: Turn the commands you know into a script, with variables, loops, conditions and exit codes, and write a host audit.
month: 3
minutes: 60
builds: a ShellCheck-clean audit.sh with at least 8 checks
source: Greg's Bash Guide | https://mywiki.wooledge.org/BashGuide
words: variable, exit code, quoting
---
Anything you type twice, you should script. Scripts don't get tired, they don't forget steps, and they turn "I checked the server" into evidence you can run again.

@term script = A text file of commands that the shell runs in order.
@term shebang = The #! first line of a script, naming the program that runs it.
@term variable = A named value that a script can store and reuse.
@term exit code = The number a command returns when it ends. 0 means success.
@term ShellCheck = A tool that finds bugs in shell scripts.

## Your first script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "Audit of $(hostname) on $(date)"
```

Save it as `audit.sh`, run `chmod u+x audit.sh`, then `./audit.sh`. The first line, the **shebang**, says which interpreter to use.

If you've never made one, here is every step. Open an editor with `nano audit.sh`, type the lines above, then save with Ctrl+O and Enter, and leave with Ctrl+X. A script is an ordinary text file: nothing makes it special until you allow it to run, and that's what `chmod u+x` does, as you saw in the permissions lesson. Forget that step and the shell answers `Permission denied`.

The `./` in front matters too. The shell only looks for commands in the folders listed in `$PATH`, and your current folder isn't one of them, so you give the path yourself: "the file `audit.sh`, right here".

Inside the `echo`, `$(hostname)` means "run `hostname` and put what it prints at this spot". The line therefore prints something like `Audit of ubuntu-lab on Sun Nov 15 10:02:11 CET 2026`.

The next line is a safety net, and you should use it in every script:

| Option | Effect |
|---|---|
| `-e` | Stop if a command fails |
| `-u` | Stop on an unset variable, which is usually a typo |
| `-o pipefail` | A pipeline fails if any stage fails, not just the last |

### Terminal, shell and Bash

Three words get mixed up, so pin them down once. The **terminal** is the window you type into; it only shows text. The **shell** is the program inside it that reads what you type and runs it. **Bash** is one particular shell, the usual one on Linux. `sh` is an older, smaller shell language that Bash understands, but `sh` on Debian and Ubuntu is a different program, `dash`, which doesn't know Bash's extras such as `[[ ]]`. That's why a Bash script starts with a Bash shebang and is run as `./audit.sh` or `bash audit.sh`, never `sh audit.sh`. `echo "$SHELL"` shows your login shell.

### What happens when you press Enter

The shell does the same steps for every line, in order, and knowing them explains most surprises:

1. It replaces what it can: `$name` by the variable's value, `$(command)` by that command's output, and patterns such as `*.log` by the matching file names.
2. It splits the result into words on spaces, except inside quotes. This is the step that breaks `rm $file` when the name contains a space.
3. It looks up the first word. A **builtin** such as `cd` or `echo` is part of the shell itself; anything else is searched for in each folder of `$PATH`, in order. `type` tells you which you'll get:

```
$ type cd ls
cd is a shell builtin
ls is /usr/bin/ls
```

4. It runs the command, waits, and keeps its exit code in `$?`. A first word that is neither a builtin nor in `$PATH` gives `lsit: command not found`, which nearly always means a typo or a missing package.

?? What does `set -e` do?
+ It stops the script on failure
- It encrypts the script on disk
- It runs the script as root
- It hides errors from the screen
=> Without it, a script carries on after a failed command, and may do damage.

## Variables and quoting

```bash
name="ana"
log_file="/var/log/auth.log"
count=$(grep -c "Failed" "$log_file")     # capture a command's output
echo "Failures: $count"
```

There are no spaces around `=`. `$(...)` runs a command and captures what it prints.

A script can also take values from the command line. If you run `./audit.sh /var/log/auth.log 5`, then inside the script `$1` is `/var/log/auth.log`, `$2` is `5`, `$#` is the number of arguments (here 2) and `$0` is the script's own name.

```bash
log_file="${1:-/var/log/auth.log}"    # the first argument, or this default if none was given
```

`${1:-something}` reads as "use `$1`, and if it's empty or missing, use `something`". It keeps `set -u` from stopping the script when someone runs it with no arguments.

::: trap Always quote your variables
Write `"$file"`, not `$file`. Without quotes, a value containing a space splits into several arguments. With a value like `*`, it expands to every file. Unquoted variables are the most common Bash bug, and when a script handles untrusted input, they're a security bug.
:::

?? `file="my notes.txt"`, then `rm $file` runs. What happens?
+ It tries to remove `my` and `notes.txt`
- It removes the single file `my notes.txt`
- It refuses to run with unset variables
- It deletes every file in the directory
=> The unquoted variable splits on the space, giving two arguments. `rm "$file"` passes one.

## Exit codes and conditions

Every command returns a number: **0 means success**, anything else means failure. `$?` holds the last one. `if` tests that number:

```bash
if grep -q "PermitRootLogin yes" /etc/ssh/sshd_config; then
    echo "FAIL: root login is enabled"
else
    echo "PASS: root login is off"
fi

if [[ -f /etc/passwd ]]; then echo "file exists"; fi
if [[ "$count" -gt 10 ]]; then echo "many failures"; fi
```

| Test | True when |
|---|---|
| `-f file` | It's a regular file |
| `-d dir` | It's a directory |
| `-z "$x"` | The string is empty |
| `"$a" == "$b"` | Strings are equal |
| `"$a" -gt "$b"` | Number a is greater |

You can watch exit codes in your own terminal. Run a command, then ask for `$?` straight away:

```
$ ls /etc/passwd
/etc/passwd
$ echo $?
0
$ ls /nope
ls: cannot access '/nope': No such file or directory
$ echo $?
2
```

Two short forms use the same number. `a && b` runs `b` only if `a` succeeded, and `a || b` runs `b` only if `a` failed:

```bash
mkdir -p reports && echo "reports folder is ready"
grep -q "^ana:" /etc/passwd || echo "no account called ana"
```

Note that `[[ … ]]` is itself a command. It prints nothing and returns 0 when the test is true, which is the only reason `if` can use it.

### When a script won't run

These are the messages everyone meets in their first week of scripting, exactly as Bash prints them:

| You see | It means | Do this |
|---|---|---|
| `./audit.sh: Permission denied` | The file isn't executable | `chmod u+x audit.sh` |
| `lsit: command not found` | No builtin and nothing in `$PATH` by that name | Check the spelling, or install the tool |
| `/bin/bash^M: bad interpreter: No such file or directory` | The file has Windows line endings, so the shebang ends with an invisible `\r` | Convert it with `sed -i 's/\r$//' audit.sh`, or save as LF in your editor |
| `nmae: unbound variable` | `set -u` caught a variable that was never set, here a typo | Fix the name, or give a default with `${name:-...}` |
| `syntax error: unexpected end of file from 'if' command on line 2` | A block was opened and never closed: here an `if` without `fi` | Close every `if` with `fi`, `do` with `done`, `case` with `esac` |
| `[[: not found` | The script was run by `sh`, which isn't Bash | Run it as `./audit.sh` or `bash audit.sh` |

Older versions of Bash say only `unexpected end of file`, without naming the `if`: the cause is the same.

?? Which exit code means success?
+ Zero, and anything else means failure
- One, and zero means the opposite
- Any positive number below one hundred
- Only the word OK in text
=> `if` tests that number, which is why `grep -q` works inside an `if`.

## Loops and functions

```bash
check_port() {
    local port="$1"
    if ss -tln | grep -q ":$port "; then
        echo "OPEN: $port"
    fi
}

for port in 21 23 3306; do
    check_port "$port"
done

while IFS=: read -r user _ uid _; do
    if [[ "$uid" -eq 0 ]]; then
        echo "UID 0 account: $user"
    fi
done < /etc/passwd
```

`local` keeps a variable inside the function. `IFS=:` splits each line on colons. `read -r` stops backslashes being mangled.

Read the `for` loop as a sentence: "for each value in the list `21 23 3306`, put it in `port` and run the lines between `do` and `done`". It runs three times. Inside the function, `$1` is the first argument given to the function, not to the script, so `check_port 21` sets `port` to 21.

The `while` loop reads a file one line at a time. A line of `/etc/passwd` looks like `root:x:0:0:root:/root:/bin/bash`, with seven fields separated by colons. `read -r user _ uid _` puts the first field in `user`, throws the second away into `_`, puts the third in `uid`, and puts everything left into the last `_`. The `< /etc/passwd` after `done` is what feeds the file into the loop.

When a script does something you don't expect, run it with `bash -x audit.sh`. Bash then prints each command, with its variables already filled in, just before running it. Most bugs become obvious the moment you see the real command.

### What `bash -x` shows you

Here is a three-line script and its trace:

```bash
#!/usr/bin/env bash
file="my notes.txt"
count=$(wc -l < /etc/hostname)
echo "$file has $count lines"
```

```
+ file='my notes.txt'
++ wc -l
+ count=1
+ echo 'my notes.txt has 1 lines'
my notes.txt has 1 lines
```

Each `+` line is a command just before it runs, with the variables already replaced, and `++` marks a command run inside `$(...)`. The quotes Bash adds show you exactly where each argument starts and ends, which is how a quoting bug gives itself away.

### ShellCheck, a second pair of eyes

ShellCheck reads a script without running it and points at the lines that will bite. Give it a script containing `rm $file`:

```
In audit.sh line 3:
rm $file
   ^---^ SC2086 (info): Double quote to prevent globbing and word splitting.

Did you mean:
rm "$file"
```

Every warning has a code such as `SC2086`, and each code has a page on the ShellCheck wiki that explains the problem with examples. Install it with `sudo apt install shellcheck`, run it on every script you write, and treat a warning you don't understand as a lesson, not noise.

?? `grep -q root file` prints nothing. How does a script know whether it matched?
+ It checks the exit code, 0 meaning match
- It reads the output, which is always empty
- It counts all the lines the command printed
- It can't, so `-q` should never be used
=> `-q` means quiet: no output, just the exit code. That's exactly what `if` tests.

## One check, built properly

Every check in an audit has the same shape: look at one thing, print PASS or FAIL, and remember whether anything failed. Write that shape once as a function and each new check becomes a single line.

```bash
#!/usr/bin/env bash
set -euo pipefail

fails=0

check() {
    local name="$1"
    shift
    if "$@" > /dev/null 2>&1; then
        echo "PASS: $name"
    else
        echo "FAIL: $name"
        fails=$((fails + 1))
    fi
}

check "passwd is a regular file" test -f /etc/passwd
check "no telnet service listening" bash -c '! ss -tln | grep -q ":23 "'

echo "$fails check(s) failed"
[[ "$fails" -eq 0 ]]
```

Line by line: `check` takes a name and then a command. `shift` drops the name, so that `"$@"` is the command with all its arguments, each one still safely quoted. `> /dev/null 2>&1` throws away what the command prints, because only its exit code matters here. The last line of the script is a test, so the script itself exits with 0 when nothing failed and 1 when something did. Another program, such as a scheduled job, can then react to your audit without reading its text.

::: trap A counter that kills your script
Many guides count with `((fails++))`. Under `set -e` that line stops your script the first time it runs: `((…))` returns a failure code whenever its result is 0, and `fails++` gives the old value, which is 0. Write `fails=$((fails + 1))`, which is an assignment and always succeeds.
:::

?? In the `check` function, why does the script use `"$@"` and not `$*`?
+ Each argument stays whole, even with spaces
- It runs the command with root rights
- It hides the output of the command
- It makes the function run much faster
=> `"$@"` expands to the arguments one by one, each quoted. `$*` joins them and splits them again on spaces, which is the quoting bug from earlier.

?? The audit script ends with `[[ "$fails" -eq 0 ]]`. What is that last line for?
+ It sets the script's own exit code
- It prints the number of failed checks
- It resets the counter back to zero
- It stops the script from running twice
=> A script exits with the code of its last command. Ending on the test makes the whole audit succeed or fail as one unit.

## Practise the checks

These are the audit checks you'll put in your script. Do each by hand first.

@range audit

## Build audit.sh

::: try Your exit-gate script
Write `audit.sh` with at least 8 checks, each printing PASS or FAIL: UID 0 accounts other than root; SUID files; world-writable paths; listening ports; SSH root login; SSH password authentication; members of the sudo group; pending updates.

Then run [ShellCheck](https://www.shellcheck.net/) until it's clean: `shellcheck audit.sh`.
:::

::: ai Roadmap exercise
Ask an LLM to review your script for bugs and injection risks, then run ShellCheck and compare. Which issues did the AI miss? Which did it invent? Record both in your AI log.
:::

?! Why is a checker that greps the raw `sshd_config` for "PermitRootLogin no" unreliable? How would you fix it?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
