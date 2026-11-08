---
title: curl
summary: Makes web requests from the command line, showing exactly what's sent.
side: both
use: open
docs: https://curl.se/docs/manpage.html
kali: curl
alt: httpx, burp-suite
---
## What it's for
curl is the everyday tool for talking to web servers and APIs. Administrators, developers and analysts all use it, as it shows exactly what happens in a request.

## How it works
It's a client for many protocols, built on libcurl, which also runs inside countless products. Unlike a browser, it doesn't run scripts, keep cookies unless told to, or follow redirects by default. So what you see is the server's actual reply, which makes it good for checking headers or testing a fix.

## Try it
```
curl -i https://example.com
curl -v https://example.com -o /dev/null
curl -s -X POST https://example.com/api -H 'Content-Type: application/json' -d '{"a":1}'
```

`-i` shows headers, `-v` shows the TLS handshake and request, and `-d` sends a body. Check your own site's security headers with the first command.

## What defenders see
Attackers use `curl` to fetch tools, and to send data out, so it's on the [living off the land](/modules/06-03-living-off-the-land/) lists. Watch for `curl` piped into a shell, or started by a web server process. On Windows, `curl.exe` now ships with the system.

?! A web server process starts `curl`. Why is that unusual, and what would you check next?
