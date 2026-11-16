---
title: Threat intelligence
summary: The intelligence cycle, levels of intelligence, the Diamond Model, confidence language and TLP, and turning reports into detections.
month: 15
minutes: 75
builds: a short intelligence report with tested detections
source: MITRE ATT&CK CTI training | https://attack.mitre.org/resources/learn-more-about-attack/training/cti/
words: intelligence requirement, Diamond Model, TLP
---
Threat intelligence isn't a feed of bad IPs. It's analysis that helps someone make a better decision. If it changes nothing, it wasn't intelligence.

@term intelligence requirement = The specific question that intelligence work is meant to answer.
@term Diamond Model = A model describing an intrusion by adversary, capability, infrastructure and victim.
@term TLP (Traffic Light Protocol) = Labels saying how far information may be shared.
@term OSINT = Open-source intelligence: information gathered from public sources.
@term attribution = Naming who was behind an attack.
@term STIX = A standard format for sharing threat intelligence.
@term MISP = An open-source platform for sharing threat intelligence.

## Data, information, intelligence

| Stage | Example |
|---|---|
| **Data** | `203.0.113.7` |
| **Information** | That address attacked 40 logistics firms last week |
| **Intelligence** | We're a likely target, they enter through our VPN product, so patch it today |

Each step adds context and meaning, until someone can act on it.

?? Which of these is intelligence, rather than data?
+ This group targets our sector, so patch VPNs
- A long feed of 500 IP addresses here
- The SHA-256 hash of one recent malware sample
- A raw export of yesterday's firewall logs here
=> Intelligence says what it means for you and what to do. The others are raw material.

## The cycle

@flow Requirements > Collect > Process > Analyse > Share > Feedback

Start from a question, the **intelligence requirement**: "Which groups target logistics firms in North Africa, and how do they get in?" Without one, you collect everything and answer nothing. The feedback step closes the loop: did this help?

?? An analyst subscribes to ten free feeds, but nobody uses the output. What was skipped?
+ Defining the question that it should answer
- Buying a much larger, more expensive feed
- Translating all the feeds into several languages
- Deleting the old feeds every single morning
=> Collection without a requirement produces noise. Good intelligence starts with what a decision-maker needs to know.

## Levels

| Level | Audience | Example |
|---|---|---|
| Strategic | Executives | "Ransomware against our sector is rising" |
| Operational | IR, SOC leads | "This campaign phishes payroll staff" |
| Tactical | Detection engineers | TTPs and indicators |

The same report may need three versions. A CEO doesn't want hashes, and a detection engineer doesn't want trends.

?? Who's the right audience for "ransomware against our sector rose 40% this year"?
+ Executives deciding where to spend the budget
- Detection engineers writing new rules for today
- Help desk staff resetting a user's password
- Developers fixing a login form bug today
=> That's strategic intelligence: it shapes priorities and investment, not a specific rule.

## The Diamond Model

The **Diamond Model** describes an intrusion with four points. Any two connected points can lead you to a third, which is how analysts pivot.

| Point | Question | Example |
|---|---|---|
| Adversary | Who? | Unknown group |
| Capability | With what? | Phishing, a loader |
| Infrastructure | From where? | `203.0.113.7`, a domain |
| Victim | Against whom? | Payroll staff |

So if you know the infrastructure, you can search for other victims of it. Knowing the capability, you can look for other infrastructure using it.

A pivot can be done mechanically once the events are written down. Start from one piece of infrastructure, collect the capabilities seen with it, then find every other piece of infrastructure that used the same capability. Each new address or domain is a lead to check, not proof that it's the same group.

@code diamond-pivot

?? You've found a domain used by an attacker. What's a useful pivot?
+ Search your logs for hosts contacting that domain
- Wait until the domain's registration expires by itself
- Rename your own company's main domain at once
- Report it as your final attribution of them
=> Infrastructure leads to victims. Searching your own logs turns one indicator into scope.

## Careful language

Say how sure you are, and why: "We assess with **moderate confidence** that…". Separate what's known from what's judged, cite sources, and name your gaps.

| Confidence | Means |
|---|---|
| High | Good evidence from several reliable sources |
| Moderate | Credible, but with gaps or single-source parts |
| Low | Thin or questionable evidence |

Rate the source and the claim separately, because a reliable source can still pass on something wrong. The **Admiralty code**, used by many intelligence teams, gives each a letter and a number:

| Source reliability | | Information credibility | |
|---|---|---|---|
| A | Completely reliable | 1 | Confirmed by other sources |
| B | Usually reliable | 2 | Probably true |
| C | Fairly reliable | 3 | Possibly true |
| D | Not usually reliable | 4 | Doubtful |
| E | Unreliable | 5 | Improbable |
| F | Reliability can't be judged | 6 | Truth can't be judged |

So a claim rated **B2** comes from a source that has usually been right, and it's probably true. A post on an anonymous forum is often F3 at best: you can't judge the source, and the claim might be true.

Words carry the same weight. "Likely" and "almost certainly" are different claims, so choose the word on purpose and use it the same way in every report. A reader who sees "likely" in one report and "probably" in the next will assume you meant something different.

?? A report rates a claim C4. What does that say?
+ A fairly reliable source passed on something doubtful
- The claim is confirmed by four separate sources
- It's the fourth claim of the third report
- A completely reliable source made the whole claim
=> The letter rates the source, and the number rates the information. A decent source can still pass on a doubtful claim, and the rating keeps that visible.

Resist **attribution**: naming a culprit is the hardest claim, and rarely what defenders need. An IP address in a country doesn't mean that country did it. The behaviour is what you can act on.

?? A report says "the attacker's server was in Country X, so Country X did it". What's wrong?
+ Infrastructure location doesn't prove who operated it
- Servers can't be located in any country
- Reports must never mention a specific country
- Attribution always needs exactly three source IPs
=> Attackers rent or hijack servers anywhere. It's a classic error to treat location as identity.

## Sharing: TLP 2.0

| Label | May be shared with |
|---|---|
| `TLP:RED` | Named recipients only |
| `TLP:AMBER+STRICT` | Their organisation only |
| `TLP:AMBER` | Their organisation and clients, as needed |
| `TLP:GREEN` | The community |
| `TLP:CLEAR` | Anyone |

Defined by [FIRST](https://www.first.org/tlp/). Platforms such as **MISP** and OpenCTI store and share intelligence, often in a standard format called **STIX**.

The labels nest: each one allows everything the stricter ones allow, plus one more audience. That makes them easy to check in code, and a program that forwards reports should check, because a mislabelled forward can't be taken back.

@code tlp-share

A shared indicator in **STIX 2.1** is a small JSON object:

```json
{
  "type": "indicator",
  "spec_version": "2.1",
  "id": "indicator--8e2e2d2b-17d4-4cbf-938f-98ee46b3cd3f",
  "created": "2026-10-28T09:00:00.000Z",
  "modified": "2026-10-28T09:00:00.000Z",
  "name": "Payroll phishing domain",
  "pattern": "[domain-name:value = 'payroll-update.example']",
  "pattern_type": "stix",
  "valid_from": "2026-10-28T09:00:00Z",
  "valid_until": "2027-01-26T09:00:00Z"
}
```

The `pattern` says what to look for, and `valid_from` and `valid_until` say when it's worth looking. The [STIX 2.1 specification](https://docs.oasis-open.org/cti/stix/v2.1/os/stix-v2.1-os.html) defines every field, and MISP and OpenCTI both read and write it.

@drill tlp

?? A report is marked `TLP:AMBER`. Can you post it on your public blog?
+ No, sharing is limited to need-to-know recipients
- Yes, provided you credit the original author
- Yes, because threat reports are always public
- No, only because it contains IP addresses
=> TLP labels are the source's handling instructions. AMBER isn't public.

## Pulling indicators out of a report

Reports write indicators **defanged**, so that nobody clicks them by accident and no mail filter turns them into links: `203.0.113[.]7`, `hxxps://payroll-update[.]example/login`. Before you can search for them, you **refang** them, and then you pull them out of the prose. A regular expression for each kind does most of the work:

| Kind | Looks like | Pattern |
|---|---|---|
| IPv4 address | `203.0.113.7` | Four groups of 1 to 3 digits, joined by dots |
| SHA-256 hash | 64 hex characters | `[0-9a-fA-F]{64}` |
| URL | `https://…` | `https?://` followed by anything up to a space |

Check what comes out. A sentence that ends with a URL leaves a full stop stuck to it, and an address quoted three times should be listed once.

@code extract-iocs

Indicators also go stale. An IP address may be reused by someone innocent within weeks, while a domain lasts longer, and a file hash only fades when the attacker rebuilds the file. Give each kind a lifetime, measured from when it was **last seen**, and stop alerting on what has expired. Otherwise your blocklists grow forever and slowly fill with false positives. The numbers below are an example policy, not a standard:

| Kind | Example lifetime |
|---|---|
| IP address | 30 days |
| Domain | 90 days |
| File hash | 365 days |

@code indicator-age

?? Why should an IP address from last year's report not stay on the blocklist forever?
+ It may now belong to someone innocent
- Old addresses stop working on the internet
- Blocklists can hold only one hundred entries
- TLP labels expire after exactly one year
=> Cloud and hosting addresses change hands all the time. An old indicator blocks the new owner and tells you nothing about the attacker.

## From report to answer

@range intel

::: try Intelligence to detections
Choose a campaign with several public reports. Map behaviours to ATT&CK, citing a source sentence for each. Derive five detections and test them. See [P12](/projects/P12/).
:::

## Review a report

A colleague is about to send this to a partner organisation.

```
Subject: URGENT - Group X is attacking us
TLP:AMBER+STRICT

Group X, a state actor, is behind last night's intrusion: the server was in their country.
Block http://payroll-update.example/login and 203.0.113.7 now.
```

?? The partner is another company. What does the label allow?
+ Nothing, since STRICT keeps it inside your organisation
- Sharing it, provided nobody posts it in public
- Sharing it, since AMBER covers clients and partners
- Anything, since urgent reports override any TLP label
=> AMBER+STRICT means the recipient's own organisation only. If the partner needs it, ask the originator for a different label, or write a version that can be shared as AMBER or GREEN.

?? What's wrong with the first sentence?
+ It names a culprit from where a server was
- It doesn't name the exact time of the attack
- It mentions a country, which reports must never do
- It is far too short for a real report
=> Location isn't identity, and the sentence states it as fact with no confidence level. "We assess with low confidence" plus the evidence would be honest, and the defence doesn't depend on the name anyway.

?? How should the two indicators be written in the email?
+ Defanged, so that nobody opens them by accident
- In capitals, so that readers notice them quickly
- Encrypted, so that only the partner reads them
- As a picture, so filters can't read them
=> `hxxp://payroll-update[.]example/login` and `203.0.113[.]7` can't be clicked or followed by a mail scanner, and the reader can refang them in a second.

?! Write one intelligence requirement that your imaginary company would really care about.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [David Bianco, The Pyramid of Pain](https://detect-respond.blogspot.com/2013/03/the-pyramid-of-pain.html)
