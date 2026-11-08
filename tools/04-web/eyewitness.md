---
title: EyeWitness
summary: Takes screenshots of many websites, so you can triage them by eye.
side: both
use: own
docs: https://github.com/RedSiege/EyeWitness
kali: eyewitness
aka: gowitness
alt: httpx, nuclei
---
## What it's for
With hundreds of web services to review, reading is slow. EyeWitness, and the newer gowitness, visit each one and take a screenshot, so you can scan them by eye.

## How it works
It drives a headless browser through a list of URLs, saves a picture and the headers for each, then builds an HTML report grouped by similar pages. Human eyes are great at spotting a forgotten admin panel among a grid of screenshots.

## Try it
::: law Your assets only
Use it on hosts you own.
:::

```
eyewitness -f urls.txt -d report --web
```

`-f` is the list and `-d` is the output folder. Open the report, and mark anything you can't explain.

## What defenders see
Each site sees a normal browser visit. As an inventory tool it's a good one for defenders, as old printers and test servers stand out at once.

?! Why is a page of screenshots sometimes better for triage than a table of data?
