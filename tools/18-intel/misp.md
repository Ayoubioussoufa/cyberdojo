---
title: MISP
summary: An open-source platform for storing and sharing threat intelligence.
side: defence
use: open
docs: https://www.misp-project.org/documentation/
alt: opencti, yara
---
## What it's for
When one organisation spots an attack, others can defend against it, if the details are shared. MISP is the widely used open-source platform for storing indicators of compromise and sharing them between teams and communities.

## How it works
It stores events, each a set of attributes such as malicious addresses, domains, file hashes and patterns. Organisations in a sharing community exchange these automatically, with controls over what's shared with whom. The indicators can be exported straight into detection tools, so intelligence becomes detection. [CTI sharing](/modules/09-04-cti-sharing/) covers the practice and its standards.

## Try it
::: law Lab or authorised sharing
Share only data you're permitted to, and respect each item's sharing level.
:::

Run MISP from its training VM, create an event with a few indicators, tag it with its sharing level, and export the indicators in a format a detection tool could read.

## What defenders see
MISP turns scattered reports into usable defence. The discipline that makes it work is good data: accurate indicators, clear sharing levels, and context so others can judge relevance. Feeding its indicators into your SIEM and firewalls closes the loop from intelligence to action.

?! Why does an indicator need context and a sharing level, not just the value itself, to be useful to others?
