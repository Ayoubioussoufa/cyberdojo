---
title: Threat hunting
summary: Looking for what your alerts missed. Hypotheses, the long tail, beacon statistics, and how every hunt should leave your detection stronger than it found it.
level: intermediate
side: defence
minutes: 50
attack: T1071, T1059, T1078
needs: 0058-detection-engineering, 08-01-siem-query-languages
pair: 01-05-dns-in-depth, 01-10-proxies-pivoting-and-tunnels, 07-05-deception, 08-03-purple-teaming
source: SANS, The Who, What, Where, When, Why and How of Effective Threat Hunting | https://www.sans.org/white-papers/36785/
words: hypothesis, stack counting, beaconing analysis
---
Alerts only catch what somebody predicted. Threat hunting starts from a different assumption: an intruder may already be here, and nothing has fired. A hunter forms an idea of how they might be hiding, then looks for evidence. Most hunts find no intruder, and that's fine, because a good hunt always produces something useful.

@term threat hunting = Proactively searching for malicious activity that existing detections missed.
@term stack counting = Counting how often each value occurs, then studying the rarest.
@term jitter = Random variation added to an interval, as attackers do to make beacons less regular.

## Concept

### Fundamentals: not the same as triage

| | Alert triage | Hunting |
|---|---|---|
| Starts from | An alert | A hypothesis |
| Assumes | This might be bad | Something got past us |
| Output | A verdict | New detections, findings or gaps |
| Timing | As it arrives | Planned |

The classic [hunting loop](https://www.threathunting.net/files/framework-for-threat-hunting-whitepaper.pdf) has four steps.

@flow Form a hypothesis > Investigate with data > Find patterns > Automate what worked

### Good hypotheses

A hypothesis must be testable, with data you actually have. "We've been hacked" isn't one. Compare:

> *Attackers with stolen credentials may be logging on to servers from workstations that never did before.*

That points to a data source (4624 events), a comparison (a baseline of source-to-destination pairs), and a time window. Hypotheses come from threat intelligence, ATT&CK gaps, a recent incident, or something odd that you noticed. Choose by asking what would hurt most, and what your detections don't cover. [PEAK](https://www.splunk.com/en_us/blog/security/peak-threat-hunting-framework.html) sorts hunts into hypothesis-driven, baseline and model-assisted.

### Stack counting and the long tail

Attackers are rare, so sort by rarity. Group a field, count, and read the bottom of the list.

```
DeviceProcessEvents
| where Timestamp > ago(30d)
| summarize Hosts = dcount(DeviceName) by FileName, FolderPath
| where Hosts <= 2
```

A program in a strange path, found on one machine out of 5,000, deserves a look. Stack on parent-child pairs, autoruns, services, scheduled tasks, or user-agents. The rest is judgement, because rare isn't the same as bad.

### Beacons

Malware checks in with its controller. Content may be encrypted, but behaviour isn't, so timing gives it away: many connections to one destination at near-regular intervals, of similar size.

To measure it, take the gaps between connections for each source-destination pair, then look at how much those gaps vary. Low variation suggests a machine, not a person. **Jitter** adds noise, so attackers randomise by some percentage, and yet the distribution stays unusually tight. Tools like [RITA](https://github.com/activecm/rita) score this from Zeek logs. Expect false positives: software updates, telemetry and NTP all beacon, so build an allow-list.

### Advanced: hunting at scale

**Frequency versus prevalence.** A domain visited by one host in the whole company is more interesting than one visited often.

**Living-off-the-land hunts.** Malware may look like admin work, so hunt on context: `certutil` downloading a file, or `wmic` run by a service account. The data comes from [Windows logs](/courses/0033-windows-logging-and-sysmon/).

**Peer groups.** Compare a user with their peers, as accountants rarely run PowerShell.

**ML assistance.** Clustering or anomaly detection can rank what you read. Remember the base-rate trap from lesson 76: in a huge dataset, a 1% false-positive rate is thousands of events.

**Measure the programme.** Count detections produced, data gaps found, and dwell time, and not just "threats found".

?? What should a finished hunt always produce?
+ A detection, a finding, or documented gap
- A new firewall rule for the network
- A signed report for the external regulator
- A list of users needing new training
=> Even a hunt that finds nothing teaches something: either a new rule, a data gap to fix, or evidence that this path looks clean.

## Threat model

Hunters focus on what signatures miss: [C2 over normal protocols](https://attack.mitre.org/techniques/T1071/), [command interpreters](https://attack.mitre.org/techniques/T1059/) and [valid accounts](https://attack.mitre.org/techniques/T1078/). Skilled attackers try to blend in with normal activity, by working office hours, using admin tools, and keeping volumes low. So hunting depends on knowing your own environment better than they do.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| SIEM or data lake | Long retention | Hypotheses over weeks |
| Velociraptor, osquery | Live endpoint queries | Fleet-wide questions |
| Zeek with RITA | Beacon and DNS analysis | Network hunting |
| Jupyter with pandas | Ad hoc analysis | Statistics beyond your SIEM |
| [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) | Coverage maps | Choosing what to hunt |
| Sysmon | Rich host telemetry | Feeding hunts |

## Defence

- **Write down each hunt:** hypothesis, data, query, result, next step. It's your memory as a team.
- **Turn hunts into detections.** Anything found twice by hand should be automated.
- **Fix data gaps** as first-class findings. "We couldn't answer this" is a result.
- **Schedule it.** Reserve time, or the alert queue will eat it.
- **Keep retention long enough.** Attackers often stay for weeks, so 7 days of logs can't answer the question.

## Pitfalls

- **Hunting without data.** Check that the logs exist before you plan.
- **"We found nothing, so it was wasted."** You tested an assumption. Record it.
- **Confirmation bias.** Write down what would prove the hypothesis wrong.
- **Rare means bad.** Unusual business software fills the long tail.
- **Reacting to every IOC feed.** Searching for hashes is a sweep, not a hunt.

?? Why is beaconing found by interval analysis rather than by content?
+ Timing survives even when payloads are encrypted
- Beacons always contain one fixed text string
- Firewalls log only timing, and never addresses
- Encrypted traffic can't be seen at all
=> Encryption hides the content, but the rhythm of connections stays visible in connection logs.

## Exercise

::: law Lab only
Hunt only in your lab, or in training datasets. Run any simulated beacon between your own VMs.
:::

1. Write a small Python script on a lab VM that requests a local web server every 60 seconds, with 10% jitter. Leave it running for an hour, among normal traffic.
2. Using Zeek's `conn.log` and pandas, compute the mean and standard deviation of intervals per destination. Does your script stand out?
3. Run RITA over the same logs, and compare its score with yours.
4. Write a hypothesis about a technique from your ATT&CK coverage gaps. List the data you'd need, then check that you have it.
5. Stack parent-child process pairs from your Sysmon logs. Read the bottom 20.

?! Write a one-page hunt plan on a threat of your choice: hypothesis, data, query idea, what a true finding would look like, and which alert you'd build from it.

## Further reading

- [SANS paper on effective threat hunting](https://www.sans.org/white-papers/36785/).
- [The PEAK framework](https://www.splunk.com/en_us/blog/security/peak-threat-hunting-framework.html).
- [A Framework for Cyber Threat Hunting](https://www.threathunting.net/files/framework-for-threat-hunting-whitepaper.pdf), by Sqrrl.
- [RITA](https://github.com/activecm/rita).
- [Red Canary Threat Detection Report](https://redcanary.com/threat-detection-report/), for what's common in the wild.
