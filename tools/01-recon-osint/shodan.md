---
title: Shodan
summary: A search engine for Internet-connected devices and the banners they expose.
side: both
use: own
docs: https://help.shodan.io/
alt: censys
---
## What it's for
Google indexes web pages, and Shodan indexes services. It shows which devices answer on the Internet, and what they say. Defenders use it to find their own exposed services, often before attackers do.

## How it works
Shodan's crawlers continuously scan the Internet, connect to open ports, and save each service's banner with its location, organisation and certificate data. You search that stored data, so your query sends nothing to the target. Results can be days old. Filters narrow a search, such as `org:`, `net:`, `port:` and `ssl.cert.subject.cn:`.

## Try it
::: law Look, don't touch
Searching is legal in most places, but connecting to a device you find isn't. Only examine your own ranges.
:::

```
shodan init YOUR_API_KEY
shodan host 203.0.113.10
```

In the web interface, search `net:203.0.113.0/24` with your own range. Shodan Monitor can alert you when something new appears there.

## What defenders see
You'll see Shodan's scanners in firewall logs, which is normal Internet noise. What matters is what they found: remote desktop, databases and admin panels should never be open to all. A CVE on your edge device plus a Shodan listing means you should move quickly.

?! Your Shodan results show an old database port on one of your addresses, but your firewall team says it's closed. How do you work out who's right?
