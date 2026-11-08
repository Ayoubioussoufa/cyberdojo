---
title: Sigma
summary: A shared, tool-independent format for writing detection rules.
side: defence
use: open
docs: https://sigmahq.io/
aka: sigma rules
alt: suricata, elastic-stack
---
## What it's for
Every SIEM has its own query language, so a detection written for one doesn't work on another. Sigma solves this: you write the logic once in YAML, then convert it to your platform's query.

## How it works
A Sigma rule describes a pattern in log data: fields, values and a condition. A converter, such as `sigma-cli` with a backend, turns it into a query for Splunk, Elastic, Sentinel or others. So detection knowledge becomes portable, and the community [SigmaHQ repository](https://github.com/SigmaHQ/sigma) shares thousands of rules. It's for log data, where Snort and Suricata rules are for live traffic.

## Try it
```
pip install sigma-cli
sigma convert -t splunk rules/my_rule.yml
```

Write a rule for Windows event 4625, a failed logon, then convert it to two different backends and compare the output.

## What defenders see
Sigma is central to modern [detection engineering](/courses/0058-detection-engineering/). Keep your rules in version control, test them against real logs, and map each to [ATT&CK](/modules/09-01-attack-models/) so you can see your coverage. A shared format also means you can use others' detections quickly when a new threat appears.

?! Why is a tool-independent rule format valuable to a team that might change its SIEM in a few years?
