---
title: Netcat and socat
summary: A socket you can type into. Netcat and socat strip networking down to one idea, which makes them the best way to learn protocols, and a classic sign of an intruder.
level: foundation
side: both
minutes: 45
attack: T1095, T1571, T1105, T1059.004
needs: 0018-tcp-udp-and-ports, 0020-reading-packets, 0006-pipes-and-redirection
pair: 07-02-ids-rule-writing, 06-02-command-and-control
source: OpenBSD nc(1) manual | https://man.openbsd.org/nc.1
words: socket, netcat, reverse shell
---
Every network program you've ever used does the same four things: open a socket, connect or listen, read and write bytes, close. Netcat is that sequence with nothing added. It joins your terminal to a socket, and the rest is up to you. That's why it's called the Swiss Army knife of networking, and why finding it on a server that has no reason to run it should make a defender sit up.

@term netcat (nc) = A small tool that connects standard input and output to a network socket.
@term socat = A tool that relays bytes between two endpoints of almost any kind, such as sockets, files or TLS sessions.
@term bind shell = A shell listening on a port of the victim's machine, waiting for the attacker to connect in.
@term reverse shell = A shell on the victim's machine that connects out to the attacker, so inbound firewall rules don't stop it.

## Concept

### From the socket up

A program asks the kernel for a socket, and gets back a file descriptor: a small number, used exactly like an open file. A server calls `socket`, `bind`, `listen`, `accept`. A client calls `socket`, `connect`. After that, both just `read` and `write`.

@flow Client: socket > connect > read and write > close

Netcat wires its own standard input and output to that descriptor. So everything you learned about pipes applies across the network. `<` feeds a file into a connection. `>` saves what arrives. This is the Unix idea from lesson 6, extended to a second machine.

```
nc -l 127.0.0.1 49201          # one terminal: listen
nc 127.0.0.1 49201             # another: connect, then type in either one
```

There's no protocol here, and no framing, encryption or authentication. TCP guarantees that bytes arrive in order, and netcat adds nothing to that.

### Speaking protocols by hand

Most protocols that predate binary framing are just text over TCP, so you can hold both sides yourself. This is the real value of netcat for a student. Make yourself the web server, then point curl at it, and you see the exact request a client sends:

```
printf 'HTTP/1.1 200 OK\r\nContent-Length: 6\r\nConnection: close\r\n\r\nhello\n' | nc -l 127.0.0.1 49203
```

Run for real, the listener printed this as curl connected:

```
GET / HTTP/1.1
Host: 127.0.0.1:49203
User-Agent: curl/8.18.0
Accept: */*
```

That's a whole HTTP exchange, with nothing hidden from you. An HTTP header line ends in `\r\n`, not `\n`, and a stray bare newline is one reason a hand-typed request can behave strangely.

### Advanced: why socat exists

Netcat joins one socket to your terminal. **socat** joins any two *addresses*, and an address can be a TCP socket, a UDP socket, a Unix socket, a file, a serial device or a TLS session. Its form is always `socat <address> <address>`. Options after a comma change how an address behaves.

```
socat TCP-LISTEN:8080,reuseaddr,fork TCP:192.168.56.20:80
```

That one line is a port forwarder. `fork` makes it handle many connections. Change one address to `OPENSSL` and the same relay gains TLS, which is how you can wrap an old cleartext service for a lab without touching it.

Variants matter too. Traditional netcat, OpenBSD `nc`, and Nmap's `ncat` aren't the same program. The OpenBSD manual says `-l` [can't be combined](https://man.openbsd.org/nc.1) with `-p`, so `nc -l -p 9001` fails there and works on a traditional build. Check `nc -h` before trusting a recipe.

?? Why can a socket be used with shell redirection at all?
+ The kernel gives programs a descriptor that works like a file
- Netcat stores every packet in a temporary file on the disk
- The shell turns each redirection into a separate new network connection
- TCP always sends lines of text, so they resemble ordinary files
=> A socket is a file descriptor, so `read` and `write` work on it. Netcat just connects that descriptor to standard input and output.

## Threat model

Netcat isn't malware. It's a legitimate tool that an attacker may bring or find. Where it fits:

| Stage | How it's used | ATT&CK |
|---|---|---|
| Discovery | Checking whether a port is open, grabbing a banner | T1046 |
| Command and control | Raw bytes on a socket, with no application protocol | [T1095](https://attack.mitre.org/techniques/T1095/) |
| Command and control | A service on a port that doesn't match it | [T1571](https://attack.mitre.org/techniques/T1571/) |
| Lateral movement support | Moving tools between machines | [T1105](https://attack.mitre.org/techniques/T1105/) |
| Execution | A shell attached to a socket | [T1059.004](https://attack.mitre.org/techniques/T1059/004/) |
| Stealth | Relaying through an allowed port | [T1572](https://attack.mitre.org/techniques/T1572/) |

The important concept is the **shell on a socket**. A shell is an ordinary program that reads commands from standard input. Connect its input and output to a socket, and whoever holds the other end has a remote terminal. A *bind* shell listens, so inbound firewall rules stop it. A *reverse* shell dials out, and since most networks allow outbound traffic, it usually gets through. That asymmetry is why egress filtering matters so much.

We won't print those commands here. The concept is what you need, and it's also what you'd detect.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `nc` (OpenBSD) | Plain socket client and listener | Quick connectivity tests, learning a protocol |
| `ncat` | Nmap's version, with TLS and proxy support | You need TLS or access control while testing |
| `socat` | Relay between any two addresses | Port forwards, TLS wrapping, Unix sockets |
| `openssl s_client` | TLS client that prints the handshake | Testing a TLS service. See TLS internals |
| `ss` | Lists sockets and their owning processes | Finding out who's listening |
| `tcpdump` | Captures what's really on the wire | Proving what your tool sent |

## Defence

**Prevent.** Don't install netcat or socat on production servers: they aren't needed, and removing them raises the cost of every later step. Filter egress by default, so an unknown process can't reach an unknown address. A reverse shell needs a way out.

**Detect on the host.** The strongest signal doesn't depend on the tool's name, because a renamed binary fools a name match. Instead, look for a shell whose standard streams are sockets:

```
ss -tnp                        # established connections and their processes
ls -l /proc/<pid>/fd           # 0, 1 and 2 pointing at socket:[...] is the tell
```

A web server spawning a shell (`www-data` running `sh`) is a high-value alert in its own right. On Windows, Sysmon event 1 catches process creation and event 3 catches its network connection. On Linux, `auditd` rules on `execve` and `connect` give the same two facts.

**Detect on the network.** Netcat's traffic is usually cleartext, so a shell over it shows prompts and commands in the payload. Long-lived connections to unusual ports are worth a query in Zeek's `conn.log`. An IDS can match shell-like strings, though TLS, as with socat's `OPENSSL`, removes that option and leaves only metadata. Writing IDS rules covers this.

**Controls.** CIS Benchmarks cover removing unneeded packages. Allow-listing, such as App Control on Windows, stops unknown binaries from running at all.

?? An analyst sees `/usr/bin/cron` holding an outbound connection, with descriptors 0 to 2 as sockets. What's the best reading?
+ A renamed binary with a shell on a socket
- Normal behaviour, as cron reports its results over TCP
- A harmless artefact of how the proc filesystem works
- A sign the cron package is out of date
=> Cron has no reason to hold a socket on its standard streams. The name is the part an attacker controls, so trust behaviour over names.

## Pitfalls

- **"Netcat is a hacking tool, so finding it proves compromise."** Admins use it too. Investigate the context: who ran it, when, and what it connected to.
- **"Blocking inbound stops shells."** Reverse shells dial out. Inbound rules only solve half the problem.
- **"Matching the process name `nc` will catch it."** Renaming a binary takes one command. Detect the behaviour.
- **"It worked once, so the service is fine."** `nc -l` usually exits after one connection. Don't mistake that for a service dying.
- **Forgetting `-N`.** Without it, the client may hang after the file is sent, because the far side never sees the end of the stream. The manual documents `-N` for exactly this.
- **Treating `nc -z` as a scanner.** It answers one question about one port. For a survey, use [Nmap](/modules/01-07-scanning-in-depth/).

## Exercise

::: law Lab only
Run this on your own machine, on the loopback address, or between your own lab VMs on a host-only network. Connecting to or scanning systems you don't own can be illegal even if nothing breaks.
:::

Use two terminals. All of this was run while writing the module, on OpenBSD netcat 1.234.

1. **Chat.** Start `nc -l 127.0.0.1 49201`, connect from the second terminal, and type in both.
2. **Move a file and prove it.** Make a test file with `head -c 200000 /dev/urandom > send.bin`. Receive with `nc -l 127.0.0.1 49202 > recv.bin`. Send with `nc -N 127.0.0.1 49202 < send.bin`. Compare with `sha256sum send.bin recv.bin`, and both hashes must match.
3. **Be a web server.** Use the `printf` line from the Concept section, then run `curl -i http://127.0.0.1:49203/`. Read the request on the listener.
4. **Check a port.** Run `nc -zv 127.0.0.1 49204` with nothing listening, and note the exit code: 1, "Connection refused". Start a listener on 49205 and try again: exit code 0.
5. **Be the defender.** While a listener runs, find it with `ss -ltnp`, take its PID, and read `ls -l /proc/<pid>/fd`.
6. **See it.** Capture with `sudo tcpdump -i lo -A port 49201` while you chat. Your words are all there in plain text. Then explain to yourself what TLS would change, and what it wouldn't.

?! Write the detection you'd want for a reverse shell on a Linux web server. Say what you'd log, what would trigger the alert, and what an attacker could do to dodge it.

## Further reading

- [OpenBSD nc(1) manual](https://man.openbsd.org/nc.1), the precise reference for the options used here.
- [Ncat Users' Guide](https://nmap.org/ncat/guide/index.html), for TLS, access control and brokering.
- [socat manual](http://www.dest-unreach.org/socat/doc/socat.html), which is long but lists every address type.
- W. Richard Stevens, *UNIX Network Programming*, volume 1, for sockets at the level of system calls.
- [Beej's Guide to Network Programming](https://beej.us/guide/bgnet/), a free and friendly tour of the sockets API.
