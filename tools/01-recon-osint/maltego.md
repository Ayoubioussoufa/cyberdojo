---
title: Maltego
summary: Draws links between people, domains and infrastructure on a graph.
side: both
use: own
docs: https://docs.maltego.com/
kali: maltego
alt: spiderfoot, recon-ng
---
## What it's for
Maltego turns OSINT into a graph. Investigators use it to see how domains, addresses, people and companies connect.

## How it works
You place an entity, such as a domain, on a canvas, then run **transforms**: queries that return related entities, drawn as new nodes. Transforms run on remote servers and call data partners, so your target isn't touched by most of them. A graph is worth having because humans spot clusters and bridges on it, which a list would hide. The free Community Edition limits results and transforms.

## Try it
::: law Your domain only
Map your own domain. Graphs of real people can fall under privacy law, so handle them with care.
:::

Create a graph, add your domain, and run the DNS transforms. Then add mail servers and look at which hosts share an address. It's a graphical tool, so there's no command to learn.

## What defenders see
It leaves few traces. For defenders it's more of an analysis tool: threat intelligence teams use it to map attacker infrastructure, and link a phishing domain to others that share a registrar or name server.

?! Name one thing a graph shows you that the same data in a spreadsheet would hide.
