---
title: nslookup
summary: Looks up DNS records from the command line, on Windows, macOS and Linux alike.
side: both
use: open
docs: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup
alt: dig, host
---
## What it's for
`nslookup` asks a DNS server what a name resolves to. It ships with Windows, so on a Windows machine it's usually the first DNS tool at hand. On Linux and macOS it comes with the BIND utilities, next to [dig](/tools/dig/) and [host](/tools/host/).

## How it works
It sends a query to your configured resolver, or to the server you name as the last argument, and prints the answer. "Non-authoritative answer" means the reply came from a resolver's cache, not from the zone's own server. `-type=` picks the record type; run `nslookup` with no arguments for an interactive mode where `set type=MX` does the same. Its output hides the flags and the authority section that `dig` shows, so for deep debugging, prefer `dig`.

## Try it
```
nslookup example.com
nslookup -type=MX example.com
nslookup -type=TXT example.com 1.1.1.1
nslookup 8.8.8.8
```

The last line is a reverse lookup: give it an address and get a name back. Compare the answer from your own resolver with the one from `1.1.1.1` for the same name.

## What defenders see
On Windows, `nslookup` is part of the discovery burst that often follows an intrusion: an attacker uses it to find domain controllers and internal names, for example with an SRV query for `_ldap._tcp`. Command-line logging through [Sysmon](/tools/sysmon/) shows who ran it and when. In DNS logs, many TXT lookups for random-looking names can mean [DNS tunnelling](/modules/01-05-dns-in-depth/).

?! `nslookup` says "Non-authoritative answer" and gives an old address for your server. What does that tell you, and how do you get the authoritative answer?
