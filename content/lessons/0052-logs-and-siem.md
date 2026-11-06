---
title: Log sources and the SIEM
summary: What each log proves, how a SIEM turns logs into searchable data, and how to write queries that answer questions.
month: 9
minutes: 35
builds: write the three gate queries from memory
source: Must Learn KQL, free series | https://github.com/rod-trent/MustLearnKQL
words: SIEM, normalization, correlation
---
No single log tells the whole story. Your skill is knowing which log can answer which question, and getting the answer quickly.

@term SIEM = Security information and event management: a system that collects logs from everywhere so you can search and alert on them.
@term normalization = Converting different log formats into a common set of fields.
@term correlation = Linking events from different sources into one story.
@term KQL = Kusto Query Language, used by Microsoft Sentinel and Defender.
@term SPL = Search Processing Language, used by Splunk.
@term retention = How long logs are kept.
@term Wazuh = A free open-source security monitoring platform.
@term auditd = The Linux auditing system, which records security-relevant events.

## What each log proves

| Source | Answers | Example |
|---|---|---|
| Windows Security | Who logged on, what changed | 4624, 4720 |
| Sysmon | What ran, with which command line and parent | ID 1 |
| Linux auditd, auth.log | Logins, sudo, watched files | |
| EDR | Rich process and file activity | |
| Firewall | Allowed or blocked connections | |
| Proxy | Web destinations | |
| DNS | Which host looked up which name | |
| Email gateway | Who received what | |
| Cloud audit logs | Who called which API | CloudTrail |

@drill log-source

## What a SIEM does

@flow Collect > Parse > Normalize > Store > Correlate and alert > Search

**Normalization** is the unglamorous key: if one source says `src_ip` and another says `client`, you can't join them. Check parsing on real events before you trust a dashboard. **Retention** costs money, so teams choose what to keep and for how long, and an incident discovered months later may find nothing left.

@flow Agents on hosts > Log pipeline > SIEM > Analyst

## Queries that answer questions

A query is a question. These read like your Month 1 pipeline.

**Failed logons by source, in KQL:**

```
SecurityEvent
| where EventID == 4625
| summarize Failures = count() by IpAddress
| sort by Failures desc
```

**New service installed:**

```
Event
| where EventLog == "System" and EventID == 7045
| project TimeGenerated, Computer, RenderedDescription
```

**Rare parent and child process pairs**, from Sysmon data:

```
SysmonEvent
| where EventID == 1
| summarize Count = count() by ParentImage, Image
| sort by Count asc
```

Table names vary by environment, so treat these as shapes. The gate asks you to write those three from memory. Splunk's SPL follows the same logic: `index=wineventlog EventCode=4625 | stats count by src_ip | sort -count`.

?? You want the top source of failed logins. Which pattern is right?
+ Filter, then group and count, then sort
- Sort, delete, then search the raw text
- Count everything first, then filter the total
- Join every table, then read each row
=> It's your `grep | sort | uniq -c | sort -rn` shape again, in another language.

::: try Build your lab SIEM
Deploy [Wazuh](https://documentation.wazuh.com/) and onboard Windows with Sysmon, Linux with auditd, and your firewall. Verify parsing on real events. That's the start of [P06](/projects/P06/).
:::

?! Name the log you'd check first for each: a suspicious login, a malicious domain lookup, a deleted cloud bucket. Explain why.
