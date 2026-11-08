---
title: firewalld
summary: Manages a Linux host firewall through zones.
side: defence
use: open
docs: https://firewalld.org/documentation/
kali: firewalld
alt: fail2ban
---
## What it's for
firewalld is a common way to manage the Linux firewall on Red Hat family systems, while Debian and Ubuntu often use the simpler `ufw`. Both sit on top of the kernel's packet filter and make it easier to handle.

## How it works
firewalld's idea is the zone: a named trust level, such as `public` or `internal`, with its own rules. You assign each network interface to a zone, and apply rules there. Underneath, it generates nftables rules. [iptables and nftables](/modules/07-01-iptables-and-nftables/) covers that lower layer, which is what you'll read in most examples.

## Try it
::: law Your machine only
Change the firewall on a machine you control, and keep console access in case you lock yourself out.
:::

```
sudo firewall-cmd --get-active-zones
sudo firewall-cmd --zone=public --add-service=https --permanent
sudo firewall-cmd --reload
```

Add a rule, reload, and confirm with the first command. Then try to reach the port from another host.

## What defenders see
A host firewall is a layer behind the network firewall, valuable when an attacker is already inside. Default to denying inbound, open only what's needed, and keep the rules in configuration management so they're consistent and reviewable.

?! Why keep a host firewall when there's already a firewall at the network edge?
