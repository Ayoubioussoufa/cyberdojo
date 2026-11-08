---
title: subfinder
summary: Finds subdomains quickly from passive sources only.
side: both
use: own
docs: https://docs.projectdiscovery.io/tools/subfinder/overview
kali: subfinder
alt: amass, httpx, theharvester
---
## What it's for
subfinder lists subdomains fast. It does one job, so it fits nicely into a pipeline with other tools, such as [httpx](/tools/httpx/).

## How it works
It queries many passive sources at once, such as certificate logs and DNS datasets, and merges the answers. It never brute-forces, so it's quick and quiet. API keys go in `~/.config/subfinder/provider-config.yaml` and raise both the quality and the rate limits. Since sources disagree and hold old data, a listed name may no longer exist, so always resolve the results before you trust them.

## Try it
::: law Your domain only
Use a domain you own or are authorised to assess.
:::

```
subfinder -d example.com -silent -o subs.txt
httpx -l subs.txt -title -status-code
```

`-silent` prints only the results, which suits a pipe. On Kali, the second command is `httpx-toolkit`.

## What defenders see
Nothing reaches you, so treat its output as a free outside view of your estate. Run it yourself, then ask about every name: who owns it, and should it be public? Certificates for internal names are a classic leak, as they're published in public logs for good.

?! subfinder lists 300 names, but only 120 resolve. Explain why the others appear, and whether they still matter.
