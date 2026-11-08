---
title: Velociraptor
summary: Hunts across many endpoints and collects evidence at scale.
side: defence
use: open
docs: https://docs.velociraptor.app/
alt: osquery, wazuh
---
## What it's for
When you suspect a compromise across hundreds of machines, you need to ask all of them a question at once. Velociraptor does exactly that, for hunting and incident response.

## How it works
It extends the idea behind osquery with its own query language, VQL, and a library of hunts. A server pushes a query to every agent, which answers from live state and from forensic artifacts such as browser history or event logs. So one hunt can gather the same evidence from a whole fleet in minutes, which is transformative during an incident.

## Try it
```
velociraptor gui
```

This starts a self-contained lab server and a local client. Run a hunt that lists scheduled tasks, and read the results in the interface.

## What defenders see
It's a powerful responder's tool, and that power cuts both ways: an attacker who seized the server could reach every endpoint. So protect it strongly, with multi-factor access and an audit log. [Incident response](/courses/0059-incident-response/) puts it in context.

?! Why does the ability to query every endpoint at once make the Velociraptor server a high-value target?
