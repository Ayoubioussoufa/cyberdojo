---
title: nftables
summary: The Linux kernel's firewall, set up with the nft command; the successor to iptables.
side: defence
use: open
docs: https://wiki.nftables.org/wiki-nftables/index.php/Main_Page
aka: iptables, nft
alt: ufw, firewalld
---
## What it's for
nftables is the packet filter inside the Linux kernel, and `nft` is the command that configures it. It replaced iptables, which on most systems still works as a front end that writes nftables rules. [ufw](/tools/ufw/) and [firewalld](/tools/firewalld/) are friendlier layers on top of the same engine.

## How it works
Rules live in tables, which hold chains, which hold rules. A base chain hooks into a point of the kernel's packet path (`input` for traffic to this host, `forward` for routed traffic, `output` for traffic it sends) and has a default policy. Each packet walks the chain's rules in order until one gives a verdict such as `accept` or `drop`. A rule matching `ct state established,related` lets replies back in, so you only allow the connections you start. Sets let one rule match many addresses or ports.

## Try it
```
sudo nft list ruleset
sudo nft add table inet lab
sudo nft add chain inet lab input '{ type filter hook input priority 0; policy accept; }'
sudo nft add rule inet lab input tcp dport 22 counter
sudo nft list table inet lab
sudo nft delete table inet lab
```

This builds a table that only counts SSH packets, so it blocks nothing. Connect over SSH, list the table again and watch the counter grow. Practise `drop` rules in a VM, not over SSH on a server you can't reach any other way, and remember rules vanish at reboot unless saved, usually in `/etc/nftables.conf`.

## What defenders see
The firewall is a defender's own tool, and its logs are evidence: a rule with `log prefix "drop: "` before a drop writes each blocked packet to the kernel log, readable with [journalctl](/tools/journalctl/). An attacker who flushes or changes the rules leaves a trace if auditd watches the `nft` and `iptables` commands. The [iptables and nftables](/modules/07-01-iptables-and-nftables/) module goes deeper.

?! A server's input chain has policy `drop` and one rule accepting TCP port 443. Visitors can load the website, but `apt update` on the server hangs. Why, and which rule is missing?
