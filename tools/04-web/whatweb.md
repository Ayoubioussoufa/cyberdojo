---
title: WhatWeb
summary: Identifies the technology behind a website.
side: both
use: own
docs: https://github.com/urbanadventurer/WhatWeb
kali: whatweb
alt: httpx, wafw00f
---
## What it's for
WhatWeb tells you what a site is built with: its CMS, frameworks, server and libraries. That's useful for an asset inventory, and it tells you which vulnerability advisories matter.

## How it works
Its plugins look for fingerprints in headers, cookies, HTML and file paths. Aggression levels control how many requests it makes: the lowest makes one, and higher ones make more to confirm their guess.

## Try it
::: law Your site only
Use it on your own site or a lab.
:::

```
whatweb -a 1 http://192.168.56.10:3000
```

`-a` sets the aggression level.

## What defenders see
At level 1 it looks like one normal visit. Hiding versions helps a little, though patching matters far more, since scanners often test for a flaw without checking a version first.

?! Removing a version banner is often called "security through obscurity". When does it help, and when doesn't it?
