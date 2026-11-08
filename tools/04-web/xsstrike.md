---
title: XSStrike
summary: Scans for cross-site scripting flaws.
side: attack
use: know
docs: https://github.com/s0md3v/XSStrike
kali: xsstrike
aka: XSSer
alt: zap, burp-suite
---
## What it's for
XSStrike tests web pages for cross-site scripting. Kali also has `xsser`, an older tool for the same purpose. Both turn up in security assessments.

## How it works
It looks at where input is reflected in a page, and in what context: HTML, an attribute or a script. Then it picks tests that suit that context, and checks whether they survive any filtering. The flaw comes from treating data as markup. [XSS in depth](/modules/04-04-xss-in-depth/) explains it.

## Practise safely
Use [PortSwigger's XSS labs](https://portswigger.net/web-security/cross-site-scripting). Then add a strict [Content Security Policy](/modules/04-01-browser-defences-and-csp/) to a small app of your own, and see the browser block an inline script.

## What defenders see
Request logs show many probes in one parameter. Contextual output encoding and frameworks that escape by default are the fix, with CSP as a second layer. CSP reports can even alert you to attempts in production.

?! Why does the same input need different encoding in an HTML body and inside a JavaScript string?
