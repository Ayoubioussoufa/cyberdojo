---
title: Sharing threat intelligence
summary: STIX, TAXII, OpenCTI and information sharing communities. How to move intelligence between tools, judge a feed's quality, and turn reports into something a SOC can use.
level: intermediate
side: defence
minutes: 40
attack: none
needs: 0066-threat-intelligence
pair: 09-03-threat-actors
source: OASIS STIX 2.1 Specification | https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html
words: STIX, TAXII, priority intelligence requirement
---
A threat report in a PDF helps one reader. The same facts in a structured format can reach your SIEM, EDR and firewall in minutes. But more data isn't more intelligence, and most feeds are noise. This module covers the standards for sharing, and the judgement to decide what deserves your attention.

@term TAXII = A protocol for exchanging threat intelligence over HTTPS.
@term priority intelligence requirement = A question that leadership needs answered, which directs intelligence work.
@term ISAC = An Information Sharing and Analysis Center, a sector community for sharing threat information.

## Concept

### Fundamentals: structured intelligence

[STIX 2.1](https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html) describes intelligence as a graph of objects and relationships.

| Object | Example |
|---|---|
| Threat Actor | A named group |
| Campaign | A set of linked intrusions |
| Intrusion Set | Tools and behaviour attributed to one source |
| Attack Pattern | A technique, usually mapped to ATT&CK |
| Malware, Tool | A family, or a utility |
| Indicator | A detection pattern |
| Observed Data | What was actually seen |
| Vulnerability | A CVE |
| Relationship | `uses`, `targets`, `indicates` |

A small Indicator object looks like this:

```json
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
  "created": "2026-11-07T10:00:00.000Z",
  "modified": "2026-11-07T10:00:00.000Z",
  "pattern": "[domain-name:value = 'bad.example']",
  "pattern_type": "stix",
  "valid_from": "2026-11-07T10:00:00Z",
  "confidence": 70
}
```

Notice `confidence` and `valid_from`, and that it's a machine-readable statement with context attached. **[TAXII 2.1](https://docs.oasis-open.org/cti/taxii/v2.1/taxii-v2.1.html)** is the transport: servers publish collections, and clients fetch them over HTTPS.

### Communities

| Community | Who |
|---|---|
| ISACs, such as FS-ISAC | One sector |
| National CERTs | One country |
| MISP communities | Trust groups |
| ISAOs | Other groupings |

Sharing relies on trust. **TLP** labels, from lesson 66, say how far each item may travel. In practice, the best intelligence often comes through a phone call between people who trust one another.

### Advanced: from feed to decision

Good intelligence starts with a question rather than a feed. **Priority intelligence requirements** state what leaders need, such as "which ransomware groups are targeting our sector?"

**Assess feed quality:**

| Question | Why |
|---|---|
| Relevance | Does it touch our sector and technology? |
| Timeliness | How old is it when it arrives? |
| Accuracy | How many false positives did it produce? |
| Uniqueness | Do we already get this? |
| Context | Does it say why it matters? |

Many indicators die fast, as the Pyramid of Pain shows. An IP address can be reused by an innocent site tomorrow, so **indicators must expire**. Automatic blocking from an unvetted feed has taken down legitimate services.

Measure outcomes. How many alerts were true, and how many hunts did intelligence drive? If a feed produces nothing useful for a quarter, stop paying for it.

**Platforms.** MISP is strong for sharing events. [OpenCTI](https://docs.opencti.io/) builds a knowledge graph on STIX, and it integrates well with ATT&CK. Your project P12 used MISP, and the same habits apply.

?? What is the difference between STIX and TAXII?
+ STIX describes intelligence, and TAXII transports it
- STIX encrypts intelligence, and TAXII stores it
- STIX is for Windows, and TAXII Linux
- STIX is commercial, and TAXII free software
=> STIX is the language, and TAXII is the delivery service over HTTPS.

## Threat model

Intelligence itself can be attacked. Adversaries may poison a feed, plant fake indicators that block legitimate services, or read shared data through a compromised member. Over-sharing incident details can tip off an attacker. Treat outside data as untrusted input, and don't let a feed push rules directly into blocking without checks.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| MISP | Sharing platform | Community sharing |
| OpenCTI | Knowledge graph | Analyst workspace |
| Python `stix2` | Builds and reads STIX | Automation |
| `taxii2-client` | Fetches collections | Integrating feeds |
| CISA AIS | Free US government sharing | Baseline indicators |

## Defence

- **Write down your requirements first.**
- **Assign indicators an expiry date.**
- **Test before blocking.** Send new feeds to alert-only mode.
- **Track each feed's value** with a scorecard.
- **Add context,** such as "why we care", when you pass something on.
- **Mark everything with TLP,** and respect others' markings.
- **Contribute back.** Communities die when everyone only takes.

## Pitfalls

- **More feeds equals more security.** It usually equals more noise.
- **Treating an IOC as permanent.**
- **Blocking automatically on low-confidence data.**
- **Ignoring TLP.** One careless forward can lose you a community's trust.
- **Reporting intelligence that nobody asked for.** If it changes no decision, it isn't useful.

?? What makes an indicator feed useful for a SOC?
+ Relevance, context and an expiry date attached
- Millions of entries from any free source
- A very large number of old hashes
- An automatic block on every listed address
=> Value comes from fit and context. Stale or unexplained data creates work without creating safety.

## Exercise

::: law Lab only
Use your own lab instance and public feeds. Respect the TLP marking on anything you receive, and don't share a closed community's data.
:::

1. With Python's `stix2` library, build an Indicator, a Malware object and a Relationship between them. Print the JSON bundle.
2. Run MISP or OpenCTI in Docker. Import a public feed.
3. Map one public threat report into STIX by hand: actor, malware, three techniques.
4. Write a script that drops indicators older than 30 days.
5. Score one free feed against the five questions above, using a week of data from your lab.

?! Write three priority intelligence requirements for a Moroccan hospital group, and name the source you'd use to answer each.

## Further reading

- [STIX 2.1](https://docs.oasis-open.org/cti/stix/v2.1/stix-v2.1.html) and [TAXII 2.1](https://docs.oasis-open.org/cti/taxii/v2.1/taxii-v2.1.html).
- [FIRST TLP 2.0](https://www.first.org/tlp/).
- [MISP documentation](https://www.misp-project.org/documentation/).
- [OpenCTI documentation](https://docs.opencti.io/).
- [NIST SP 800-150](https://csrc.nist.gov/pubs/sp/800/150/final), a guide to cyber threat information sharing.
