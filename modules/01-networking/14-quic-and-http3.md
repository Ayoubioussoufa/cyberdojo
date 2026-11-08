---
title: QUIC and HTTP/3
summary: A new transport over UDP with encryption built in. Why it was created, what it hides from network defenders, and how to keep visibility without breaking the modern web.
level: advanced
side: both
minutes: 40
attack: T1071.001, T1573
needs: 01-03-tcp-internals, 0039-public-keys-and-tls
pair: 07-03-sensors-and-tls-inspection
source: RFC 9000, QUIC, A UDP-Based Multiplexed and Secure Transport | https://www.rfc-editor.org/rfc/rfc9000
words: QUIC, 0-RTT, connection ID
---
For decades, a network defender could read TCP headers, follow state and inspect TLS handshakes in order. QUIC moves the transport into user space, runs it over UDP, and encrypts nearly everything. It makes the web faster, and it takes away many of the tools that you learned so far.

@term QUIC = A transport protocol over UDP, with TLS 1.3 built in, that provides multiplexed encrypted streams.
@term 0-RTT = Sending application data in the first flight of a resumed connection, before the handshake finishes.
@term connection ID = A QUIC value that identifies a connection, independently of the client's IP address and port.

## Concept

### Fundamentals: why not just improve TCP?

TCP lives in the kernel and in middleboxes all over the Internet. Changing it means waiting years, and firewalls often drop anything unfamiliar, a problem called *ossification*. Building on UDP avoids that. Everything new sits in a user-space library that can ship with a browser update.

QUIC also fixes **head-of-line blocking**. HTTP/2 multiplexes streams on one TCP connection, so one lost packet stalls them all. QUIC streams are independent, so a loss delays only its own stream.

| | HTTP/1.1 and 2 | HTTP/3 |
|---|---|---|
| Transport | TCP | QUIC over UDP |
| Encryption | Optional TLS on top | TLS 1.3, built in, mandatory |
| Handshake | TCP, then TLS | Combined |
| Default port | TCP 443 | UDP 443 |
| Headers | Visible to the network | Mostly encrypted, including packet numbers |

Browsers usually discover HTTP/3 through an `Alt-Svc` header or a DNS HTTPS record, so a first visit often uses TCP, and later ones use UDP.

### Connection IDs and migration

TCP identifies a connection by its 4-tuple. If your phone moves from Wi-Fi to mobile data, the connection dies. QUIC identifies it by a **connection ID**, so a session can survive a change of address. For privacy, clients rotate the ID when moving, so that an observer can't link the two paths.

### Advanced: what security design changed

**Encrypted transport.** Most of the header is encrypted, and QUIC's packet protection includes the packet number. So on-path tools can't see the acknowledgements or the state that TCP exposed. That's a deliberate answer to ossification, as what middleboxes can't see, they can't depend on. [RFC 9312](https://www.rfc-editor.org/rfc/rfc9312) discusses what's left for operators.

**The Initial packets.** The first packets are encrypted with keys derived from a value that's visible on the wire, so anyone can decrypt the ClientHello. This means that the SNI is readable, unless Encrypted Client Hello is used. So fingerprinting such as JA4 still works on QUIC.

**Amplification limits.** A UDP protocol could be a reflector. So, until a client's address is validated, a server may send at most **three times** the bytes it received ([RFC 9000, section 8](https://www.rfc-editor.org/rfc/rfc9000#section-8)). A **Retry** packet with a token can prove the address first, at the cost of one round trip.

**0-RTT.** Resumed connections can send data immediately, which makes them fast, but that early data isn't protected against replay. An attacker who captures it can send it again. So [RFC 9001](https://www.rfc-editor.org/rfc/rfc9001) and the HTTP/3 rules restrict it to safe, idempotent requests, and a server that handles a payment over 0-RTT has a bug.

?? Why must 0-RTT data be restricted to idempotent requests?
+ An attacker can replay it, so it runs twice
- It's sent without any encryption across the whole network
- Servers can't read it until the next full handshake
- Its packets are too small to hold request bodies
=> Early data has no fresh handshake to bind it to, so a server might receive it twice. Repeating a read is harmless, but repeating a payment isn't.

## Threat model

Attackers benefit from the same blind spots as everyone else:

- [T1071.001](https://attack.mitre.org/techniques/T1071/001/), web protocols, and [T1573](https://attack.mitre.org/techniques/T1573/), encrypted channels. C2 over QUIC looks like any other HTTP/3 traffic.
- A sensor that can't parse QUIC just sees UDP on port 443, so a stack with a mature TCP pipeline may be blind.
- UDP floods on 443 can hide among real traffic.
- Connection migration can split one session across several addresses in your flow logs.

The server side has new risks too. QUIC stacks are young, and they're in user space, so parser bugs land in application processes. Rapid stream resets and connection floods have analogues to [HTTP/2 attacks](/modules/01-13-denial-of-service/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `curl --http3` | HTTP/3 client (needs a build with QUIC support) | Testing a server |
| Wireshark | Decodes QUIC, decrypts with a key log | Reading a session |
| qlog and qvis | Structured QUIC event logs and a viewer | Debugging from the endpoint |
| Zeek | Has a QUIC analyzer | Logging handshakes and SNI |
| JA4 | Fingerprints QUIC clients too | Enriching network telemetry |

## Defence

You have three real choices.

| Option | How | Cost |
|---|---|---|
| Keep QUIC, use metadata | Log SNI, JA4, IPs and volumes | Less content visibility |
| Block UDP 443 outbound | Browsers fall back to TCP with TLS | Slightly slower, and a stopgap as HTTP/3 grows |
| Inspect at the endpoint | EDR, browser policy, secure web gateway agent | Requires managed devices |

Many enterprises block UDP 443 so that existing TLS inspection keeps working. It's a defensible choice, as long as you know that it's a stopgap, and that some apps may not fall back cleanly. Browsers can also be set by policy: Chrome has `QuicAllowed`.

On your own servers, enable Retry when under load, restrict 0-RTT, or disable it outright if unsure. Keep your QUIC library patched, and apply limits on streams and connections. Check that your load balancer and WAF understand HTTP/3 before enabling it, or you may open a path that bypasses inspection. A related mistake is advertising HTTP/3 from a CDN with rules that only cover HTTP/2.

## Pitfalls

- **"UDP means unreliable."** QUIC builds reliability on top of UDP.
- **"QUIC hides everything."** The SNI is still readable without ECH, and the destination IP always is.
- **"Blocking UDP 53 and TCP 443 is enough."** Your policy needs to consider UDP 443 as well.
- **"Our WAF covers the site."** Check that it applies to the HTTP/3 path.
- **"0-RTT is just a speed-up."** It changes the replay guarantees.

?? A company's TLS inspection proxy works for TCP but sees nothing of QUIC. What's the usual simple fix?
+ Block outbound UDP 443 so browsers fall back
- Raise the proxy's TCP receive window per client
- Disable DNSSEC validation on the company's own resolvers
- Force every laptop onto IPv6 for outbound web
=> Browsers fall back to TCP when QUIC fails, which brings traffic back to the existing proxy, at the cost of some speed.

## Exercise

::: law Lab only
Capture only your own traffic in your own lab. Run your HTTP/3 server on a VM you control.
:::

1. In Chrome or Firefox, open developer tools, show the Protocol column, and load a few big sites. Find `h3`.
2. Capture while loading one of them. Filter on `quic` in Wireshark, and find the Initial packet. Can you read the SNI? Note which fields are hidden.
3. Set `SSLKEYLOGFILE`, then decrypt the session in Wireshark. Compare what you can see now.
4. In your lab, add a firewall rule that drops outbound UDP 443 on one VM. Load the same site and watch it fall back to `h2`. Note any difference in timing.
5. Set up Caddy, which supports HTTP/3 by default, on a lab VM, and test with `curl --http3` if your build supports it.

?! Write the case for and against blocking QUIC at a mid-sized company. Pick a side, and state what would make you change your mind.

## Further reading

- [RFC 9000](https://www.rfc-editor.org/rfc/rfc9000), the QUIC transport specification.
- [RFC 9001](https://www.rfc-editor.org/rfc/rfc9001), on how TLS secures QUIC.
- [RFC 9114](https://www.rfc-editor.org/rfc/rfc9114), HTTP/3.
- [RFC 9312](https://www.rfc-editor.org/rfc/rfc9312), QUIC's manageability for network operators.
- [HTTP/3 explained](https://http3-explained.haxx.se/), a free book by Daniel Stenberg of curl.
