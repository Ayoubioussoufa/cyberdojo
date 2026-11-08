---
title: Anti-forensics and reporting
summary: How investigators recognise tampering with evidence, what silence in the logs tells you, and how to write forensic findings that hold up under cross-examination.
level: advanced
side: defence
minutes: 45
attack: T1070, T1070.001
needs: 08-05-disk-forensics, 0065-forensic-principles
pair: 08-05-disk-forensics, 08-06-memory-forensics
source: ISO/IEC 27037, Guidelines for handling digital evidence | https://www.iso.org/standard/44381.html
words: anti-forensics, expert witness, admissibility
---
Two ideas close out forensics. The first is that attackers try to destroy evidence, and that destruction usually leaves evidence of its own. The second is that your work only matters if someone else can rely on it. A correct finding that a lawyer can pull apart in five minutes doesn't help anyone.

@term anti-forensics = Actions intended to remove, hide or falsify digital evidence.
@term expert witness = A person allowed to give an opinion in court, because of specialist knowledge.
@term admissibility = Whether a court will accept a piece of evidence.

## Concept

### Fundamentals: tampering is itself a signal

An attacker has four broad options.

| Approach | Example | What it leaves |
|---|---|---|
| Destroy | Clear logs, delete tools | Event 1102, USN entries, gaps |
| Hide | Encrypted containers, rootkits | Entropy, kernel anomalies |
| Falsify | Timestomping, edited logs | Inconsistent sources |
| Avoid | Fileless execution, trusted tools | Less on disk, more in memory |

The strongest principle here is **Locard's exchange principle**, borrowed from physical forensics: every contact leaves a trace. Removing a trace is also contact. Clearing a Windows Security log writes **event 1102**, and clearing the System log writes event 104. A log that starts abruptly at 03:14 tells you something happened at 03:14.

### Reasoning from absence

A missing record isn't proof, but it's a question. Ask what should exist, and doesn't.

- A host with a large gap in events, despite uptime.
- A shell session with an empty history file.
- A file's `$SI` time long before its `$FN` time.
- A Prefetch file for a deleted program.
- An application that writes daily logs, and missed one day.

Compare independent sources: central SIEM copy against local log, USN against `$MFT`, firewall logs against host logs. An attacker rarely reaches all of them.

### Encryption and wiping

Strong encryption really does stop analysis, if keys aren't found. Investigators can look for keys in memory, in escrow, or for the same data somewhere else. Secure deletion tools can erase content, but their own use leaves artefacts such as Prefetch. On SSDs, wear levelling and TRIM mean that neither attackers nor examiners fully control what remains.

### Reporting

A forensic report has a clear job: tell a non-expert what was examined, what was found, and how sure you are.

| Section | Contents |
|---|---|
| Summary | Findings in plain language |
| Scope | What you were asked and what you examined, including limits |
| Evidence | Items, hashes, custody |
| Method | Tools and versions, so that someone can repeat it |
| Findings | Facts, each with its source |
| Opinion | Your interpretation, clearly separated |
| Timeline | Key events, with time zones |

**Separate observation from inference.** "The account `jsmith` logged on at 02:14 UTC from 10.0.0.5" is a fact from a log. "John Smith stole the data" isn't. An account isn't a person. Use careful language, as lesson 66 did: "consistent with", "no evidence was found of", and state what would change your view.

### Advanced: evidence in court

Standards vary by country, yet four qualities recur: evidence must be **relevant, reliable, complete and lawfully obtained**. [ISO/IEC 27037](https://www.iso.org/standard/44381.html) sets international guidelines on identifying, collecting and preserving digital evidence. The UK's [ACPO principles](https://www.digital-detective.net/digital-forensics-documents/ACPO_Good_Practice_Guide_for_Digital_Evidence_v5.pdf) add a useful rule: if you must touch original data, be competent, and be able to explain what you did and why.

In the US, the Daubert standard asks whether a method has been tested, peer-reviewed, has a known error rate, and is generally accepted. So using well-known tools and documenting versions isn't bureaucracy.

An **expert witness** must explain things simply, and stay within their expertise. The hardest question in cross-examination is usually about what you *didn't* check. **Your duty is to the facts**, even if they hurt the party paying you. Report evidence that contradicts your theory.

?? What does event ID 1102 itself tell you?
+ The Security log was cleared by someone
- The system rebooted during the last night
- A new user joined the administrators group
- A scheduled task has finished without errors
=> Windows records the clearing. It doesn't tell you what was removed, so turn to central copies for that.

## Threat model

Indicator removal is [T1070](https://attack.mitre.org/techniques/T1070/), and clearing Windows logs is [T1070.001](https://attack.mitre.org/techniques/T1070/001/). Ransomware operators also delete shadow copies and clear logs before encrypting, so such activity should raise a top-priority alert.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Chainsaw, Hayabusa | Hunt through Windows event logs | Finding tampering fast |
| EvtxECmd | Parses event logs | Timelines |
| `analyzeMFT`, MFTECmd | Compare `$SI` and `$FN` | Spotting timestomping |
| Plaso | Merges sources | Finding inconsistencies |
| Your case notes | Record each step | Always |

## Defence

- **Forward logs immediately**, so that local tampering loses its value.
- **Alert on 1102, 104, `wevtutil cl`, and `vssadmin delete`.**
- **Make logs immutable** with write-once storage.
- **Monitor sensors for silence.**
- **Write notes as you go,** with timestamps, and treat them as if a lawyer will read them.
- **Peer review** every significant report.

## Pitfalls

- **"No evidence of X" as "X didn't happen".** Those are very different statements.
- **Stating intent.** Logs show actions, not motives.
- **Overclaiming.** One false statement can discredit the rest of the report.
- **Leaving out tool versions.** Then nobody can repeat your work.
- **Accepting the client's theory.** Test against the opposite view.
- **Jargon.** A judge shouldn't need a glossary to get your point.

?? Which sentence belongs in a forensic report?
+ The logs show this account logged on
- The attacker obviously hated the IT team
- The user must have known the rules
- The company was clearly far too careless
=> It's an observation tied to a source. The others state motives, knowledge or blame that the evidence can't show.

## Exercise

::: law Lab only
Do this on your own VM. Don't clear logs or tamper with evidence on any system that you don't own, as that can itself be a crime.
:::

1. On a Windows VM forwarding logs to your SIEM, perform some actions, then run `wevtutil cl Security` as admin.
2. Find event 1102. Show that the SIEM still has what the host lost.
3. Run Chainsaw or Hayabusa over the remaining logs, and record what it flags.
4. Backdate a file, delete a tool, and clear a log. Hand the image to a classmate, and ask for a timeline.
5. Write a two-page report on it, with facts and opinion separated. Have someone attack it as a hostile lawyer would.

?! Rewrite this sentence for a report: "The hacker deleted the logs at 3am to cover his tracks." Explain each change that you make.

## Further reading

- [ISO/IEC 27037](https://www.iso.org/standard/44381.html).
- [ACPO Good Practice Guide for Digital Evidence](https://www.digital-detective.net/digital-forensics-documents/ACPO_Good_Practice_Guide_for_Digital_Evidence_v5.pdf).
- [NIST SP 800-86](https://csrc.nist.gov/pubs/sp/800/86/final).
- [Chainsaw](https://github.com/WithSecureLabs/chainsaw).
- [ATT&CK T1070, Indicator Removal](https://attack.mitre.org/techniques/T1070/).
