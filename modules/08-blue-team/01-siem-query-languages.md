---
title: SIEM platforms and query languages
summary: The same question in Splunk SPL, Microsoft KQL and Elastic ES|QL. How data models make queries portable, and how to think in pipelines instead of memorising syntax.
level: foundation
side: defence
minutes: 50
attack: T1110, T1078
needs: 0052-logs-and-siem, 0058-detection-engineering
source: Microsoft, Kusto Query Language overview | https://learn.microsoft.com/en-us/kusto/query/
words: SPL, KQL, normalisation
---
Lesson 52 used SQL-style shapes to query logs. In a job, you'll meet whichever SIEM your employer bought, and that could be Splunk, Sentinel, Elastic or another. The good news is that they all share one way of thinking. Learn the pipeline once, and each new syntax takes about a day.

@term SIEM query pipeline = A query written as a series of steps, each taking the previous step's rows.
@term log normalisation = Mapping fields from different sources onto one shared schema, so that one query covers them all.

## Concept

### Fundamentals: think in pipelines

Nearly every investigation has the same shape: **select, filter, shape, aggregate, compare**. Here's one question, "which sources failed to log on more than 20 times?", in three languages.

**Splunk SPL**
```
index=wineventlog EventCode=4625
| stats count by src_ip
| where count > 20
| sort - count
```

**Kusto KQL** (Microsoft Sentinel, Defender, Azure Monitor)
```
SecurityEvent
| where EventID == 4625
| summarize Failed = count() by IpAddress
| where Failed > 20
| order by Failed desc
```

**Elastic ES|QL**
```
FROM logs-*
| WHERE event.code == "4625"
| STATS failed = COUNT(*) BY source.ip
| WHERE failed > 20
| SORT failed DESC
```

They're the same five ideas. Note a naming trap: **KQL** means *Kusto Query Language* to Microsoft, and *Kibana Query Language* in Elastic, where it's a much simpler filter syntax.

| Idea | SPL | Kusto | ES\|QL |
|---|---|---|---|
| Filter | `search`, `where` | `where` | `WHERE` |
| Add a field | `eval` | `extend` | `EVAL` |
| Choose fields | `table` | `project` | `KEEP` |
| Aggregate | `stats` | `summarize` | `STATS` |
| Time buckets | `bin _time span=5m` | `bin(TimeGenerated, 5m)` | `DATE_TRUNC` |
| Join | `join`, `lookup` | `join`, `lookup` | `LOOKUP JOIN` |

### What the platform does

A SIEM collects, parses, stores, indexes and searches. Differences that matter to you are cost and shape. Splunk indexes at ingest, and it has long been priced on volume. Sentinel is cloud-native, with deep Microsoft integration. Elastic is flexible, and self-hostable. Wazuh is open source, and it combines host agents with a SIEM view, as your projects used.

### Normalisation

Windows calls it `IpAddress`, a firewall says `src`, and Linux logs say `rhost`. Without a common schema, a detection needs one version per source. So each ecosystem has one:

| Schema | Used by |
|---|---|
| CIM | Splunk |
| ECS | Elastic |
| ASIM | Microsoft Sentinel |
| OCSF | Open, multi-vendor |

**Sigma** rules, from lesson 58, sit above these: one rule converts to each platform's language.

### Advanced: sequences, baselines and joins

Single events catch little. Attacks are sequences.

Elastic's **EQL** states them directly:

```
sequence by host.name with maxspan=5m
  [ process where process.name == "winword.exe" ]
  [ process where process.parent.name == "winword.exe" and process.name == "powershell.exe" ]
```

Kusto and SPL do this with joins or `transaction`, which are costly, so restrict the time window. **Baselining** compares now with normal: in Kusto, `make-series` and `series_decompose_anomalies` find outliers, and in SPL you'd use `eventstats` or `streamstats`.

**Enrichment** with lookups adds asset owner, known-good lists or threat intel at query time, and this is what makes results easy to act on.

Cost discipline matters at scale. Filter first and on indexed fields, restrict time, and aggregate last. A query that scans a year of logs can cost real money and slow everyone down.

?? What does a normalised schema such as ECS or ASIM give you?
+ One query across many different log sources
- Faster disks for storing the raw logs
- Automatic removal of every false positive alert
- Encrypted transport from each agent to storage
=> Mapping fields to shared names means that a detection for `source.ip` works on firewall, Windows and cloud logs alike.

## Threat model

These queries exist to find behaviour, such as [password guessing](https://attack.mitre.org/techniques/T1110/) and misuse of [valid accounts](https://attack.mitre.org/techniques/T1078/). Attackers know that SIEMs depend on parsers and retention. A log format your parser doesn't understand, or a source you never onboarded, is a blind spot. A SIEM can't alert on what it doesn't ingest.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [Splunk BOTS](https://github.com/splunk/botsv3) | Free dataset and scenario | Practising SPL |
| [KC7](https://kc7cyber.com/) | Free KQL detective game | Learning Kusto |
| [Azure Data Explorer sample](https://dataexplorer.azure.com/clusters/help) | Free cluster to run KQL | Trying queries instantly |
| Elastic Security | Rules and EQL | Self-hosted lab |
| `sigma-cli` | Converts Sigma rules | Writing once, deploying anywhere |
| Wazuh | Open-source SIEM and XDR | Your own lab |

## Defence

- **Keep an inventory of log sources**, with the owner, the retention and whether the parser works.
- **Monitor ingestion.** Alert when a source goes quiet, because silence is a failure.
- **Write queries with time bounds**, and save tested ones in version control.
- **Test parsers** after each upgrade of the log source.
- **Use tiers.** Keep hot logs for investigation and cold logs for retention, based on what you'll actually query.
- **Protect the SIEM itself.** Audit who can edit rules and delete data.

## Pitfalls

- **Learning syntax instead of data.** Knowing what `4625` means matters more than the keyword.
- **Time zones.** Sources may log local time, and a mismatch ruins a timeline.
- **Unbounded queries.** Always set a time range.
- **Assuming a field exists.** A parser failure leaves it blank, and your query quietly finds nothing.
- **Confusing the two KQLs.** Check which one a guide means.
- **Trusting zero results.** Zero could mean no attack, or a broken pipeline. Test with a known event first.

?? Why filter first and aggregate last in a SIEM query?
+ Early filters cut the data scanned later
- Aggregates refuse to run without a filter
- Filters run only after aggregation has finished
- Later stages always delete the original logs
=> Each pipeline step works on what the previous one kept, so an early filter reduces the work for everything after it.

## Exercise

::: law Lab only
Use free datasets, training platforms and your own lab logs. Don't query production data for practice.
:::

1. Open the free Azure Data Explorer sample cluster, and run a `summarize` on the `StormEvents` table.
2. Complete the first case on KC7.
3. Take the failed-logon question, and write it in SPL, Kusto and ES|QL from memory.
4. Add a time bucket: failures per source per 5 minutes. Which step changed in each language?
5. Convert one Sigma rule from your lab with `sigma-cli` into two back ends, and compare the output.
6. Write a query that finds log sources with no events in the last hour.

?! Your company is moving from Splunk to Sentinel. List what would have to change for detections, and what wouldn't. Say which risk worries you most.

## Further reading

- [Kusto Query Language documentation](https://learn.microsoft.com/en-us/kusto/query/).
- [Splunk Search Reference](https://help.splunk.com/en/splunk-enterprise/search/spl-search-reference).
- [Elastic ES|QL reference](https://www.elastic.co/docs/reference/query-languages/esql).
- [OCSF](https://schema.ocsf.io/), the open schema.
- [Sigma](https://sigmahq.io/docs/), and its rule repository.
