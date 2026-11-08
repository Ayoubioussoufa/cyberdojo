---
title: osquery
summary: Lets you query a computer's state as if it were a database.
side: defence
use: open
docs: https://osquery.readthedocs.io/
kali: osquery
alt: wazuh, velociraptor
---
## What it's for
osquery, from Facebook, turns a live computer into something you can run SQL against. Want every process with a network connection, or every program that starts at boot? You ask in SQL, across thousands of machines.

## How it works
It presents the operating system as tables: `processes`, `listening_ports`, `users`, `crontab` and many more. A query reads the live state when you run it. A scheduled pack runs queries regularly and records the differences, so you can see what changed. The same query works across Windows, macOS and Linux, which is its great strength.

## Try it
```
osqueryi
SELECT name, path, pid FROM processes WHERE on_disk = 0;
```

That query lists running programs whose file has been deleted, a classic sign of something hiding. Try it on your own machine, then explore the `listening_ports` table.

## What defenders see
This is a hunter's and responder's tool. One query can sweep a fleet for a sign of compromise, such as a known bad path or an unexpected listening port. Protect the configuration, since it reveals what you monitor, and log who runs ad-hoc queries.

?! Why is a running process whose file is missing from disk worth investigating?
