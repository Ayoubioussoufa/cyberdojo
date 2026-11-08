---
title: dig
summary: Asks DNS servers direct questions and shows their full answers.
side: both
use: open
docs: https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility
alt: whois, dnsrecon
---
## What it's for
`dig` is the standard DNS lookup tool. It comes with BIND, and it's what you reach for to check a record, debug email delivery, or see what a name resolves to.

## How it works
DNS is a tree of delegated zones. `dig` sends one query and prints the whole reply: the question, the answer, the authority section and the flags. By default it asks your configured resolver. With `@server` it asks a server you name, which shows you what that server really says. With `+trace` it starts at the root and follows each delegation down, so you can see where an answer comes from.

## Try it
```
dig example.com A +short
dig example.com MX
dig example.com TXT
dig @1.1.1.1 example.com
dig +trace example.com
dig -x 8.8.8.8
```

`-x` does a reverse lookup. Try the TXT query on your own domain, and find its SPF and DMARC records.

## What defenders see
DNS logs are among a defender's most useful sources. Look for very long names, high volumes of TXT queries and rare domains, which can point to [DNS tunnelling](/modules/01-05-dns-in-depth/). A zone transfer request from an unknown host is a sign of someone mapping your zone, so restrict transfers to your own secondaries.

?! Using `dig`, how would you check whether a mail problem is caused by your resolver or by the authoritative server?
