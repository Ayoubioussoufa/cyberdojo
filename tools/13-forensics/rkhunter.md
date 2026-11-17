---
title: rkhunter
summary: Checks a Linux system for known rootkits, changed system files and risky settings.
side: defence
use: open
docs: https://rkhunter.sourceforge.net/
aka: chkrootkit
alt: lynis, clamav, osquery
---
## What it's for
A rootkit hides an intruder: it replaces system programs such as `ps` or `ls`, or loads itself into the kernel, so the usual tools stop telling the truth. rkhunter (Rootkit Hunter) and the older chkrootkit look for the traces that known rootkits leave, and for system files that have changed.

## How it works
rkhunter compares system programs with the hashes it recorded earlier, searches for the files and folders known rootkits create, checks for hidden processes and suspicious kernel modules, and reviews settings such as SSH root login. Its value depends on that baseline: record it on a clean system, right after installing, and record it again after every legitimate update.

## Try it
```
sudo rkhunter --propupd
sudo rkhunter --check --sk
sudo rkhunter --check --rwo
sudo chkrootkit
```

`--propupd` records the baseline, `--sk` skips the key presses between sections, and `--rwo` reports warnings only. Read each warning and decide whether it's real.

## What defenders see
Expect false alarms, especially after package updates, which is why the baseline must be refreshed after each legitimate change. Remember the limit, too: a rootkit on a running system can lie to any tool that runs on it, rkhunter included. A finding is strong evidence, but a clean report isn't proof. For a serious suspicion, examine the disk from another system, or the memory with [Volatility](/tools/volatility/), as the [rootkits](/modules/06-07-rootkits-and-bootkits/) module explains.

?! rkhunter warns that `/usr/bin/ps` has changed since its baseline. Name an innocent cause and a dangerous one, and say how you'd tell them apart.
