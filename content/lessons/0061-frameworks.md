---
title: The frameworks that matter
summary: NIST CSF profiles, CIS Controls, ISO/IEC 27001 and SOC 2, and how they differ.
month: 12
minutes: 30
builds: explain ISO 27001 versus NIST CSF in 60 seconds
source: CIS Critical Security Controls | https://www.cisecurity.org/controls
words: control framework, ISMS, Statement of Applicability
---
Frameworks can feel like bureaucracy. They're really shared language: they let a bank, an auditor and a supplier talk about security without starting from nothing.

@term ISO/IEC 27001 = An international standard for an information security management system, which can be certified.
@term ISMS = Information security management system: the policies and processes for managing security risk.
@term Statement of Applicability (SoA) = The ISO 27001 document listing which controls apply and why.
@term CIS Controls = A prioritised list of security safeguards, grouped into implementation groups.
@term SOC 2 = An American attestation report on a service provider's controls.
@term CSF profile = A description of an organisation's current or target security outcomes.

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

?? A customer demands proof, audited by a third party, of your security management. Which fits?
+ An ISO/IEC 27001 certification of your ISMS
- A self-written NIST CSF 2.0 target profile
- A list of CIS Controls you've read
- An internal memo describing your firewall rules
=> ISO 27001 is certifiable by an accredited body. CSF is a voluntary tool, and it isn't a certificate.

## Using them

- **CSF profile:** describe where you are and where you want to be. The gap is your plan.
- **CIS IG1:** assess yourself against the basics first.
- **ISO 27001:** clauses 4–10 define the management system, and Annex A lists controls. Whether a control applies is decided through risk assessment.

::: ai Roadmap exercise
Have an LLM draft a policy and a control mapping, then audit it: do the clause numbers exist? Are the control IDs real? Compliance hallucinations are the most dangerous kind, because nobody checks a confident document.
:::

?! Say the difference between ISO 27001 and NIST CSF aloud, timed, then write it here.
