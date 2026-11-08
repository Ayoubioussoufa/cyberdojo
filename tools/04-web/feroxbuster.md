---
title: feroxbuster
summary: Recursive content discovery written in Rust.
side: both
use: own
docs: https://github.com/epi052/feroxbuster
kali: feroxbuster
alt: ffuf, gobuster
---
## What it's for
feroxbuster finds hidden paths, like [Gobuster](/tools/gobuster/), and goes deeper automatically.

## How it works
Its main feature is recursion. When it finds a folder, it starts scanning inside that folder, so a small starting wordlist can uncover a deep tree. It also filters noise automatically, by detecting pages that behave like a wildcard. It's written in Rust, so it's fast, which means you should set limits.

## Try it
::: law Lab only
Recursion multiplies requests. Use your lab app, with limits.
:::

```
feroxbuster -u http://192.168.56.10:3000 -w /usr/share/seclists/Discovery/Web-Content/common.txt --depth 2 --rate-limit 50
```

`--depth` caps the recursion, and `--rate-limit` caps requests per second.

## What defenders see
Recursive scanning produces a recognisable pattern in logs: one client walking steadily down each folder. Remove unneeded files, and turn off directory listing.

?! Why can recursion multiply a scan's size so quickly? How do you keep it under control?
