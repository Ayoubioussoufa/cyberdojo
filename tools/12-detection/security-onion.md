---
title: Security Onion
summary: A ready-made Linux distribution for network security monitoring.
side: defence
use: open
docs: https://docs.securityonion.net/
alt: suricata, zeek, elastic-stack
---
## What it's for
Building a monitoring stack from parts is a lot of work. Security Onion packages it: [Suricata](/tools/suricata/), [Zeek](/tools/zeek/), [Arkime](/tools/arkime/) and an Elastic back end, set up to work together. It's the fastest way to get a real blue-team lab running.

## How it works
It captures traffic from a monitored interface, runs it through Suricata for alerts and Zeek for logs, optionally stores full packets with Arkime, and presents everything in one interface for hunting and case work. So one install gives you alerts, rich logs and packets, already joined up. It also takes host logs from agents, which makes it a small SIEM as well as a network monitor.

## Try it
::: law Your network only
Monitor a network you own. Captured traffic is sensitive.
:::

Install it in a VM with two network interfaces, one for management and one for monitoring. Send it a practice capture with [tcpreplay](/tools/tcpreplay/), then find the same event three ways: as a Suricata alert, in Zeek's logs, and in the stored packets.

## What defenders see
This is a complete defender's platform for a lab or a small network. Place the monitoring interface where it sees the traffic that matters, size the storage for how long you keep data, and tune alerts so the important ones aren't buried. It's the practical home for much of the [blue team](/modules/08-02-threat-hunting/) material.

?! Seeing one event as an alert, a log entry and a packet capture gives three views. What does each add that the others don't?
