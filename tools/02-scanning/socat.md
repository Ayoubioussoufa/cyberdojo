---
title: socat
summary: Relays data between two endpoints of almost any kind.
side: both
use: own
docs: https://www.dest-unreach.org/socat/doc/socat.html
kali: socat
alt: netcat
---
## What it's for
socat is Netcat's more capable cousin. It joins two data channels, such as a TCP socket and a TLS socket, or a file and a serial port.

## How it works
Every run takes two addresses, and socat moves bytes between them in both directions. Address types cover TCP, UDP, TLS, Unix sockets, files and more. So one command can add TLS in front of a plain service, or forward a port to another machine. That flexibility makes it good for debugging, and a useful reminder of why tunnels are hard to spot.

## Try it
::: law Your lab only
Use it on your own machines.
:::

```
socat TCP-LISTEN:8080,fork TCP:192.168.56.10:80
```

This forwards local port 8080 to a lab web server, and `fork` handles each client separately. Test it with `curl http://127.0.0.1:8080`.

## What defenders see
A process on a server that relays between two sockets is suspicious. Look for `socat` in process logs, and for a host accepting connections and immediately making its own to another. See [proxies and tunnels](/modules/01-10-proxies-pivoting-and-tunnels/).

?! Why is an unexplained relay on a web server worth investigating, even though the traffic looks normal?
