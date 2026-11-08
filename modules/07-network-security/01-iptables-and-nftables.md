---
title: iptables and nftables
summary: The Linux packet filter from the kernel's view. Netfilter hooks, connection tracking, rule order, NAT and logging, so you can write a firewall and read one under pressure.
level: foundation
side: defence
minutes: 50
attack: T1562.004
needs: 0021-firewalls-and-segmentation, 0025-hardening-linux, 01-03-tcp-internals
pair: 01-11-ipv6-security
source: nftables wiki | https://wiki.nftables.org/
words: netfilter, connection tracking, default deny
---
`ufw` is a friendly front end, and lesson 25 used it. Behind it sits Netfilter, the kernel framework that every Linux firewall, Docker network and Kubernetes service relies on. When a container port is mysteriously reachable, or a rule seems to do nothing, you need to read the real tables.

@term netfilter = The Linux kernel framework that lets rules inspect and change packets at fixed points in the network stack.
@term connection tracking = The kernel's record of network flows, which lets rules match on whether a packet belongs to a known connection.

## Concept

### Fundamentals: the hooks

Netfilter places hooks along a packet's path through the kernel.

@flow Packet arrives > PREROUTING > Routing decision > INPUT, FORWARD or OUTPUT > POSTROUTING > Leaves

A packet for this host goes through `INPUT`. A packet being routed through goes through `FORWARD`. Traffic the host creates uses `OUTPUT`. So a server's rules usually live on `INPUT`, and a gateway's on `FORWARD`. Forgetting that is the most common beginner mistake.

**iptables** organises rules into tables (`filter`, `nat`, `mangle`, `raw`), and tables into chains attached to hooks. Rules are checked **top to bottom**, and the first match with a terminating target wins. If nothing matches, the chain's **policy** applies.

```
iptables -P INPUT DROP
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -s 192.168.56.0/24 -j ACCEPT
```

That's a **default deny**: nothing gets in unless a rule says so.

### Connection tracking

The second line above is what makes this firewall *stateful*. `conntrack` records flows, and a rule can ask about state: `NEW`, `ESTABLISHED`, `RELATED` or `INVALID`. Replies to your own outbound connections get in without their own rules. The table has a size limit, and `conntrack -L` shows it. A flood can fill it, and then new connections fail, so it's a resource to monitor.

### DROP or REJECT

`DROP` is silent, so a client waits and times out. `REJECT` answers immediately. Inside your own network, `REJECT` makes faults easier to diagnose, and at an Internet edge many people choose `DROP`.

### nftables

**nftables** is the modern replacement, and the default on current distributions. On most of them, the `iptables` command is a compatibility layer over it, so check with `iptables -V`. It has one syntax and one tool, handles IPv4 and IPv6 in an `inet` table, and has sets, which make big allow-lists fast and atomic to update.

```
table inet filter {
  chain input {
    type filter hook input priority 0; policy drop;
    ct state established,related accept
    iif "lo" accept
    ct state invalid drop
    ip saddr 192.168.56.0/24 tcp dport 22 accept
    icmpv6 type { nd-neighbor-solicit, nd-neighbor-advert, nd-router-advert } accept
  }
}
```

The last line matters: [IPv6](/modules/01-11-ipv6-security/) needs ICMPv6.

### Advanced: why the rules aren't the whole picture

**NAT** happens in `PREROUTING` for destination changes, and `POSTROUTING` for source changes. A port forward must be allowed on `FORWARD` as well.

**Docker writes its own rules.** A published port is handled through `FORWARD` and NAT, ahead of `INPUT`. So `ufw deny 8080` may do nothing to a container published on 8080, which regularly exposes databases to the Internet. Docker provides a `DOCKER-USER` chain for your rules, or you can bind to `127.0.0.1`.

**Kubernetes** programs thousands of rules through `kube-proxy`, though CNIs with eBPF can bypass Netfilter altogether. eBPF and XDP run earlier than these hooks, so a rule here may never see such a packet. See [Kubernetes attack paths](/modules/10-06-kubernetes-attack-paths/).

?? A new rule at the end of `INPUT` never matches. What's most likely?
+ An earlier rule already accepts or drops it
- The kernel reads the rules from bottom upward
- Rules only take effect after a full reboot
- Firewall rules can't ever match TCP destination ports
=> Rules run in order, and the first terminating match ends processing. Packet counters from `iptables -L -v` show which rule got it.

## Threat model

Attackers with root may add a rule to allow their traffic, clear the rules, or block EDR's outbound connection. That's [T1562.004](https://attack.mitre.org/techniques/T1562/004/), disabling or modifying the system firewall. Host firewalls also limit [lateral movement](/modules/01-10-proxies-pivoting-and-tunnels/) if they're not bypassed. Note that a firewall is only a filter: it does nothing about traffic on a port that you allowed.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `nft list ruleset` | Shows everything | Finding out what's really loaded |
| `iptables -L -v -n --line-numbers` | Shows rules with counters | Seeing which rule matches |
| `iptables-save`, `nft -f` | Save and restore atomically | Deploying rule changes |
| `conntrack -L`, `-E` | Lists and watches flows | Debugging state |
| `nft add rule ... log prefix` | Logs a match | Testing before you drop |
| `nmap` | Tests from outside | Proving what the rules really do |

## Defence

- **Default deny inbound**, and on servers, restrict outbound too.
- **Allow by source** where you can, not just by port.
- **Drop `INVALID` packets**, and rate limit new connections to exposed services.
- **Log what you drop** at a sensible rate, then send it to your SIEM.
- **Load rules atomically**, with a timed rollback such as `iptables-apply`, so that a mistake doesn't lock you out.
- **Manage rules as code.** A firewall change is a code change that deserves review.
- **Test from another host.** Rules prove nothing until a scan confirms them.

**Detection.** Alert on changes to the ruleset with `auditd` on `nft`, `iptables` and related binaries, and compare a hash of `nft list ruleset` against your baseline.

## Pitfalls

- **Locking yourself out over SSH.** Use a console, or a rollback timer.
- **Forgetting persistence.** Rules vanish on reboot, unless saved.
- **Securing IPv4 only.** `iptables` doesn't touch IPv6. Use `ip6tables`, or an `inet` table.
- **Trusting `ufw status` with Docker.** Test published ports from outside.
- **Mixing tools.** Running `ufw`, `firewalld` and manual rules together causes confusion.
- **Forgetting that `RELATED` can be broad.** Helper modules for FTP or SIP can open surprising paths, and they're off by default for that reason.

?? A database in Docker is published on port 5432, yet `ufw deny 5432` doesn't block it. Why?
+ Docker's NAT and FORWARD rules bypass that path
- UFW only filters UDP traffic on most systems
- PostgreSQL disables the kernel's firewall when it starts
- Port 5432 is always reserved by the kernel
=> Published traffic goes through `FORWARD`, not `INPUT`, so a `ufw` rule never sees it. Bind to localhost, or use `DOCKER-USER`.

## Exercise

::: law Lab only
Work on your own VM, with console access in case you lock yourself out. Scan only your own lab.
:::

1. Run `iptables -V`, and check whether your system uses the nftables back end.
2. Write the nftables ruleset above for your lab. Allow SSH from one address only. Load it, and confirm with `nmap` from another VM.
3. Add a counter and a log rule, generate traffic, and read the result in `journalctl -k`.
4. Run a container with `-p 8080:80`. Try to block it with `ufw`, scan it, then fix it properly with `DOCKER-USER`.
5. Compare `DROP` and `REJECT` by timing `nc -zv` against each.
6. Fill your conntrack table to a low limit in your lab by setting `net.netfilter.nf_conntrack_max` low, then opening many connections. Note what fails, and restore the value.

?! A developer says "the firewall blocks it, so we don't need authentication on the admin port". Write your reply, including at least two ways that the firewall assumption can fail.

## Further reading

- [nftables wiki](https://wiki.nftables.org/), the primary reference.
- [netfilter.org documentation](https://www.netfilter.org/documentation/).
- [Docker packet filtering and firewalls](https://docs.docker.com/engine/network/packet-filtering-firewalls/).
- [iptables(8)](https://man7.org/linux/man-pages/man8/iptables.8.html).
- [NIST SP 800-41](https://csrc.nist.gov/pubs/sp/800/41/r1/final), guidelines on firewalls and firewall policy.
