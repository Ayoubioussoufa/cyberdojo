---
title: wfuzz
summary: Web fuzzer that can target any part of a request.
side: both
use: own
docs: https://wfuzz.readthedocs.io/
kali: wfuzz
alt: ffuf
---
## What it's for
wfuzz replaces a marker in a request with values from a list. It's older than [ffuf](/tools/ffuf/), and it's still common in guides and courses.

## How it works
You place `FUZZ` anywhere: in the path, a header, a cookie or the body. It's written in Python, with plugins for encoders and payloads, so it's flexible but slower. Filters such as `--hc` hide replies by status code.

## Try it
::: law Lab only
Use your own lab app.
:::

```
wfuzz -c -z file,words.txt --hc 404 http://192.168.56.10:3000/FUZZ
```

`-z` gives the payload source, and `--hc` hides 404s.

## What defenders see
Look for many near-identical requests from one client. Application-level rate limits on sensitive endpoints, such as login, matter most, and they work whichever tool is used.

?! Which endpoints in a typical web app deserve the strictest rate limits, and why?
