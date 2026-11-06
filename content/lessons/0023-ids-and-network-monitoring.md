---
title: IDS and network monitoring
summary: How Suricata and Zeek watch traffic, how to relate alerts to packets, and the network attacks they catch.
month: 3
minutes: 30
builds: a working sensor that alerts on your own Nmap scan
source: Suricata documentation | https://docs.suricata.io/
words: IDS, signature, false positive
---
A firewall decides what passes. It doesn't tell you much about what's happening inside what it allowed. For that you need something watching.

@term IDS (intrusion detection system) = A system that watches activity and raises alerts when something looks like an attack.
@term IPS (intrusion prevention system) = An IDS placed in line, so it can also block traffic.
@term signature = A rule describing a known bad pattern.
@term Suricata = An open-source IDS and IPS that matches traffic against rules.
@term Zeek = An open-source network monitor that turns traffic into detailed protocol logs.
@term NSM (network security monitoring) = Collecting and analysing network data to find intrusions.
@term false positive = An alert that fired on harmless activity.
@term false negative = A real attack that raised no alert.
@term true positive = An alert that correctly fired on real malicious activity.

## IDS vs IPS

An **IDS** watches a copy of the traffic and alerts. An **IPS** sits in the path and can drop packets. An IPS can stop attacks, but a bad rule can also block real business traffic. That's why many teams start in detect-only mode.

An IPS sits in the path, so it can drop traffic:

@flow Traffic > IPS > Server

An IDS only watches a copy, so it can alert, but it can't block:

@flow Traffic > Switch > Server, with a copy to the IDS

?? What can an IPS do that an IDS can't?
+ Block traffic, as it sits in the path
- Read encrypted traffic, without needing any key material
- Run on a computer that has no network
- Replace the need for logging on every server
=> An IDS only watches a copy. An IPS can drop packets, so a bad rule can also block real work.

## Two tools, two philosophies

| | Suricata | Zeek |
|---|---|---|
| Approach | Match traffic against **signatures** | Record **what happened**, protocol by protocol |
| Output | Alerts | Structured logs: `conn.log`, `dns.log`, `http.log`, `ssl.log` |
| Best for | "Has this known bad thing happened?" | "What did this host do last Tuesday?" |

They're complementary: signatures catch the known, and Zeek's records let you investigate the unknown afterwards.

?? You want to know what a host did last Tuesday. Which suits that better?
+ Zeek, because it records what really happened
- Suricata, because it only matches known signatures
- Neither, because networks can't ever be recorded
- Both are useless without an internet connection
=> Zeek keeps structured records of activity, so you can investigate afterwards. Suricata tells you when a rule matched.

## Reading a Suricata rule

```
alert tcp any any -> $HOME_NET 22 (msg:"SSH connection to lab"; flags:S; sid:1000001; rev:1;)
│     │   │   │     │          │   └─ what to match and say
│     │   │   │     │          └─ destination port
│     │   │   │     └─ destination network
│     │   │   └─ source port
│     │   └─ source network
│     └─ protocol
└─ action
```

The [rules documentation](https://docs.suricata.io/en/latest/rules/intro.html) covers the rest. You'll write detections for a living from Month 11.

?? In a Suricata rule, what does `$HOME_NET` stand for?
+ The networks that you have defined as yours
- The address of the person who wrote it
- The folder where the rules are all stored
- The name of the attacker's own home network
=> It's a variable from the configuration, so that one rule works on many sites.

## The four outcomes

Every detection system lives in this table:

| | Attack happened | No attack |
|---|---|---|
| **Alert fired** | True positive | **False positive** |
| **No alert** | **False negative** | True negative |

False positives waste people's time until they ignore alerts. False negatives are missed attacks. Tuning trades one against the other, and you can't get either to zero.

?? Suricata alerts on "brute force", but it's your own scheduled vulnerability scan. What is that?
+ A false positive, needing careful rule tuning
- A true positive, needing an urgent response
- A false negative, showing a missed attack
- A true negative, showing perfectly normal behaviour
=> The rule fired correctly on the pattern, but the activity is benign. Tune by context, not by turning the rule off.

## Network attacks you can now recognise

| Attack | What it looks like |
|---|---|
| **Port scan** | One source, many ports, many RSTs, little data |
| **Brute force** | Many short connections to one login service |
| **ARP spoofing** | Unsolicited replies, one MAC with two IPs |
| **DNS spoofing** | Unexpected answers, or answers from the wrong server |
| **MITM** | Certificate warnings, changed gateways, odd paths |
| **Beaconing** | Malware calling home at regular intervals |
| **Exfiltration** | Unusually large outbound transfers |

@term beaconing = Malware contacting its controller at regular intervals.

?? One source touches 500 ports in a minute, with little data. What's that?
+ A port scan, as the table describes
- Beaconing, as the table describes it there
- Exfiltration, as the table describes it there
- A normal backup job running on schedule
=> Many ports, many RSTs and little data make a scan. Exfiltration moves large amounts of data out.

## Encryption changes the game

Most traffic today is TLS, so an IDS can't read the contents. It relies on metadata: who talked to whom, how much, how often, and TLS fingerprints. That's why endpoint logs (Month 5) and network data work best together.

?? Why do network data and endpoint logs work best together?
+ Encryption hides content, and hosts see inside
- Endpoints can't record anything about any processes
- Networks already record everything that programs do
- Encrypted traffic is always blocked by firewalls
=> The network shows who talked to whom. The host shows which program did it, and what it did.

## Your lab

::: try Build a sensor
1. On Ubuntu, install Suricata following the [quick start](https://docs.suricata.io/en/latest/quickstart.html).
2. Point it at your lab interface and enable the default rules.
3. Add a local rule that fires on a SYN to port 22.
4. From Kali, run an Nmap scan.
5. Find the alert in `/var/log/suricata/fast.log`, then find the same packets in a capture. Relating the alert to the packets is the skill.
:::

?? A rule fires on traffic that's encrypted with TLS. What can it most likely still match?
+ Addresses, ports, sizes, and some handshake data
- The usernames typed into the login page
- The contents of any file being downloaded
- The HTML of each requested web page
=> Without the keys, an IDS can't see inside TLS. Metadata remains.

?! Why would a team run both Suricata and Zeek, rather than picking one?
