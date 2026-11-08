---
title: TCP internals and attacks
summary: How TCP turns an unreliable network into a reliable stream, and what happens when someone attacks the state, the numbers or the trust behind it.
level: intermediate
side: both
minutes: 55
attack: T1499.001, T1498, T1557
needs: 0018-tcp-udp-and-ports, 0020-reading-packets, 01-02-ip-layer-and-icmp
pair: 01-13-denial-of-service, 07-02-ids-rule-writing
source: RFC 9293, Transmission Control Protocol | https://www.rfc-editor.org/rfc/rfc9293
words: sequence number, SYN cookie, congestion window
---
Lesson 18 taught TCP as a phone call. This module opens the machinery. TCP keeps a small amount of state at each end, and every classic attack goes after that state: exhausting it, guessing it, or injecting into it.

@term sequence number = TCP's byte counter, which lets the receiver order data and spot gaps.
@term SYN cookie = A way of answering a SYN without storing state, by encoding the connection's details in the server's initial sequence number.
@term congestion window = The sender's estimate of how much unacknowledged data the network can hold.

## Concept

### Fundamentals: numbering every byte

TCP numbers **bytes**, not packets. Each side picks a random initial sequence number (ISN). An ACK of N means "I've received everything before byte N, send N next". A SYN and a FIN each use one sequence number, which is why the handshake's ACK is ISN + 1.

@flow Client SYN, seq=x > Server SYN-ACK, seq=y, ack=x+1 > Client ACK, ack=y+1 > ESTABLISHED

The header also carries flags (SYN, ACK, FIN, RST, PSH, URG), a window size and options. Negotiated options include MSS, window scaling, selective ACK and timestamps. Wireshark shows *relative* sequence numbers by default, starting from 0, which are easier to read than the real values.

### Reliability and flow control

The sender keeps unacknowledged data and retransmits it after a timeout. Three duplicate ACKs trigger **fast retransmit** without waiting.

The **receive window** is flow control: "I have this much buffer". A zero window pauses the sender. Together, the windows make a sliding range of bytes that may be in flight.

### Congestion control

The network has no signal for "slow down", so senders infer it. The **congestion window** grows quickly during *slow start*, then more carefully, and it shrinks when loss suggests congestion. Linux has used CUBIC by default, and BBR models bandwidth and round-trip time instead of reacting to loss. In `ss -ti` you can watch `cwnd` and `rtt` on live connections. Sending rate is limited by the smaller of the two windows.

### Connection states

```
LISTEN  SYN-RECEIVED  ESTABLISHED  FIN-WAIT  CLOSE-WAIT  TIME-WAIT
```

`TIME-WAIT` holds a closed connection for twice the maximum segment lifetime, so late packets can't pollute a new connection on the same ports. Many `CLOSE-WAIT` sockets usually point to an application bug: the peer closed and your program never did.

### Advanced: attacks on state and on numbers

**SYN flood.** Each half-open connection costs the server memory in its backlog. Send many SYNs with spoofed sources and the queue fills, so real clients are refused. **SYN cookies** answer it elegantly: the server stores nothing, encodes the connection's details in its ISN with a keyed hash, and rebuilds state only if a valid ACK returns. The price is that some TCP options are lost, so it's used only under pressure.

**Sequence prediction.** In 1985, Robert Morris [showed](https://pdos.csail.mit.edu/~rtm/papers/117.pdf) that predictable ISNs let an attacker spoof a whole connection from a trusted address, and the Mitnick incident of 1994 made that famous. Random ISNs, [RFC 6528](https://www.rfc-editor.org/rfc/rfc6528), closed it. Being *on-path* is different: someone who sees the numbers can inject anyway.

**RST injection.** A forged reset with a plausible sequence number tears down a connection. Anything within the window used to work, so long-lived connections such as BGP sessions were at risk. [RFC 5961](https://www.rfc-editor.org/rfc/rfc5961) tightened this: a reset must match exactly, and near-misses get a *challenge ACK*.

**Side channels.** Fixes create new surfaces. [Cao and others](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/cao) (USENIX Security 2016) showed that a global limit on challenge ACKs in Linux let an off-path attacker infer connection state (CVE-2016-5696). The fix was to randomise that limit. The lesson is that any shared counter is an information channel.

?? Why do SYN cookies defeat a spoofed SYN flood?
+ The server stores nothing until a valid ACK returns
- The server drops every SYN arriving from unknown addresses
- Cookies force each client to solve one hard puzzle
- TLS certificates are checked before any TCP state exists
=> A spoofed source never completes the handshake, so with cookies it costs the server almost nothing.

## Threat model

| Attack | Attacker position | ATT&CK | Effect |
|---|---|---|---|
| SYN flood | Anywhere, with spoofing | [T1499.001](https://attack.mitre.org/techniques/T1499/001/) | Service refuses connections |
| Reset injection | On-path, or off-path with a side channel | [T1557](https://attack.mitre.org/techniques/T1557/) | Sessions cut |
| Data injection | On-path | T1557 | Content changed on cleartext protocols |
| Bandwidth exhaustion | Anywhere | [T1498](https://attack.mitre.org/techniques/T1498/) | Link saturated |

The TCP checksum isn't a security feature: anyone can recompute it. TCP on its own provides no confidentiality and no authentication.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ss -tan state syn-recv` | Counts half-open sockets | Suspecting a SYN flood |
| `ss -ti` | Shows cwnd, rtt, retransmissions | Diagnosing a slow connection |
| `tcpdump 'tcp[tcpflags] & tcp-syn != 0'` | Captures on flags | Isolating handshakes |
| Wireshark | Follows streams, flags retransmissions | Reading a session in detail |
| `nstat`, `netstat -s` | Protocol counters | Spotting `ListenOverflows` and syncookies sent |

## Defence

- **Keep SYN cookies on.** On Linux, `net.ipv4.tcp_syncookies=1` uses them when the queue fills.
- **Size the backlog.** Tune `net.core.somaxconn` and `tcp_max_syn_backlog`, and remember the application's own `listen()` value.
- **Put integrity above TCP.** TLS makes injection fail authentication. Injected bytes become errors, though the connection can still be reset, so TLS can't prevent denial of service.
- **Protect infrastructure sessions.** [TCP-AO (RFC 5925)](https://www.rfc-editor.org/rfc/rfc5925) authenticates segments, which suits BGP.
- **Monitor.** Alert on sustained `SYN-RECV` growth, on `ListenOverflows`, and on many RSTs per session.

## Pitfalls

- **"TCP is reliable, so the data is trustworthy."** Reliable means ordered and complete, not authentic.
- **"Sequence numbers are secret."** Only from off-path attackers. Anyone on-path sees them.
- **"HTTPS stops all TCP attacks."** It stops tampering, not resets or floods.
- **"Retransmissions mean an attack."** They usually mean loss or a bad link.
- **Reading relative numbers as real.** When comparing captures from two sides, switch them off in Wireshark.

?? What does a large number of `CLOSE-WAIT` sockets usually point to?
+ An application that never closes its own sockets
- A remote attacker flooding the server with SYNs
- A network path dropping all ICMP error messages
- A kernel that ran out of sequence numbers
=> In `CLOSE-WAIT` the peer has closed and the local program still holds the socket. That's normally a bug in your own code.

## Exercise

::: law Lab only
Run this between your own lab VMs. Never send floods or forged resets over a network that you don't own.
:::

1. Start a small server such as `python3 -m http.server 8000` on one VM. Capture a full request in Wireshark, and then by hand work out every SEQ and ACK of the handshake and the first data packet.
2. Download a large file and watch `ss -ti` during the transfer. Note how `cwnd` changes. Throttle the link with `tc qdisc add dev <if> root netem delay 100ms loss 1%`, watch what changes, and then remove it with `tc qdisc del dev <if> root`.
3. Run `sysctl net.ipv4.tcp_syncookies` and explain the value.
4. Read `nstat -az TcpExtListenOverflows TcpExtSyncookiesSent`. Write the monitoring rule you'd want on these counters.
5. Read the RFC 5961 section on reset attacks, and explain the challenge ACK in your own words.

?! Explain why a shared rate limit on challenge ACKs could leak connection state. Then name another system you know where a shared counter could leak information.

## Further reading

- [RFC 9293](https://www.rfc-editor.org/rfc/rfc9293), the current TCP specification, which consolidates decades of changes.
- [RFC 4987](https://www.rfc-editor.org/rfc/rfc4987), on SYN flooding and its mitigations.
- [RFC 5961](https://www.rfc-editor.org/rfc/rfc5961), on blind in-window attacks.
- [Off-Path TCP Exploits](https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/cao), USENIX Security 2016.
- W. Richard Stevens, *TCP/IP Illustrated, Volume 1*, the classic study of protocols on the wire.
