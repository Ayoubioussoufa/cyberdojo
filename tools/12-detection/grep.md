---
title: grep
summary: Finds the lines that match a pattern in files or in a command's output.
side: both
use: open
docs: https://www.gnu.org/software/grep/manual/grep.html
aka: egrep, zgrep, Select-String
alt: journalctl
---
## What it's for
`grep` prints every line that matches a pattern. It's the most used command in log analysis: failed logins in an auth log, one address across a web server's history, a string inside a pile of files. PowerShell's equivalent is `Select-String`.

## How it works
It reads its input line by line and tests each line against a regular expression. Options change what comes back: `-i` ignores case, `-v` keeps the lines that don't match, `-c` counts, `-n` shows line numbers, `-r` searches a whole folder and `-o` prints only the matching part. `-E` turns on extended expressions, so `+`, `?`, `|` and brackets work without backslashes, and `-F` treats the pattern as plain text, which is faster and avoids surprises with dots. Chained with `sort`, `uniq -c` and `awk`, it becomes a small log-analysis kit.

## Try it
```
grep -c 'Failed password' /var/log/auth.log
grep -Eo '([0-9]{1,3}\.){3}[0-9]{1,3}' /var/log/auth.log | sort | uniq -c | sort -rn | head
grep -rn 'password' --include='*.conf' /etc 2>/dev/null
zgrep 'sshd' /var/log/auth.log.2.gz
grep -v '^#' /etc/ssh/sshd_config | grep -v '^$'
```

The second line pulls every IPv4 address out of the log and ranks them by count. `zgrep` searches compressed, rotated logs. The last line shows only the settings that are really active.

## What defenders see
`grep` is a defender's tool first, and in a SIEM the same idea becomes a query: the [SIEM query languages](/modules/08-01-siem-query-languages/) module maps one to the other. On a compromised host, an attacker running recursive searches for "password" or "key" through home folders and configuration files is hunting for credentials, and command-line logging records it.

?! `grep 'admin' access.log` returns 40,000 lines. How would you narrow it down to failed admin logins from outside your network?
