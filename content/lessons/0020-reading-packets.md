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
