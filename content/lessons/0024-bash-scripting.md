---
title: Bash scripting
summary: Turn the commands you know into a script, with variables, loops, conditions and exit codes, and write a host audit.
month: 3
minutes: 45
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

The next line is a safety net, and you should use it in every script:

| Option | Effect |
|---|---|
| `-e` | Stop if a command fails |
| `-u` | Stop on an unset variable, which is usually a typo |
| `-o pipefail` | A pipeline fails if any stage fails, not just the last |

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

?? `grep -q root file` prints nothing. How does a script know whether it matched?
+ It checks the exit code, 0 meaning match
- It reads the output, which is always empty
- It counts all the lines the command printed
- It can't, so `-q` should never be used
=> `-q` means quiet: no output, just the exit code. That's exactly what `if` tests.

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
