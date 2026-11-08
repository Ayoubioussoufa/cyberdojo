---
title: Google dorks
summary: Uses advanced search operators to find exposed files and pages.
side: both
use: own
docs: https://www.exploit-db.com/google-hacking-database
aka: Google hacking, dorking
alt: shodan, theharvester
---
## What it's for
A dork is a search that uses operators to find things that shouldn't be public, such as backup files or open directories. It needs no special tools, and attackers and auditors both use it.

## How it works
Search engines index whatever they can reach. Operators narrow the results to one site, file type, or word in a URL. The [Google Hacking Database](https://www.exploit-db.com/google-hacking-database) collects useful patterns. Nothing is hacked: you're reading the index, which is why a defender should do this first.

## Try it
::: law Your domain only
Search your own site. Opening a sensitive file you find elsewhere may count as unauthorised access, even without a password.
:::

```
site:example.com filetype:pdf
site:example.com inurl:admin
site:example.com intitle:"index of"
```

These go in the search box, not a terminal.

## What defenders see
You'll see nothing, because the search happens at Google. Prevent it by requiring authentication and turning off directory listing. Robots rules aren't a security control, since they ask politely and publish the paths. Request removal for anything indexed by mistake, and rotate any secret that was exposed.

?! Why is `robots.txt` the wrong way to hide an admin page?
