---
title: Firewalls, NAT and segmentation
summary: How firewalls decide, why default deny matters, and how to split a network so one breach doesn't become all of it.
month: 3
minutes: 30
builds: design a segmented network with a justified rule for every flow
source: OPNsense documentation | https://docs.opnsense.org/
words: firewall, default deny, DMZ
---
A flat network is like a house with no internal doors: get through one window and you can reach everything. This month you'll build one with doors, and write down why each is open.

@term firewall = A system that allows or blocks network traffic according to rules.
@term stateful firewall = A firewall that tracks connections, so it allows replies automatically.
@term default deny = Blocking everything unless a rule explicitly allows it.
@term segmentation = Splitting a network into zones so that traffic between them can be controlled.
@term DMZ = A network zone for public-facing servers, separated from the internal network.
@term port forwarding = Sending traffic that arrives on one public port to an internal machine.
@term VPN = Virtual Private Network: an encrypted tunnel between a device and a network.
@term proxy = A server that makes requests on behalf of clients, and can filter and log them.

## How a firewall decides

A firewall reads rules from the top, and the first match wins. A rule says: from where, to where, which port, and what to do.

```
#  ACTION  SOURCE       DESTINATION    PORT    WHY
1  ALLOW   any          DMZ web        443     Public website
2  ALLOW   LAN          any            443,80  Staff browsing
3  ALLOW   admin host   DMZ web        22      Admin SSH from one machine
4  DENY    any          any            any     Default deny
```

A **stateful** firewall remembers connections, so that when a staff laptop opens a connection to a site, the replies come back automatically. You write rules for who starts the conversation, and the state table handles the rest.

::: key Default deny
List what's allowed, and block everything else. The opposite, allowing everything and blocking known-bad, fails the moment something new appears. The roadmap asks for a one-line reason on every rule, because a rule nobody can justify is a rule that should go.
:::

?? Rule 1 allows port 443 from anywhere. Rule 2 denies everything from `203.0.113.7`. Does that IP reach port 443?
+ Yes, because the first matching rule always wins
- No, because deny rules always take top priority
- No, because rule 2 is the more specific
- Yes, but only after the firewall logs it
=> With first-match logic, rule order is everything. Put specific denies above broad allows. Check your own platform's behaviour too: some differ.

## NAT and port forwarding

**NAT** lets many private addresses share one public address. The router rewrites the source address on the way out, and it remembers the mapping so that replies find their way back. Described in [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022).

NAT isn't a security feature, though it hides internal addresses as a side effect. **Port forwarding** goes the other way: "traffic to my public IP on 443 goes to this internal server". Every forward is a hole through your defences, so each one is a decision.

?? Why is each port forward a decision worth recording?
+ It's a hole through your firewall, on purpose
- It makes the whole network run more slowly
- It turns off NAT for your other devices
- It changes your public address every single day
=> A forward exposes an inside service to the outside. Each one needs a reason and an owner.

## Segmentation

Divide your network into zones by trust, and force traffic between them through a firewall.

```
Internet
   │
[Firewall]──── DMZ: public web server
   │
   ├────────── LAN: staff laptops
   │
   └────────── Servers: databases, file servers
```

If the web server in the DMZ gets hacked, the attacker still has to get through the firewall to reach the database, and the firewall only allows the one port the web app needs. Segmentation limits the **blast radius**. It's also what makes **lateral movement** noisy and detectable.

?? The public web server is compromised. Which design limits the damage most?
+ It sits in a DMZ, with narrow rules
- It shares a flat network with all staff
- It has a very long and random hostname
- It runs on a port other than 443
=> A DMZ means a breach there doesn't give free access to everything else. Hiding on an unusual port stops very little.

## VPNs and proxies

A **VPN** creates an encrypted tunnel, so a remote device acts as if it's on the network. [WireGuard](https://www.wireguard.com/) and IPsec are the common protocols. Remember the trade-off: once connected, you're inside. Zero trust, in Month 19, is the response to that.

A **proxy** makes web requests for users, so it can filter and log them. Proxy logs are a key data source in Month 9.

?? What's the main risk once someone has connected by VPN?
+ They're inside, and may reach far too much
- Their traffic can be read by anyone nearby
- Their password is sent over the internet unencrypted
- Their laptop stops receiving any more security updates
=> A VPN protects the connection, but it can give wide network access. That's why zero trust grants narrowly.

## Your lab: the start of P01

::: try Build it
1. Download [OPNsense](https://opnsense.org/download/) and create a VM with two or more network adapters.
2. Assign interfaces: WAN (NAT), LAN (host-only), DMZ (a second host-only network).
3. Put Ubuntu in the DMZ and Kali on the LAN. Draw it first, including an IP plan, using [draw.io](https://www.drawio.com/).
4. Write rules with default deny. Give each one a one-line reason.
5. Test each rule from Kali, and record what passed and what was blocked.
:::

?! Write the firewall rules for a tiny company with a public website, a database and five staff laptops. Justify each in one line.
