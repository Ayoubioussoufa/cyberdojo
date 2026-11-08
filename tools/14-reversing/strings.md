---
title: strings
summary: Prints the readable text inside a binary file.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/strings.1.html
kali: binutils
alt: binwalk, floss
---
## What it's for
`strings` is the simplest reverse-engineering tool, and often the first one you run. It prints the sequences of readable characters in a file, which can instantly reveal URLs, messages, file paths and commands inside a program.

## How it works
It scans a file for runs of printable characters above a minimum length, and prints them. A program's code isn't readable this way, but the text it uses often is: an error message, a web address it contacts, a registry key it sets. So a few seconds with `strings` can give you a first idea of what an unknown file does.

## Try it
::: law Lab only
Examine suspicious files only in an isolated VM.
:::

```
strings -n 8 program | less
strings -e l program
```

`-n` sets the minimum length, and `-e l` reads wide characters, common in Windows binaries. Run it on a program, and look for web addresses or messages.

## What defenders see
For triage, `strings` is invaluable: a suspicious file's embedded addresses and commands become indicators you can search for elsewhere. Attackers know this, so they obfuscate or encrypt their strings, and a binary with almost no readable strings is itself a small warning sign. The tool `floss` recovers many obfuscated strings automatically.

?! A suspicious file returns almost no readable strings. Why might that itself be a clue?
