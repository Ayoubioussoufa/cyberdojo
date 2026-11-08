---
title: Burp Suite
summary: The standard intercepting proxy for testing web applications.
side: both
use: own
docs: https://portswigger.net/burp/documentation
kali: burpsuite
aka: Burp
alt: zap, mitmproxy, caido
---
## What it's for
Burp Suite sits between your browser and a web app, so you can see and change each request. It's in Kali's top 10 because almost every web test runs through it. The free Community edition does most of what a learner needs.

## How it works
It's an HTTP proxy. Your browser sends traffic to Burp on port 8080, and Burp forwards it on. To read HTTPS, Burp makes its own certificate for each site, so you install its CA in the browser you test with. **Proxy** records traffic, **Repeater** lets you edit and resend a request, and **Intruder** automates many variations, slowly in the free edition. The paid edition adds a scanner. [The testing workflow](/modules/04-13-testing-workflow-burp/) shows how they fit together.

## Try it
::: law Lab only
Test OWASP Juice Shop on your own machine, or [PortSwigger's free labs](https://portswigger.net/web-security). Those labs are built for this.
:::

Install Burp's CA in a separate browser profile, not your everyday one. Set a target scope so that you only record your lab. Log in to Juice Shop, send the login request to Repeater, change one field, and read how the reply differs.

## What defenders see
To a server, Burp looks like a browser, so one request reveals nothing. Automated use shows as many similar requests, or as parameters full of test strings, which a WAF and application logs both catch. Server-side checks are the real defence, as anything in a client can be changed.

?! Why does Burp need its own CA certificate in your browser? What's the risk of leaving it installed in your daily browser?
