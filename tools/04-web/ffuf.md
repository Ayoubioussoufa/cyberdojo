---
title: ffuf
summary: Fast web fuzzer that finds hidden paths, parameters and virtual hosts.
side: both
use: own
docs: https://github.com/ffuf/ffuf
kali: ffuf
alt: gobuster, feroxbuster, wfuzz
---
## What it's for
ffuf finds what a website doesn't link to, such as old folders, backups and admin pages. It's written in Go, and it's very fast.

## How it works
You give it a URL with the word `FUZZ` in it, and a wordlist. It replaces that word with each entry, sends the request, and reports the replies. Most of the skill is in the filtering: a site may answer 200 to everything, so you filter by size, word count or status code. A good wordlist, such as [SecLists](/tools/seclists/), matters more than speed.

## Try it
::: law Lab only
This sends thousands of requests. Use it only on your own lab apps.
:::

```
ffuf -u http://192.168.56.10:3000/FUZZ -w /usr/share/seclists/Discovery/Web-Content/common.txt -mc 200,301,403 -rate 50
```

`-mc` matches status codes, and `-rate` limits requests per second. Then look at each hit, and ask whether it should be public.

## What defenders see
Logs fill with 404s from one address. A WAF or rate limit can slow it down. The real fix is to remove what shouldn't be there: don't deploy backups or `.git` folders, and require a login for admin pages. Hidden isn't protected.

?! A site returns 200 with a "not found" page for every path. How do you filter ffuf's output to find real pages?
