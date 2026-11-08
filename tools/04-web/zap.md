---
title: ZAP
summary: A free, open-source web proxy and scanner, ideal for CI.
side: both
use: own
docs: https://www.zaproxy.org/docs/
kali: zaproxy
aka: OWASP ZAP, zaproxy
alt: burp-suite, nikto
---
## What it's for
ZAP, the Zed Attack Proxy, is the leading free web scanner. It's both a proxy, like [Burp](/tools/burp-suite/), and an automated scanner that you can put into a build pipeline.

## How it works
It has two modes of testing. A **passive scan** only reads traffic and reports problems, such as missing headers. An **active scan** sends test requests to find flaws, so it changes state and needs a test environment. A spider finds pages first. The packaged baseline scan runs the spider plus passive checks, which makes it safe enough for most pipelines.

## Try it
::: law Lab only
Active scans can write data and break things. Run them only on your own test site.
:::

```
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://192.168.56.10:3000
```

Read the report, then fix one finding, and run it again.

## What defenders see
An active scan is loud: thousands of requests with test strings, and a recognisable user agent unless it's changed. Use that for your own tuning, and add ZAP to CI, so that problems such as a missing Content Security Policy get caught before release.

?! Why is a baseline scan safe on every pull request when an active scan isn't?
