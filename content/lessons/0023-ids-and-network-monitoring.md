---
title: IDS and network monitoring
summary: How Suricata and Zeek watch traffic, how to relate alerts to packets, and the network attacks they catch.
month: 3
minutes: 50
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

Seeing one line from each makes the difference concrete. This is a Suricata alert, as written to `fast.log`:

```
11/15/2026-10:14:02.123456  [**] [1:1000001:1] SSH connection to lab [**] [Classification: (null)] [Priority: 3] {TCP} 192.168.56.20:51514 -> 192.168.56.10:22
```

Read it left to right: when it happened, then three numbers in brackets (the middle one, `1000001`, is the rule's ID), the rule's message, the protocol, and who talked to whom. It tells you that a rule matched. It doesn't tell you what happened next.

This is the same connection in Zeek's `conn.log`, with only the main columns shown:

```
id.orig_h      id.orig_p  id.resp_h      id.resp_p  proto  service  duration  orig_bytes  resp_bytes  conn_state
192.168.56.20  51514      192.168.56.10  22         tcp    ssh      4.21      1893        2540        SF
```

Zeek wrote this line with no rule involved, because it writes one for every connection. `orig` is the side that started the connection and `resp` is the side that answered. `conn_state` sums up how it went:

| `conn_state` | Meaning |
|---|---|
| `SF` | A normal connection: opened, used, closed |
| `S0` | A SYN was sent and nothing came back |
| `REJ` | The SYN was answered with a reset: the port is closed |

A port scan in `conn.log` is therefore easy to spot: one `id.orig_h`, hundreds of different `id.resp_p`, zero bytes, and a wall of `REJ` and `S0`.

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

The part before the brackets is the **header**: it decides which packets the rule even looks at. The part in brackets is the list of **options**, each ending with a semicolon:

| Option | Meaning |
|---|---|
| `msg:"…"` | The text that appears in the alert |
| `flags:S` | Match only packets with the SYN flag set, so the start of a connection |
| `sid:1000001` | The rule's unique ID. Use numbers from 1000000 up for your own rules, so they never clash with published ones |
| `rev:1` | The version of this rule. Raise it each time you edit the rule |

That rule alerts on every single SYN to port 22, which is fine for a first test and useless in production. One more option turns "a connection" into "a pattern":

```
alert tcp any any -> $HOME_NET any (msg:"Possible port scan"; flags:S; threshold: type threshold, track by_src, count 20, seconds 10; sid:1000002; rev:1;)
```

`threshold` counts matches per source address (`track by_src`) and only alerts when one source sends 20 SYNs within 10 seconds. A person opening one SSH session never reaches the count. A scanner reaches it in a moment. Choosing those two numbers is tuning, and the section after next explains what it costs.

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

The commands, for an Ubuntu VM. The quick start linked below has the full detail.

```
sudo apt install suricata jq                 install the sensor, and jq to read its JSON
ip a                                         note the name of your lab interface
sudo nano /etc/suricata/suricata.yaml        set HOME_NET to your lab network, and the interface under af-packet
sudo suricata-update                         download the default rule set
sudo suricata -T -c /etc/suricata/suricata.yaml   test the configuration without starting
sudo systemctl restart suricata              start with the new settings
sudo tail -f /var/log/suricata/fast.log      watch alerts arrive, one line each
```

For your own rule, create a file such as `/etc/suricata/rules/local.rules`, put the rule in it, and add that path to the `rule-files:` list in `suricata.yaml`. Run the `-T` test again before each restart: a rule with a missing semicolon stops the whole sensor from loading, and the test tells you which line is wrong.

Suricata also writes every event as JSON to `/var/log/suricata/eve.json`. That's the file other tools read, and `jq` filters it:

```
sudo tail -f /var/log/suricata/eve.json | jq 'select(.event_type=="alert")'
```

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

## From an alert to the packets

An alert is a claim, and the packets are the evidence. Practise connecting them: take the time, the two addresses and the two ports from the alert line, and use them as a Wireshark display filter on a capture taken at the same moment.

```
ip.addr == 192.168.56.20 && tcp.port == 22
```

If the capture shows one SYN, a SYN-ACK and then a long encrypted conversation, someone logged in. If it shows a SYN and an immediate RST, repeated across many ports, that was a scan and port 22 was only one stop on the way. The alert text was the same in both cases. The packets tell them apart.

?? A `fast.log` line contains `[1:1000002:1]`. What is the number `1000002`?
+ The ID of the rule that fired
- The count of packets in the alert
- The port that the scanner connected from
- The time in seconds since the start
=> The three numbers are the generator, the signature ID and the revision. The signature ID leads you straight to the rule's text.

?? Zeek's `conn.log` shows one source with 400 connections, all `REJ` or `S0`, each to a different port. What happened?
+ A port scan, since nothing was ever exchanged
- A large download, split across many small connections
- A normal login, repeated by a busy user
- A backup job, sending files to one server
=> `REJ` and `S0` mean the connections never carried data. Many ports from one source with no data is the shape of a scan.

?! Why would a team run both Suricata and Zeek, rather than picking one?
