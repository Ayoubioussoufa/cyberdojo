---
title: Plaso
summary: Builds a single timeline from many sources of evidence.
side: defence
use: open
docs: https://plaso.readthedocs.io/
kali: plaso
aka: log2timeline
alt: autopsy, volatility
---
## What it's for
An investigation often comes down to one question: what happened, and in what order? Plaso, run through `log2timeline`, builds a combined timeline from dozens of evidence sources.

## How it works
It has parsers for hundreds of artifact types: file system timestamps, event logs, browser history, registry keys and more. It extracts every timestamped event into one database, which you then filter and sort. A "super timeline" like this can place an intruder's actions in sequence across the whole system, which no single log could do.

## Try it
::: law Your evidence only
Process images you're authorised to examine.
:::

```
log2timeline.py --storage-file case.plaso disk.img
psort.py -o l2tcsv -w timeline.csv case.plaso
```

Then narrow the timeline to the hour you care about, and read the sequence of events.

## What defenders see
A timeline is often the backbone of an incident report. The challenge is volume, so filter to the relevant window and sources. Note that timestamps can be changed by an attacker, which [anti-forensics](/modules/08-09-anti-forensics-and-reporting/) covers, so corroborate across sources.

?! Why is a combined timeline more revealing than reading each log separately?
