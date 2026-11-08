---
title: Caido
summary: A lightweight web proxy, a newer alternative to Burp.
side: both
use: own
docs: https://docs.caido.io/
alt: burp-suite, zap
---
## What it's for
Caido is a web security proxy written in Rust. It's a newer alternative to [Burp Suite](/tools/burp-suite/), and it's popular with bug bounty hunters who want something lighter.

## How it works
It works like other intercepting proxies, with a local CA for HTTPS, a history of requests, and a replay feature. Its own query language filters traffic, and its workflows automate small tasks. The design separates a backend from its interface, so one can run on a remote machine.

## Try it
::: law Lab only
Use it on your own lab apps, or on bug bounty targets strictly within their published scope.
:::

Install it, add its CA to a test browser profile, and browse Juice Shop. Use the search to find every request with a parameter named `id`. Then replay one with a changed value, and see whether the app checks who owns the record.

## What defenders see
To the server, it's normal browser traffic. Authorisation checks on the server are what stop a changed `id`, which is the flaw called broken access control. Logs of one user reaching many records help you spot this kind of testing.

?! You change `id=41` to `id=42` and see someone else's order. Name the flaw, and explain where the fix belongs.
