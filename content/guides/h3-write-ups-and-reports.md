---
title: Write-ups and reports
summary: How to structure pentest reports, incident reports, detection docs and risk deliverables, with the rules that apply to all of them.
group: Career
minutes: 6
source: OWASP Web Security Testing Guide, reporting chapter | https://owasp.org/www-project-web-security-testing-guide/
---
Writing is the actual work product of most security jobs. Templates for each are in [Templates](/guides/n1-templates/).

| Document | Structure that works |
|---|---|
| **Penetration test report** | Executive summary (business risk, no jargon) → scope and methodology → findings by risk (description, impact, evidence, reproduction, severity rationale, remediation, effort) → strategic recommendations → appendices |
| **Incident report** | Executive summary → timeline in UTC → scope and impact → root cause → actions taken (containment, eradication, recovery) → indicators and ATT&CK mapping → lessons learned with owners and dates → evidence appendix |
| **Detection documentation** | Hypothesis → data sources required → logic → known false positives and exclusions → test results → response guidance → gaps and blind spots |
| **Risk / GRC deliverable** | Executive summary → scope and context → method and scales → register or gap table → prioritised roadmap with effort and owners → assumptions and limitations |

## Five rules for all four

1. **Lead with the conclusion.**
2. **Separate observation from inference.** "The log shows X" is different from "the attacker probably did Y".
3. **Quantify where possible.**
4. **Make every claim reproducible.**
5. **Write for the person who has to act,** not to impress the person who has to read.

?? Which sentence correctly separates observation from inference?
+ Logs show a 03:14 login; the attacker probably stole credentials
- The attacker logged in at 03:14 using credentials they stole
- A hacker definitely broke in during the night with passwords
- Someone stole credentials, and the login proves that it happened
=> The first part is what the evidence shows. The second is marked as a judgment, so a reader can weigh it.

?! Rewrite this for a non-technical manager: "CVE-2021-44228 on the app server allows unauthenticated RCE via JNDI lookup."
