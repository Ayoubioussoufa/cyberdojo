---
title: WireGuard
summary: A small, fast VPN built on modern cryptography, set up with the wg command.
side: defence
use: open
docs: https://www.wireguard.com/quickstart/
aka: wg, wg-quick
alt: openssl
---
## What it's for
WireGuard is a VPN: it joins machines through an encrypted tunnel, so traffic between them can't be read or changed on the way. It's built into the Linux kernel and available on every major system, and its code is small enough to audit, unlike older VPNs.

## How it works
Each peer has a key pair. A peer's configuration lists the other peers by public key, with the addresses each may use (`AllowedIPs`), which works as both routing table and access list: a packet from a peer is accepted only if its source address is one that peer is allowed. There's no negotiation of algorithms, so there's nothing to downgrade. A sender that doesn't present a known key gets no answer at all, so a WireGuard port looks closed to scanners.

## Try it
```
umask 077
wg genkey | tee private.key | wg pubkey > public.key
sudo wg-quick up wg0
sudo wg show
sudo wg-quick down wg0
```

`umask 077` keeps the key file private. `wg-quick` reads `/etc/wireguard/wg0.conf`, which you write with your private key, an address and one `[Peer]` section per machine. Build a tunnel between two VMs, then capture the traffic with [tcpdump](/tools/tcpdump/): you'll see only UDP packets with random-looking content.

## What defenders see
`wg show` lists each peer with its latest handshake and the bytes it sent, so a peer that hasn't completed a handshake for days is dead or should be removed. Treat private keys like passwords: a stolen key lets someone join as that peer until you remove its public key everywhere. Since WireGuard ignores unknown senders, scanners can't find it, so your inventory must come from configuration, not scans. The [VPN internals](/modules/07-06-vpn-internals/) module compares it with IPsec and OpenVPN.

?! A laptop with WireGuard set up is stolen. What exactly must you change, and on which machines, so it can't join the network any more?
