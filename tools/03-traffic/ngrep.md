---
title: ngrep
summary: Searches network traffic for text, like grep for packets.
side: both
use: open
docs: https://github.com/jpr5/ngrep
kali: ngrep
alt: tcpdump, tshark
---
## What it's for
ngrep shows packets whose contents match a pattern. It's a quick way to check whether a text string is crossing the network.

## How it works
It captures through libpcap, applies a BPF filter, and then runs a regular expression over the payload. Since most traffic is now encrypted, it mainly helps with DNS, plain HTTP and internal protocols. On a TLS connection it shows nothing useful, which is a good thing.

## Try it
```
sudo ngrep -d eth0 -q 'GET|POST' 'tcp port 80'
```

`-d` picks the interface, and `-q` hides the progress marks. Make a plain HTTP request in another terminal, and watch it appear.

## What defenders see
It's a passive listener, so you won't see it on the wire. Use it on your own lab traffic. If it reveals a secret on your own network, then you've found a service that needs TLS.

?! You see a password in ngrep output on an internal network. What does that tell you, and what's the fix?
