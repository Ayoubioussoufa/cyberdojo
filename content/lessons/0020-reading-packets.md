---
title: Reading packets with Wireshark
summary: Capture real traffic, filter it, and follow one web request from DNS through TCP and TLS to HTTP.
month: 2
minutes: 60
builds: an annotated capture and your first traffic case, P02
source: Wireshark User's Guide | https://www.wireshark.org/docs/wsug_html_chunked/
words: PCAP, display filter, ICMP
---
Logs tell you what a system says happened. Packets show what actually crossed the wire. A packet capture is the closest thing to ground truth in networking, and reading one is a core skill.

@term packet capture (PCAP) = A file recording the network packets seen at a point on a network.
@term Wireshark = A free tool for capturing and inspecting network traffic.
@term tcpdump = A command-line tool for capturing and filtering packets.
@term display filter = A Wireshark expression that hides everything except the packets you want.
@term ICMP = A protocol for network messages and errors, used by ping and traceroute.
@term TLS = Transport Layer Security: encrypts a connection, such as HTTPS.
@term HTTP = The protocol that browsers and web servers use to exchange pages and data.
@term NAT = Network Address Translation: a router rewrites addresses so many devices can share one public IP.

## The tools

```
ip a                            your addresses
ss -tuln                        what's listening here
dig example.com                 DNS lookup
ping -c 3 example.com           is it reachable? (ICMP)
traceroute example.com          which routers are on the path?
sudo tcpdump -i eth0 port 53    capture DNS on one interface
sudo tcpdump -i eth0 -w out.pcap   save a capture to a file
```

`traceroute` uses a neat trick: it sends packets that expire after 1 hop, then 2, and so on, and each router that drops one sends back an **ICMP** error, revealing itself. Remember `ping` can be blocked: no reply doesn't prove a host is down.

### What capturing really means

Every packet that reaches your computer arrives through a network **interface**: the Ethernet port, the Wi-Fi card, or a virtual one inside a VM or a container. Normally the system reads each packet and hands its content to the right program. A capture tool asks the system for a copy of every packet on one interface as well, with the headers intact. Because that's a powerful view, capturing needs root, or on a desktop membership of the `wireshark` group. `tcpdump -D` lists what you can capture on:

```
1.eth0 [Up, Running, Connected]
2.any (Pseudo-device that captures on all interfaces) [Up, Running]
3.lo [Up, Running, Loopback]
```

`lo` is the loopback, where traffic to `127.0.0.1` goes, and `any` listens on all of them at once. Pick the interface the traffic really crosses: a capture on the wrong one is silent. You also only see what reaches your interface. On a modern switched network that's your own traffic plus broadcasts, not your neighbours', which is why defenders capture on the server itself, or ask the network team for a mirror port.

### Reading a tcpdump line

These are real lines from capturing `curl http://example.com` (the long TCP options are trimmed):

```
IP 172.17.0.2.39106 > 10.255.255.254.53: 44425+ [1au] A? example.com. (52)
IP 10.255.255.254.53 > 172.17.0.2.39106: 44425 2/0/1 A 104.20.23.154, A 172.66.147.243 (72)
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [S], seq 1074556823, win 64240, length 0
IP 104.20.23.154.80 > 172.17.0.2.34802: Flags [S.], seq 3014024341, ack 1074556824, win 65535, length 0
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [.], ack 1, win 63, length 0
IP 172.17.0.2.34802 > 104.20.23.154.80: Flags [P.], seq 1:76, ack 1, win 63, length 75: HTTP: GET / HTTP/1.1
```

Each line reads *source address.port > destination address.port: details*. The first two are DNS on port 53: `A? example.com.` asks for the address and the answer gives two. The next three are the TCP handshake, told by the flags:

| Flag | Meaning |
|---|---|
| `[S]` | SYN: "let's open a connection" |
| `[S.]` | SYN and ACK: "agreed" (the dot means ACK) |
| `[.]` | ACK only: "received" |
| `[P.]` | Push and ACK: data is here |
| `[F.]` | FIN: "I'm done" |
| `[R]` | Reset: "no", or "stop now" |

The last line carries 75 bytes of data, and because this is plain HTTP, tcpdump can even name it: `GET / HTTP/1.1`.

### Capture filters are not display filters

Two different filter languages exist, and mixing them up is the commonest beginner mistake. A **capture filter** decides what gets recorded at all; it's written in BPF syntax, the one tcpdump uses (`port 53`, `host 10.0.0.5`, `tcp port 443`). A **display filter** only hides packets that were already recorded, in Wireshark's own syntax (`dns`, `ip.addr == 10.0.0.5`). Capture broadly and filter on display while you're learning: a packet that a capture filter dropped is gone for good. In Wireshark, the filter bar turns green when your expression is valid and red when it isn't, which usually means you typed one language into the other's box.

?? `ping` gets no reply from a server. What can you conclude?
+ Nothing certain, as ICMP is very often blocked
- The server is definitely switched off right now
- Your own network cable must be unplugged again
- The server has been hacked by an attacker
=> Many hosts and firewalls drop ping. Try another way before you decide that it's down.

## Reading Wireshark

Wireshark has three panes: the packet list, the decoded layers of the selected packet, and the raw bytes. You'll recognise the layers: Ethernet, then IP, then TCP, then HTTP. That's encapsulation, visible.

**Display filters** are what make it usable. The [full reference](https://www.wireshark.org/docs/dfref/) is large, but these go a long way:

| Filter | Shows |
|---|---|
| `ip.addr == 10.0.0.5` | Traffic to or from a host |
| `tcp.port == 443` | One port |
| `dns` | DNS only |
| `http.request` | HTTP requests |
| `tcp.flags.syn == 1 && tcp.flags.ack == 0` | New connection attempts |
| `tcp.flags.reset == 1` | Resets |
| `arp` | ARP traffic |
| `dns.qry.name contains "evil"` | DNS queries for a name |

Three more features: **Follow → TCP Stream** rebuilds a whole conversation, **File → Export Objects** extracts transferred files, and **Statistics → Conversations** shows who talked to whom the most.

### Reading the packet list

The same capture, opened in Wireshark or in its command-line twin `tshark`, gives one line per packet:

```
    3   1.212532   172.17.0.2 → 10.255.255.254 DNS 94 Standard query 0xad89 A example.com OPT
    5   1.220672 10.255.255.254 → 172.17.0.2   DNS 114 Standard query response 0xad89 A example.com A 104.20.23.154 A 172.66.147.243 OPT
   10   1.248491   172.17.0.2 → 104.20.23.154 HTTP 141 GET / HTTP/1.1
```

The columns are the packet's number in the file, the seconds since the capture started, the source, the destination, the highest protocol Wireshark recognised, the length in bytes, and a summary. The number is how you refer to a packet in notes ("the GET is packet 10"). The matching IDs `0xad89` in packets 3 and 5 are how you pair a DNS question with its answer.

### Following a conversation

Right-click packet 10 and choose Follow, then TCP Stream: Wireshark puts the whole conversation back together as text.

```
GET / HTTP/1.1
Host: example.com
User-Agent: curl/8.14.1
Accept: */*
```

Anyone on the path could read that, and the page that came back, word for word. Over plain HTTP, a login form's password would be just as readable, which is the whole argument for HTTPS in one screen.

?? You want to find every host trying to open new connections. Which filter?
+ `tcp.flags.syn == 1 && tcp.flags.ack == 0`
- `tcp.flags.fin == 1 && tcp.flags.ack == 0`
- `tcp.flags.reset == 1 && tcp.flags.ack == 1`
- `tcp.flags.syn == 1 && tcp.flags.ack == 1`
=> The first step of a handshake is SYN without ACK. SYN-ACK is the server's reply. This filter is also how you spot a port scan.

## One web request, end to end

"What happens when you open a website?" is a guaranteed interview question. Here's the answer you'll be able to prove from your own capture.

@flow DNS query > DNS answer > TCP handshake > TLS handshake > HTTP request > HTTP response

::: try Your annotated capture (exit gate)
1. In your VM, start capturing: `sudo tcpdump -i eth0 -w web.pcap`.
2. In another terminal, run `curl https://example.com`.
3. Stop the capture with Ctrl+C and open `web.pcap` in Wireshark.
4. Find and note the packet numbers of: the DNS query and answer, the SYN, SYN-ACK, ACK, the TLS Client Hello, and the encrypted application data.
5. In your notes, explain each step in one sentence, with its packet number.
:::

Here's what you should find. With HTTPS, you can see the IP addresses, ports, sizes and timing, and usually the site name in the TLS **SNI** field. You can't see the page or the URL path: they're encrypted. Defenders rely on that metadata every day.

@term SNI (Server Name Indication) = A TLS field where the client names the site it wants, often visible on the network.

### The same request over HTTPS

Capture `curl https://example.com` instead and filter on `tls`:

```
   17   2.019780   172.17.0.2 → 172.66.147.243 TLSv1.2 1628 Client Hello (SNI=example.com)
   20   2.056261 172.66.147.243 → 172.17.0.2   TLSv1.3 5144 Server Hello, Change Cipher Spec, Application Data
   23   2.059295   172.17.0.2 → 172.66.147.243 TLSv1.3 189 Application Data
   25   2.083958 172.66.147.243 → 172.17.0.2   TLSv1.3 619 Application Data, Application Data
```

The Client Hello still names the site in clear (`SNI=example.com`), then everything is "Application Data": Follow TCP Stream now shows only scrambled bytes. The Client Hello is labelled TLSv1.2 because it's written in a format older software accepts, and the Server Hello's reply is what settles TLS 1.3.

### When you see nothing

| What happens | Why | Do this |
|---|---|---|
| No packets at all | You're capturing on the wrong interface | Check with `tcpdump -D`, or capture on `any` |
| "You don't have permission to capture on that device" | Capturing needs privileges | Use `sudo tcpdump`, or join the `wireshark` group and log in again |
| The filter bar turns red | Not valid display filter syntax, often a capture filter typed there | `port 53` becomes `tcp.port == 53 or udp.port == 53`, or just `dns` |
| You see only your own traffic | A switch sends each device only its own packets | Capture on the server itself, or use a mirror port in your lab |
| The capture grows huge | Everything is being recorded | Stop after N packets with `-c 100`, or add a capture filter |
| HTTPS content is unreadable | That's encryption doing its job | Expected; read the metadata instead |

?? A capture shows HTTPS to a site. What can a network observer normally see?
+ The addresses, timing, sizes, and usually the hostname
- The page content, but not the addresses used
- The full URL path, including any query string
- The passwords typed into each site's login form
=> TLS hides the content and the path. Metadata stays visible, and that's often enough to spot trouble.

## Your first case: P02

Now do it for real. [malware-traffic-analysis.net](https://www.malware-traffic-analysis.net/) publishes real captures with exercises.

::: law
These captures contain real malware traffic, and any files inside can be live. Analyse them only inside a VM, and don't extract and open files on your own computer.
:::

Build a **timeline first**, then answer who, what, when and how. The roadmap's standard:

- Separate **fact** from **inference**: "packet 412 shows a POST to this host" versus "this is probably exfiltration".
- Cite packet numbers and filters as evidence.
- Add a "what I got wrong first" section. Senior reviewers read that part.

See [project P02](/projects/P02/) for the full plan. The Month 2 gate is on [the roadmap](/roadmap/2/).

?! Write the full answer to "what happens when I open https://example.com?", referencing each step you saw in your capture.
