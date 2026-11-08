---
title: Wazuh
summary: An open-source platform for endpoint detection and log analysis.
side: defence
use: open
docs: https://documentation.wazuh.com/
alt: osquery, elastic-stack
---
## What it's for
Wazuh is a free platform that collects data from your servers and laptops, checks it for problems, and shows the results in one place. It's a popular first SIEM and host monitor for smaller teams.

## How it works
An agent on each host reads logs, watches files for changes, checks settings against benchmarks, and reports to a central manager. The manager runs rules and raises alerts, with a dashboard built on OpenSearch. So it combines log management, file integrity monitoring and configuration auditing in one system. It grew from an older tool called OSSEC.

## Try it
```
docker compose -f generic/single-node/docker-compose.yml up -d
```

Run this from a copy of the Wazuh docker repository on a lab machine. Enrol one agent, change a watched file, and find the alert in the dashboard.

## What defenders see
This is a core defensive platform. File integrity monitoring catches changes to sensitive files, and its rules map to [ATT&CK](/modules/09-01-attack-models/). Protect the manager, since it holds security data from your whole estate, and keep agents updated.

?! File integrity monitoring alerts on a changed `/etc/passwd`. Why does that one file matter, and what would you check next?
