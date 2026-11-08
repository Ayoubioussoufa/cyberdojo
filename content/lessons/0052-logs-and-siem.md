---
title: Log sources and the SIEM
summary: What each log proves, how a SIEM turns logs into searchable data, what it costs, and how to write queries that answer questions.
month: 9
minutes: 50
builds: write the three gate queries from memory
source: Must Learn KQL, free series | https://github.com/rod-trent/MustLearnKQL
words: SIEM, normalization, correlation
---
No single log tells the whole story. Your skill is knowing which log can answer which question, and getting the answer quickly. A **log** is simply a file or stream of lines that a system writes about what it did. Everything in this lesson is about turning millions of those lines into one clear answer.

@term SIEM = Security information and event management: a system that collects logs from everywhere so you can search and alert on them.
@term normalization = Converting different log formats into a common set of fields.
@term correlation = Linking events from different sources into one story.
@term KQL = Kusto Query Language, used by Microsoft Sentinel and Defender.
@term SPL = Search Processing Language, used by Splunk.
@term ES|QL = Elasticsearch's piped query language.
@term retention = How long logs are kept.
@term Wazuh = A free open-source security monitoring platform.
@term auditd = The Linux auditing system, which records security-relevant events.
@term ingestion = The process of receiving logs into a system. SIEMs often charge by the amount.

## What each log proves

Each source sees part of the picture, and each has a blind spot.

| Source | Answers | Can't tell you |
|---|---|---|
| Windows Security | Who logged on, what changed (4624, 4720) | What command they ran |
| Sysmon | What ran, with which command line and parent (ID 1) | Who was at the keyboard |
| Linux auditd, auth.log | Logins, sudo, watched files | Anything on other machines |
| EDR | Rich process and file activity | Devices without the agent |
| Firewall | Allowed or blocked connections | What was inside them |
| Proxy | Web destinations | Traffic that skipped the proxy |
| DNS | Which host looked up which name | Whether it then connected |
| Email gateway | Who received what | What they did next |
| Cloud audit logs | Who called which API (CloudTrail) | What happened inside a server |

That last column is why you combine sources. A firewall shows that a laptop connected to an address. DNS shows the name it looked up. Sysmon shows which program did it. Together, that's a story.

@drill log-source

?? You want to know which program on a laptop connected to a suspicious address. Which log answers that?
+ Sysmon network events, with the process image
- The firewall log, showing only two addresses
- The email gateway, showing recent messages received
- The DNS log, showing the resolved name
=> Firewalls see addresses and ports, not programs. Host telemetry such as Sysmon ID 3 links a connection to the process that made it.

## What a SIEM does

@flow Collect > Parse > Normalize > Store > Correlate and alert > Search

Follow one failed login through it:

```
Raw:   Oct 27 09:14:02 web1 sshd[811]: Failed password for root from 203.0.113.7 port 44210 ssh2
Parsed: time=09:14:02 host=web1 program=sshd outcome=failure user=root src_ip=203.0.113.7
```

The **parser** turned one sentence into named fields. **Normalization** then makes the names consistent: if one source says `src_ip` and another says `client`, you can't join them, so both become one common name. It's the unglamorous key. When parsing silently breaks, a dashboard shows nothing and looks reassuring, so check real events before you trust it.

**Correlation** links events: "five failures, then a success, from the same IP, within ten minutes".

?? A dashboard shows zero failed logins for a week, on a busy public server. What should you suspect first?
+ Parsing or log collection has quietly broken
- The attackers have given up on it
- The server has become fully secure now
- Failed logins no longer happen on servers
=> A public server without failures is very unlikely. An empty chart often means a broken pipeline, so check the raw events.

## Retention and cost

Logs cost money to store and search, and SIEMs often price by how much you ingest. So teams choose:

| Tier | Typical use | Trade-off |
|---|---|---|
| Hot | Searchable now, for days or weeks | Expensive |
| Cold | Archived, for months | Cheap, slow to search |
| Dropped | Noisy debug logs | Free, gone for good |

An intrusion is often found long after it began, so if **retention** is 30 days and the attacker arrived 60 days ago, the evidence has gone. Deciding what to keep is a security decision, and sometimes a legal one.

?? An attacker got in 90 days ago, and your SIEM keeps 30 days of logs. What's the consequence?
+ The earliest evidence may be gone forever
- The SIEM will restore those logs itself
- Those older events were never written anywhere
- The attacker's activity becomes legally allowed then
=> Unless older logs were archived somewhere, you can't reconstruct the start. Retention is decided before an incident, not during.

## Queries that answer questions

A query is a question. These read like your Month 1 pipeline, and they all have one shape: **filter, then group and count, then sort**.

**Failed logons by source, in KQL:**

```
SecurityEvent
| where EventID == 4625
| summarize Failures = count() by IpAddress
| sort by Failures desc
```

Read it line by line: take the table, keep failed logons, count per IP, biggest first.

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

## Practise the three gate queries

These missions use a shell, so you can practise the logic with tools you already know, on a real-looking export.

@range siem

::: try Build your lab SIEM
Deploy [Wazuh](https://documentation.wazuh.com/) and onboard Windows with Sysmon, Linux with auditd, and your firewall. Verify parsing on real events. That's the start of [P06](/projects/P06/).
:::

?! Name the log you'd check first for each: a suspicious login, a malicious domain lookup, a deleted cloud bucket. Explain why.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [NIST SP 800-92: Guide to Computer Security Log Management](https://csrc.nist.gov/pubs/sp/800/92/final)
- [Sigma: a common format for detection rules](https://sigmahq.io/)
