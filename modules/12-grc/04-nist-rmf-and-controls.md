---
title: NIST RMF and control catalogues
summary: How a large organisation goes from "we should be secure" to named, tested controls. The Risk Management Framework, SP 800-53, control mapping, and how audits use them.
level: intermediate
side: defence
minutes: 40
attack: none
needs: 0061-frameworks
pair: 12-06-sector-compliance
source: NIST SP 800-37 Rev. 2, Risk Management Framework | https://csrc.nist.gov/pubs/sp/800/37/r2/final
words: Risk Management Framework, control baseline, continuous monitoring
---
Lesson 61 introduced frameworks side by side. Now look at how one actually runs. US federal systems must follow the NIST Risk Management Framework, and countless companies borrow from it, because its control catalogue is the largest public list of security safeguards in existence. You'll meet it in audits, contracts and job interviews.

@term Risk Management Framework = NIST's seven-step process for selecting, implementing and monitoring security controls.
@term control baseline = A starting set of controls chosen for a system's impact level.
@term authorisation to operate = A senior official's formal acceptance of a system's remaining risk.

## Concept

### Fundamentals: framework or catalogue?

The words get mixed up, so keep them apart.

| Type | Answers | Example |
|---|---|---|
| Framework | How do we organise and talk about security? | NIST CSF 2.0 |
| Process | How do we manage risk step by step? | NIST RMF, ISO 27005 |
| Control catalogue | Which safeguards exist? | SP 800-53, ISO 27002, CIS Controls |
| Certifiable standard | What will an auditor check? | ISO 27001 |

### The seven steps

[SP 800-37 Revision 2](https://csrc.nist.gov/pubs/sp/800/37/r2/final) defines them, and it added Prepare at the beginning.

| Step | Output |
|---|---|
| **Prepare** | Roles, risk strategy, asset inventory |
| **Categorize** | Impact level from [FIPS 199](https://csrc.nist.gov/pubs/fips/199/final) |
| **Select** | Baseline of controls, tailored |
| **Implement** | Controls in place, and documented |
| **Assess** | Evidence that controls work |
| **Authorize** | An official accepts the residual risk |
| **Monitor** | Ongoing checks and reporting |

Categorising uses confidentiality, integrity and availability, each rated low, moderate or high. The highest rating generally sets the system's level, which is called the *high-water mark*.

**Authorize** is the step that many engineers miss. Someone senior signs an **authorisation to operate**, accepting what's left. Risk ownership sits with a named person, not with the security team.

### SP 800-53

[SP 800-53 Revision 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final) holds about 1,000 controls and enhancements in 20 families, with identifiers such as `AC-2` for account management. Baselines in SP 800-53B choose subsets for low, moderate and high systems.

| Family | Examples |
|---|---|
| AC, Access Control | Least privilege, account management |
| AU, Audit and Accountability | Logging, retention |
| IR, Incident Response | Handling and reporting |
| RA, Risk Assessment | Vulnerability scanning |
| SC, System and Communications Protection | Boundary protection, cryptography |
| SR, Supply Chain Risk Management | New in Revision 5 |

### Advanced: making it real

**Mappings.** Few organisations answer to only one standard. Crosswalks map controls between ISO 27001, SOC 2, PCI DSS and NIST, so that you test once and report many times. The [NIST OLIR programme](https://csrc.nist.gov/projects/olir) publishes such mappings. A "common control" inherited from a platform, such as a cloud provider's physical security, needn't be tested again.

**Evidence.** An auditor doesn't take your word. For `AC-2`, they'd ask for the account process, a sample of joiners and leavers, and proof of reviews. Assessment procedures in SP 800-53A describe three methods: *examine*, *interview* and *test*.

**Continuous monitoring.** A yearly audit shows one moment. Automating evidence collection gives a live view of control health. OSCAL, NIST's machine-readable control format, supports this. So does the US government's **FedRAMP** for cloud providers.

**Related documents.** SP 800-171 protects sensitive information in non-federal systems, for defence contractors among others. It's a common requirement in supply chains.

**Critique.** Compliance isn't security. A controls checklist can drown teams in paperwork, and a system can pass while being unsafe. So link controls to real threats, using [threat-informed](/modules/08-03-purple-teaming/) testing. A control that's never been tested against a real technique is only a claim.

?? Which RMF step comes first in Revision 2?
+ Prepare
- Categorize
- Implement
- Authorize
=> Revision 2 added Prepare, so that roles, strategy and asset inventories exist before any system-level work begins.

## Threat model

Control catalogues aren't threat models. They describe safeguards in general, whereas a threat model describes what could happen to your system. Using one without the other leaves gaps: a tailored baseline should reflect who attacks you. NIST provides a [mapping from 800-53 to ATT&CK](https://center-for-threat-informed-defense.github.io/mappings-explorer/), which shows which techniques each control addresses.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| CSF and 800-53 reference tools | Browse and export controls | Lookups |
| OSCAL | Machine-readable controls | Compliance as code |
| OpenSCAP | Scans systems against baselines | Technical checks |
| Mappings Explorer | Links controls to ATT&CK | Threat-informed selection |
| GRC platforms | Evidence and workflows | Larger programmes |

## Defence

- **Keep an asset inventory.** RMF's first steps all depend on it.
- **Tailor, don't copy.** Justify each control you drop.
- **Name a control owner** for every control.
- **Collect evidence as you go**, automatically where you can.
- **Track exceptions** in a plan of action and milestones.
- **Test against threats,** not just against the checklist.

## Pitfalls

- **Treating an audit pass as safety.** It proves that controls existed then.
- **Writing policy nobody follows.** Auditors sample what really happens.
- **One-time compliance.** Evidence gathered in a panic before an audit is a warning sign.
- **Copying a baseline unchanged.** It wastes effort and misses local risk.
- **Security owning all risk.** The business owns risk, and security advises.

?? What's the main difference between a framework and a control catalogue?
+ A catalogue lists specific safeguards to implement
- A catalogue applies only to government contractors
- A framework replaces the need for audits
- A framework is written only in law
=> A framework organises the conversation, whereas a catalogue names the actual safeguards that you select and test.

## Exercise

::: law Lab only
Apply this to your own lab or a fictional company. Keep any real assessment results private.
:::

1. Take the lab network from P01. Categorise it using FIPS 199, for each of confidentiality, integrity and availability.
2. Read `AC-2` and `AU-6` in SP 800-53. Write what evidence you'd show an auditor for each in your lab.
3. Map three of your existing project controls to ISO 27001 Annex A and to SP 800-53.
4. Use the Mappings Explorer to find which controls address [T1078](https://attack.mitre.org/techniques/T1078/). Which do you have?
5. Run OpenSCAP against a Linux VM using a CIS or DISA profile, and read the report.

?! An engineer says "compliance is theatre". Write a reply that agrees with what's true in that, and says what compliance still gives you.

## Further reading

- [SP 800-37 Rev. 2](https://csrc.nist.gov/pubs/sp/800/37/r2/final).
- [SP 800-53 Rev. 5](https://csrc.nist.gov/pubs/sp/800/53/r5/upd1/final).
- [FIPS 199](https://csrc.nist.gov/pubs/fips/199/final).
- [OSCAL](https://pages.nist.gov/OSCAL/).
- [FedRAMP](https://www.fedramp.gov/).
