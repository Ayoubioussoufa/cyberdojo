---
title: Lynis
summary: Audits a Linux or Unix system and scores its hardening.
side: defence
use: open
docs: https://cisofy.com/lynis/
kali: lynis
alt: openscap, nmap
---
## What it's for
Lynis checks how well a Linux or Unix system is hardened. You run it on the machine itself, and it produces a long list of findings and a hardening score. It's a great first step when securing a server.

## How it works
It's a shell script, so it needs nothing installed. It runs hundreds of tests against the live system: file permissions, running services, SSH settings, firewall state and installed software. Each test gives a suggestion or a warning, and it gathers these into a report. Because it runs locally with full visibility, it sees far more than a network scan can.

## Try it
```
sudo lynis audit system
```

Read the suggestions at the end, pick three, and apply them. Then run it again, and watch the score rise. Keep the report, so you can show the improvement.

## What defenders see
This is a defender's tool for your own systems. Don't chase a perfect score, since some suggestions won't fit your needs; decide which matter and record why. Run it regularly, or from a pipeline, so that drift gets caught. [Project 1](/projects/) uses it on the server you harden.

?! Why shouldn't you blindly apply every suggestion a hardening tool makes? How do you decide which to act on?
