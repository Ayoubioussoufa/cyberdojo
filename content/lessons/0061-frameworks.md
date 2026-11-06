---
title: The frameworks that matter
summary: NIST CSF 2.0 functions and profiles, CIS Controls, ISO/IEC 27001 and SOC 2, how they differ, and how to run a gap assessment.
month: 12
minutes: 45
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

| Function | Question | Example |
|---|---|---|
| Govern | Who decides, and by what rules? | Policy, roles, risk appetite |
| Identify | What do we have and what's at risk? | Asset inventory |
| Protect | How do we prevent harm? | MFA, patching, training |
| Detect | How do we notice? | Your SIEM |
| Respond | What do we do then? | Your IR plan |
| Recover | How do we get back? | Tested restores |

A **profile** describes outcomes: a current profile says where you are, and a target profile says where you want to be. The difference is your plan. **Tiers**, from 1 Partial to 4 Adaptive, describe how mature your risk management is.

?? A company's SOC is strong, but it can't list the servers it owns. Which CSF function is weakest?
+ Identify, since the asset inventory is missing
- Detect, since the SOC isn't watching anything
- Recover, since the backups haven't been tested
- Respond, since the playbooks aren't written down
=> You can't protect or monitor what you don't know about. Inventory comes first, which is why it's so often the real gap.

## CIS Controls and ISO 27001

**CIS Controls** are the practical list: what to do, in priority order. Implementation Group 1 is the essential baseline that every organisation should meet, and IG2 and IG3 add to it for bigger, more exposed organisations.

**ISO/IEC 27001:2022** has two parts. Clauses 4 to 10 define the **management system**: context, leadership, planning, support, operation, evaluation and improvement. Annex A lists 93 reference controls in four themes: organisational, people, physical and technological. Whether a control applies is decided through risk assessment, and your **Statement of Applicability** records each decision and why.

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

::: ai Roadmap exercise
Have an LLM draft a policy and a control mapping, then audit it: do the clause numbers exist? Are the control IDs real? Compliance hallucinations are the most dangerous kind, because nobody checks a confident document.
:::

?! Say the difference between ISO 27001 and NIST CSF aloud, timed, then write it here.
