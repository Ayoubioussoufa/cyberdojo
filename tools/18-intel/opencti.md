---
title: OpenCTI
summary: Organises threat intelligence into a connected knowledge base.
side: defence
use: open
docs: https://docs.opencti.io/
alt: misp
---
## What it's for
OpenCTI stores threat intelligence as a connected graph: threat actors, their tools, campaigns, techniques and the indicators they use, all linked. Where MISP excels at sharing indicators, OpenCTI excels at structuring knowledge.

## How it works
It's built on the STIX model, so entities and the relationships between them are first-class: this actor uses that malware, which performs these ATT&CK techniques. Connectors pull in data from feeds, MISP and ATT&CK itself. The result answers analytical questions, such as which techniques a given actor is known for, that a flat list of indicators can't.

## Try it
Run it from its Docker lab, import the ATT&CK data set through a connector, and explore how one threat actor links to its techniques and tools. Relate what you see to [attack models](/modules/09-01-attack-models/).

```
docker compose up -d
```

Start it on a lab machine from its compose file.

## What defenders see
It helps a team move from reacting to indicators toward understanding actors and techniques, which supports threat-informed defence: prioritising the techniques your likely adversaries actually use. As with any intelligence store, protect it and control access.

?! Why is modelling relationships between actors, tools and techniques more useful for strategy than a list of bad addresses?
