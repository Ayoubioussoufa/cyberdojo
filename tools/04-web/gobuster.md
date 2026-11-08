---
title: Gobuster
summary: Brute-forces web paths, DNS names and virtual hosts from a wordlist.
side: both
use: own
docs: https://github.com/OJ/gobuster
kali: gobuster
alt: ffuf, feroxbuster
---
## What it's for
Gobuster is a simple tool that tries each word from a list, in one of several modes. Beginners often start with it, since its modes are easy to understand.

## How it works
Each mode answers a different question. `dir` looks for paths on a site, `dns` looks for subdomains, and `vhost` looks for virtual hosts on one IP. It runs many workers in parallel, so it's quick, and it's a single Go binary. It's simpler than [ffuf](/tools/ffuf/), which gives you more control over where the word goes.

## Try it
::: law Lab only
Run it on your own lab app, and keep the thread count low.
:::

```
gobuster dir -u http://192.168.56.10:3000 -w /usr/share/wordlists/dirb/common.txt -t 10
```

`-t` sets the number of threads. Add `-x php,bak` to try file extensions too.

## What defenders see
Its default user agent names the tool, and it produces a stream of 404s from one source. Rate limiting and WAF rules catch it. Check your own server with it, and look for backups and test pages.

?! Which mode would find a staging site hosted on the same IP as production, and why?
