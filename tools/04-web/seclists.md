---
title: SecLists
summary: The standard collection of wordlists for security testing.
side: both
use: open
docs: https://github.com/danielmiessler/SecLists
kali: seclists
alt: ffuf, gobuster
---
## What it's for
SecLists isn't a program; it's the collection of lists that other tools read. Usernames, passwords, web paths, payloads and patterns, all gathered in one place. Nearly every discovery tool points at it.

## How it works
It's organised by purpose: `Discovery/Web-Content` for paths, `Usernames`, `Passwords`, `Fuzzing` and more. A tool such as [ffuf](/tools/ffuf/) tries each line in turn. The quality and fit of the list matters more than the tool's speed: a list aimed at the target's technology finds far more than a huge generic one. On Kali it installs to `/usr/share/seclists`.

## Try it
::: law Lab only
These feed tools that send many requests. Point them only at your own lab.
:::

```
ls /usr/share/seclists/Discovery/Web-Content/ | head
wc -l /usr/share/seclists/Discovery/Web-Content/common.txt
```

Look at a small list, and see what paths it would try. Choosing the right list is a skill in itself.

## What defenders see
Defenders use the same lists in reverse. The common-password lists show what to block, and the web-content lists show which paths to expect probes against. Knowing what's in a standard list helps you read your own logs.

?! Why does the choice of wordlist often matter more than the speed of the tool reading it?
