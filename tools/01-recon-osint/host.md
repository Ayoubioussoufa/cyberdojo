---
title: host
summary: Gives a short, readable answer to a DNS question, handy in scripts.
side: both
use: open
docs: https://bind9.readthedocs.io/en/latest/manpages.html
alt: dig, nslookup
---
## What it's for
`host` is the simplest of the BIND lookup tools. Where [dig](/tools/dig/) prints the whole reply, `host` prints one plain sentence per record, such as "example.com mail is handled by 0 .", which is quick to read and easy to use in scripts.

## How it works
By default it looks up a name's A, AAAA and MX records through your resolver. Give it an IP address instead and it does the reverse lookup. `-t` picks one record type, a second argument names the DNS server to ask, and `-v` prints the full reply in a dig-like form when you need the detail. Its exit status is non-zero when a name doesn't exist, which is what makes it useful in scripts.

## Try it
```
host example.com
host -t NS example.com
host -t TXT example.com
host 1.1.1.1
host example.com 9.9.9.9
```

Look up your own domain's NS records, then ask one of those name servers directly with the last form, and compare its answer with your resolver's.

## What defenders see
A single lookup is harmless. One client trying hundreds of names under your domain in a minute is someone guessing subdomains, and a zone transfer request (`-l` asks for one) from an unknown address is someone trying to copy your whole zone. Allow transfers only to your own secondary servers, and watch the DNS server's logs for refused ones.

?! Your script uses `host` to check that a name resolves before connecting. Why might it pass on your laptop but fail on the server, for the same name?
