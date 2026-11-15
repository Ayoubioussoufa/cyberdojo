---
title: Firewalls, NAT and segmentation
summary: How firewalls decide, why default deny matters, and how to split a network so one breach doesn't become all of it.
month: 3
minutes: 45
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

Read one rule as a sentence. Rule 3 says: "if the packet comes from the admin host, is going to the DMZ web server, and is aimed at port 22, let it through". A packet has to match every column of a rule, not just one. If any column doesn't fit, the firewall moves down to the next rule.

Now follow two packets through the table by hand, the way the firewall does:

| Packet | Rule 1 | Rule 2 | Rule 3 | Rule 4 | Result |
|---|---|---|---|---|---|
| A staff laptop to a news site on 443 | No: wrong destination | Match | not read | not read | Allowed |
| A staff laptop to the DMZ web server on 22 | No: wrong port | No: wrong port | No: wrong source | Match | Blocked |

The second packet is the important one. Nobody wrote "block staff SSH to the web server". It's blocked because nobody allowed it, and the last rule catches whatever is left. That's the whole idea of the next box.

::: key Default deny
List what's allowed, and block everything else. The opposite, allowing everything and blocking known-bad, fails the moment something new appears. The roadmap asks for a one-line reason on every rule, because a rule nobody can justify is a rule that should go.
:::

### The same idea on your own Linux machine

A firewall isn't only a box at the edge of a network. Every Linux machine has one built into the kernel, and on Ubuntu the simplest way to drive it is `ufw`, the "uncomplicated firewall". Try it in your VM, never on a machine you reach only over the network.

```
sudo ufw default deny incoming     block every connection that others start
sudo ufw default allow outgoing    let this machine start its own connections
sudo ufw allow 22/tcp              one exception: SSH, so you can still get in
sudo ufw enable                    switch the firewall on
sudo ufw status verbose            show the defaults and the rules
```

Line by line: the first two lines set the defaults, which are the answer for any packet that no rule mentions. The third adds one allow rule. The fourth turns it all on, and the last shows you what you built. `ufw` is stateful, so replies to connections that your machine started come back in without a rule. The [Ubuntu firewall documentation](https://documentation.ubuntu.com/server/how-to/security/firewalls/) covers the rest.

::: trap Don't lock yourself out
If you're connected to a machine over SSH and you enable a deny-by-default firewall before allowing port 22, your own session is the first thing it blocks. Allow your way in first, then enable.
:::

?? Rule 1 allows port 443 from anywhere. Rule 2 denies everything from `203.0.113.7`. Does that IP reach port 443?
+ Yes, because the first matching rule always wins
- No, because deny rules always take top priority
- No, because rule 2 is the more specific
- Yes, but only after the firewall logs it
=> With first-match logic, rule order is everything. Put specific denies above broad allows. Check your own platform's behaviour too: some differ.

## NAT and port forwarding

**NAT** lets many private addresses share one public address. The router rewrites the source address on the way out, and it remembers the mapping so that replies find their way back. Described in [RFC 3022](https://www.rfc-editor.org/rfc/rfc3022).

Here is what the router's table looks like while two laptops browse at the same time. Both use the one public address, `198.51.100.9`, and the router tells their replies apart by the port number it picked on the way out:

| Inside address and port | Rewritten to | Talking to |
|---|---|---|
| `192.168.1.20:51000` | `198.51.100.9:40001` | `203.0.113.5:443` |
| `192.168.1.31:51000` | `198.51.100.9:40002` | `203.0.113.5:443` |

When a reply arrives for port 40002, the router looks it up, rewrites the destination to `192.168.1.31:51000` and passes it on. A packet from outside that matches no line has nowhere to go, so the router drops it. That's why a home network seems protected: not because NAT judges traffic, but because nothing inside asked for it.

NAT isn't a security feature, though it hides internal addresses as a side effect. **Port forwarding** goes the other way: "traffic to my public IP on 443 goes to this internal server". Every forward is a hole through your defences, so each one is a decision.

?? Why is each port forward a decision worth recording?
+ It's a hole through your firewall, on purpose
- It makes the whole network run more slowly
- It turns off NAT for your other devices
- It changes your public address every single day
=> A forward exposes an inside service to the outside. Each one needs a reason and an owner.

## Segmentation

Divide your network into zones by trust, and force traffic between them through a firewall.

@flow Internet > Firewall > DMZ: public servers > Firewall > Internal: staff and data

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

## Read a design like a reviewer

Before you build, practise the check a reviewer does on any firewall design: take one flow at a time and ask who starts it, where it goes, on which port, and which rule allows it. If you can't point at a rule, the flow is blocked. If you can't say why a rule exists, the rule is the problem.

Use this small company. Staff are on the LAN, the public website is in the DMZ, and the database is in the Servers zone.

```
#  ACTION  SOURCE     DESTINATION   PORT   WHY
1  ALLOW   any        DMZ web       443    Public website
2  ALLOW   DMZ web    database      5432   The site reads its data
3  ALLOW   LAN        any           443    Staff browsing
4  DENY    any        any           any    Default deny
```

?? An attacker takes over the DMZ web server. What can it reach in the Servers zone?
+ Only the database, and only on port 5432
- Every server there, and on every open port
- Nothing at all, since the DMZ is isolated
- Only the file servers, over the SSH port
=> Rule 2 is the one door out of the DMZ. That's still a risk, so the database needs its own login and its own logs, but the attacker can't scan or reach anything else.

?? A staff member can't open the database from their laptop on port 5432. Which rule decides that?
+ Rule 4, because no earlier rule matches it
- Rule 2, because it names the database port
- Rule 3, because it covers the staff LAN
- Rule 1, because it comes first in order
=> Rule 2 has the right port but the wrong source, and rule 3 has the right source but the wrong port. A rule must match on every column, so the packet falls to the default deny.

## Your lab: the start of P01

::: try Build it
1. Download [OPNsense](https://opnsense.org/download/) and create a VM with two or more network adapters.
2. Assign interfaces: WAN (NAT), LAN (host-only), DMZ (a second host-only network).
3. Put Ubuntu in the DMZ and Kali on the LAN. Draw it first, including an IP plan, using [draw.io](https://www.drawio.com/).
4. Write rules with default deny. Give each one a one-line reason.
5. Test each rule from Kali, and record what passed and what was blocked.
:::

?! Write the firewall rules for a tiny company with a public website, a database and five staff laptops. Justify each in one line.
