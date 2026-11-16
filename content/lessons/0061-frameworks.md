---
title: The frameworks that matter
summary: NIST CSF 2.0 functions and profiles, CIS Controls, ISO/IEC 27001 and SOC 2, how they differ, and how to run a gap assessment.
month: 12
minutes: 70
builds: explain ISO 27001 versus NIST CSF in 60 seconds
source: CIS Critical Security Controls | https://www.cisecurity.org/controls
words: control framework, ISMS, Statement of Applicability
---
Frameworks can feel like bureaucracy. They're really shared language: they let a bank, an auditor and a supplier talk about security without starting from nothing. Imagine building codes. A builder and an inspector who've never met can still agree on what a safe staircase is.

@term ISO/IEC 27001 = An international standard for an information security management system, which can be certified.
@term ISMS = Information security management system: the policies and processes for managing security risk.
@term Statement of Applicability (SoA) = The ISO 27001 document listing which controls apply and why.
@term CIS Controls = A prioritised list of security safeguards, grouped into implementation groups.
@term SOC 2 = An American attestation report on a service provider's controls.
@term CSF profile = A description of an organisation's current or target security outcomes.
@term gap assessment = Comparing where you are against a framework to find what's missing.
@term attestation = A formal statement by an independent auditor about what they examined.

## Side by side

| Framework | What it is | Can you certify? | Best for |
|---|---|---|---|
| [NIST CSF 2.0](https://www.nist.gov/cyberframework) | Voluntary outcomes | No | Assessing and communicating posture |
| [CIS Controls v8.1](https://www.cisecurity.org/controls) | Prioritised safeguards | No | What to do first. IG1 is a great baseline |
| ISO/IEC 27001:2022 | Management system requirements | **Yes** | Proving it to customers |
| SOC 2 | Attestation by an auditor | Report | US SaaS vendors |

::: key The 60-second answer
ISO 27001 is a certifiable management system, with requirements and a Statement of Applicability. NIST CSF is a voluntary set of outcomes for assessing and communicating posture. They complement each other.
:::

@drill framework-pick

?? A customer demands proof, audited by a third party, of your security management. Which fits?
+ An ISO/IEC 27001 certification of your ISMS
- A self-written NIST CSF 2.0 target profile
- A list of CIS Controls you've read
- An internal memo describing your firewall rules
=> ISO 27001 is certifiable by an accredited body. CSF is a voluntary tool, and it isn't a certificate.

## NIST CSF 2.0

CSF 2.0, published in 2024, organises security into six functions. Five are the familiar cycle, and **Govern** sits at the centre.

@flow Govern, at the centre > Identify > Protect > Detect > Respond > Recover

| Function | Question | Example |
|---|---|---|
| Govern | Who decides, and by what rules? | Policy, roles, risk appetite |
| Identify | What do we have and what's at risk? | Asset inventory |
| Protect | How do we prevent harm? | MFA, patching, training |
| Detect | How do we notice? | Your SIEM |
| Respond | What do we do then? | Your IR plan |
| Recover | How do we get back? | Tested restores |

A **profile** describes outcomes: a current profile says where you are, and a target profile says where you want to be. The difference is your plan. **Tiers**, from 1 Partial to 4 Adaptive, describe how mature your risk management is.

Each function is split into **categories**, and each category into **subcategories**, which are the outcomes themselves. CSF 2.0 has 22 categories and 106 subcategories, and each one has an ID you can read:

| ID | Reads as | The outcome, in short |
|---|---|---|
| `GV.RM-01` | Govern, Risk Management Strategy, outcome 1 | Risk management objectives are agreed |
| `ID.AM-01` | Identify, Asset Management, outcome 1 | Hardware inventories are maintained |
| `PR.AA-01` | Protect, Identity Management and Access Control, outcome 1 | Identities and credentials are managed |
| `DE.CM-01` | Detect, Continuous Monitoring, outcome 1 | Networks are monitored for adverse events |

The two letters before the dot are the function: `GV`, `ID`, `PR`, `DE`, `RS` or `RC`. A profile is then just a table with one row per subcategory, saying where you are and where you want to be.

@code csf-id

?? A company's SOC is strong, but it can't list the servers it owns. Which CSF function is weakest?
+ Identify, since the asset inventory is missing
- Detect, since the SOC isn't watching anything
- Recover, since the backups haven't been tested
- Respond, since the playbooks aren't written down
=> You can't protect or monitor what you don't know about. Inventory comes first, which is why it's so often the real gap.

## CIS Controls and ISO 27001

**CIS Controls** are the practical list: what to do, in priority order. Implementation Group 1 is the essential baseline that every organisation should meet, and IG2 and IG3 add to it for bigger, more exposed organisations.

**ISO/IEC 27001:2022** has two parts. Clauses 4 to 10 define the **management system**: context, leadership, planning, support, operation, evaluation and improvement. Annex A lists 93 reference controls in four themes: organisational, people, physical and technological. Whether a control applies is decided through risk assessment, and your **Statement of Applicability** records each decision and why.

The numbering of both lists tells you where you are. CIS v8.1 has 18 controls and 153 safeguards, of which 56 make up IG1. A safeguard's number starts with its control: safeguard 1.1 is the asset inventory, under control 1, and 11.2 is automated backups, under control 11.

Annex A's four themes are numbered too:

| Clause | Theme | Controls | Example |
|---|---|---|---|
| A.5 | Organisational | 37 | A.5.15 Access control |
| A.6 | People | 8 | A.6.3 Awareness, education and training |
| A.7 | Physical | 14 | A.7.2 Physical entry |
| A.8 | Technological | 34 | A.8.13 Information backup |

This is worth knowing because the 2013 edition was numbered differently, from A.5 to A.18, with 114 controls. A document that cites `A.12.3.1` is using the old numbering, and one that cites `A.8.40` is citing a control that doesn't exist.

@code annex-a-control

Three rows of a Statement of Applicability:

| Control | Applies? | Justification | Implemented? |
|---|---|---|---|
| A.8.13 Information backup | Yes | Risk R-07, ransomware | Yes |
| A.7.4 Physical security monitoring | No | No premises: the company is remote and cloud-hosted | Not applicable |
| A.8.28 Secure coding | Yes | We build our own portal | Not yet |

An exclusion needs a reason just as an inclusion does. "Not yet" is an honest answer that an auditor can work with, because it becomes a dated item in the risk treatment plan.

@code soa-problems

?? Under ISO 27001, must a company implement all 93 Annex A controls?
+ No, applicability follows from its own risk assessment
- Yes, every control is mandatory without any exception
- No, only the first ten are ever required
- Yes, unless the auditor happens to be busy
=> Annex A is a reference list. You justify each inclusion or exclusion in the Statement of Applicability.

## SOC 2 in one page

A SOC 2 report is an **attestation**: an independent auditor states what they examined and found. It's built on the Trust Services Criteria: security, availability, processing integrity, confidentiality and privacy. Security is required, and the others are chosen.

| Type | Answers |
|---|---|
| Type I | Were the controls designed well, on this date? |
| Type II | Did they actually work, across a period such as six months? |

There's no pass or fail badge. You read the report, including any exceptions.

?? A vendor proudly shows a SOC 2 Type I report. What should a careful buyer ask for?
+ A Type II report covering a full period
- A signed promise from the vendor's marketing team
- The vendor's full list of favourite security frameworks
- A photograph of the vendor's server room door
=> Type I shows design at one moment. Type II shows that controls operated over time.

## Using them: a gap assessment

Pick a framework, compare yourself to it line by line, and rank what's missing. Here's one row from a CIS IG1 assessment:

| Safeguard | Status | Evidence | Fix | Priority |
|---|---|---|---|---|
| Keep an asset inventory | Partial | Spreadsheet from 2024 | Automate discovery | High |

A useful assessment ends in a dated 90-day plan, not a percentage.

Each status needs a rule, or two assessors will disagree:

| Status | It means | Evidence you can show |
|---|---|---|
| Done | It's in place everywhere in scope | A current export, a configuration, a dated record |
| Partial | It exists, but not everywhere or not kept up | The same, with the gap named |
| Missing | Nothing is in place | None |

Then rank what isn't done: by priority first, and inside a priority, what's missing before what's partial.

@code gap-plan

?? An assessment reports "IG1: 71% complete". What does its reader still not know?
+ Which missing safeguards matter most right now
- Whether IG1 has more than ten safeguards
- Whether percentages are allowed by CIS itself
- How many auditors wrote the final report
=> A percentage treats every safeguard as equal. A missing backup and a missing banner text aren't, which is why the plan matters more than the score.

::: ai Roadmap exercise
Have an LLM draft a policy and a control mapping, then audit it: do the clause numbers exist? Are the control IDs real? Compliance hallucinations are the most dangerous kind, because nobody checks a confident document.
:::

## Review a mapping

An LLM drafted this mapping from a company policy to the frameworks. Check it before anyone signs it.

| Policy statement | Mapped to |
|---|---|
| Backups are taken daily and tested | ISO 27001 `A.8.13` |
| All staff receive security training | ISO 27001 `A.6.30` |
| Visitors sign in at reception | ISO 27001 `A.7.2` |
| We keep a hardware inventory | NIST CSF `ID.AM-01` |

?? Which of those IDs can't exist?
+ `A.6.30`
- `A.8.13`
- `A.7.2`
- `ID.AM-01`
=> The people theme has only 8 controls, so A.6 stops at A.6.8. Training is A.6.3, and the model added a digit. It reads perfectly well, which is the danger.

?? The same draft says: "Our controls are certified under NIST CSF 2.0." What's wrong with it?
+ NIST CSF offers no certification at all
- ISO controls can't be mapped to CSF
- Certification under CSF takes about three years
- Only CIS can certify a CSF profile
=> CSF is voluntary guidance. You can assess yourself against it and publish a profile, but nobody issues a CSF certificate.

?? A supplier's Statement of Applicability excludes `A.8.13`, with the reason "not needed". What do you ask?
+ Which risk assessment result supports that exclusion
- Whether the auditor liked the document's layout
- How many pages the whole document has
- Which vendor sold them their backup software
=> An exclusion has to follow from the risk assessment. A company with data and no need for backups would be unusual, so the reasoning is what you want to read.

?! Say the difference between ISO 27001 and NIST CSF aloud, timed, then write it here.
