---
title: BeEF
summary: A framework that controls browsers through cross-site scripting.
side: attack
use: know
docs: https://github.com/beefproject/beef/wiki
kali: beef-xss
aka: Browser Exploitation Framework
alt: burp-suite
---
## What it's for
BeEF, the Browser Exploitation Framework, shows how serious a cross-site scripting flaw can be. Testers use it to demonstrate impact, as a popup alone rarely convinces anyone.

## How it works
A browser that runs a BeEF script keeps contacting the BeEF server for instructions, so the browser becomes a client it can control, for as long as the page stays open. It runs inside the browser's sandbox, so its power is limited to what that page's origin allows. That's still plenty: page contents, requests with the user's cookies, and convincing fake prompts.

## Practise safely
Don't hook real browsers. Use [PortSwigger's labs](https://portswigger.net/web-security/cross-site-scripting) to understand XSS, then show the impact on your own lab app with a harmless test. Look at how a strict CSP stops scripts from loading from another origin.

## What defenders see
Traffic shows a page regularly polling an unknown host. CSP stops outside scripts and restricts connections, and `HttpOnly` cookies keep them out of a script's reach. Secure browsing and proxy logs can also catch known hook URLs.

?! Explain why XSS can be serious even if the session cookie is `HttpOnly`.
