---
title: dirsearch
summary: A simple web path scanner with a built-in wordlist.
side: both
use: own
docs: https://github.com/maurosoria/dirsearch
kali: dirsearch
aka: dirb
alt: ffuf, gobuster
---
## What it's for
dirsearch finds web paths with almost no setup, since it ships with a sensible wordlist. `dirb` is an older tool that does the same job, and you'll still see its wordlists used.

## How it works
It requests each path, and groups the results by status code. It removes noise by first asking for a page that can't exist, then ignoring replies that look the same. It's slower than Go or Rust tools, but it's convenient.

## Try it
::: law Lab only
Use your own lab app.
:::

```
dirsearch -u http://192.168.56.10:3000 -e php,bak
```

`-e` sets the extensions to try.

## What defenders see
It looks the same as other content discovery tools in logs. Check your deployments for leftovers, such as `.env`, `.git/` and `backup.zip`, and add a test that fails a release if they're reachable.

?! How does asking for a page that can't exist help to reduce false positives?
