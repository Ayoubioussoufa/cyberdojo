---
title: Elastic Stack
summary: Stores and searches huge volumes of logs, with dashboards.
side: defence
use: open
docs: https://www.elastic.co/guide/
aka: ELK, Elasticsearch, Kibana
alt: wazuh, sigma
---
## What it's for
The Elastic Stack, long known as ELK, is a common home for security logs. It stores enormous volumes, searches them fast, and draws dashboards, which makes it a frequent SIEM foundation.

## How it works
Three parts work together. **Elasticsearch** stores and indexes documents such as log lines. **Logstash** or Beats agents collect and transform logs on the way in. **Kibana** is the web interface for search and dashboards. Good field naming, following the Elastic Common Schema, is what makes searches across different log sources actually work, and it's the part teams most often skimp on.

## Try it
```
docker compose up -d
```

Run this from an Elastic lab compose file on a test machine. Load some sample logs, then build a Kibana dashboard that shows failed logins over time.

## What defenders see
It's a core defensive platform, and a target, since it holds your security data. Protect it with authentication and encryption, limit who can query it, and keep an eye on its own access logs. [SIEM query languages](/modules/08-01-siem-query-languages/) covers searching it well.

?! Why does a consistent naming scheme for log fields matter so much when you search across many sources?
