---
title: awk
summary: Splits lines into fields, and prints, counts or adds up the ones you choose.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/gawk.1.html
aka: gawk
alt: grep, sed, jq
---
## What it's for
Logs are lines, and each line is fields separated by spaces: an address, a date, a request, a status. `awk` picks fields out by position and does arithmetic on them, so "which addresses made the most requests?" or "how many bytes did each one download?" becomes a single line.

## How it works
`awk` reads each line, splits it into fields `$1`, `$2` and so on (`$0` is the whole line and `NF` the number of fields), and runs your program on it. A program is a list of `pattern { action }` pairs, and an action runs on the lines that match its pattern. `-F` changes the separator. Variables and arrays need no declaring, and an `END { }` block runs after the last line, which is where totals get printed.

## Try it
```
awk '{print $1}' access.log | sort | uniq -c | sort -rn | head
awk '$9 >= 500 {print $7}' access.log
awk -F: '$3 == 0 {print $1}' /etc/passwd
awk '{bytes[$1] += $10} END {for (ip in bytes) print bytes[ip], ip}' access.log | sort -rn | head
```

In a standard web server access log, field 1 is the client's address, 7 the path, 9 the status and 10 the bytes sent. The third line lists every account with user ID 0, which should be root alone.

## What defenders see
`awk` is how you get from raw logs to a first answer during an incident, before any SIEM is set up. The `/etc/passwd` check above is a classic: a second account with user ID 0 is a hidden root account. Mind the field numbers, since a log format with one extra field shifts everything, so check one line by eye first.

?! Your `awk '{print $9}'` on a web log prints dates instead of status codes. What's the likely cause, and how do you check?
