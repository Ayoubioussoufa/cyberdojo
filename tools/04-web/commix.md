---
title: Commix
summary: Automates testing for OS command injection.
side: attack
use: know
docs: https://github.com/commixproject/commix
kali: commix
alt: sqlmap, burp-suite
---
## What it's for
Commix does for command injection what sqlmap does for SQL injection. It tests whether a parameter reaches a system shell. You'll see it in penetration test reports.

## How it works
It tries many forms of input, and watches for evidence that a command ran, through the output, a time delay, or a side effect. The root cause is an application passing user input to a shell. [Injection beyond SQL](/modules/04-03-injection-beyond-sql/) covers this flaw.

## Practise safely
Practise on [PortSwigger's OS command injection labs](https://portswigger.net/web-security/os-command-injection). Then find a place in your own code that starts a process, and rewrite it to pass arguments as a list, without a shell.

## What defenders see
Look for shell metacharacters in request logs, and for a web process starting `sh`, `cmd` or `curl`. EDR catches this last sign well. Fix it by not calling a shell, and by running the app as a low-privilege user.

?! Why is "a web server process starting a shell" a stronger signal than any request pattern?
