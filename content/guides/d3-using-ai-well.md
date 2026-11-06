---
title: Using AI without depending on it
summary: The rules, the S-T-A-R-S verification protocol, the red flags in AI output and twelve exercises across the 24 months.
group: Working with AI
minutes: 10
source: OWASP Top 10 for LLM Applications, on why output needs verifying | https://genai.owasp.org/llm-top-10/
---
You'll use AI every day of your career. The aim is to get faster without getting weaker.

## The rules

| Rule | Why it matters |
|---|---|
| **Attempt first.** 20–30 minutes of your own thinking while learning | Struggle is where learning happens, and AI short-circuits it silently |
| **Explain back.** Never keep output you can't explain line by line | Interviews, incidents and reviews test explanation |
| **AI as reviewer, not author,** while learning | Reviewing teaches; delegating doesn't |
| **One unaided session a week.** No AI, no notes, timed | It shows your real level before an exam does |
| **Learn the primary source.** If it suggests a flag, read the man page | Builds the knowledge that catches errors later |
| **Keep the AI log.** Claim → verification → verdict | After a year you'll know where models fail in your domain: rare, marketable knowledge |
| **Never paste sensitive data.** Use sanitised or synthetic data, or a local model | Leaks through AI tools are a standard audit finding and a fireable mistake |
| **Mark AI-assisted work** when collaborating | Professional honesty, and it protects you |

## The verification protocol: S-T-A-R-S

| Step | Question | Practice |
|---|---|---|
| **S**ource | Where does this come from? | Find the primary source: vendor docs, RFC, NIST/OWASP/MITRE page, man page, the code |
| **T**est | Does it work here? | Reproduce it in the lab, never production. Dry-run destructive commands on a snapshot |
| **A**rtifacts | Are the specifics real? | Verify CVE IDs, ATT&CK IDs, event IDs, package names, API parameters, clause numbers |
| **R**ecency | Is it still true? | Check product names and versions. Azure AD is now Entra ID, and exam codes change yearly |
| **S**takes | What if it's wrong? | Scale checking to impact: a lab command needs a glance, a client report needs full checking and a second pair of eyes |

@term CVE = A public identifier for a specific known vulnerability, like CVE-2025-32711.
@term slopsquatting = Registering a package name that AI models tend to invent, so people who trust the suggestion install malware.

::: try A real example
This course's source roadmap, written in September 2026, pointed to Ubuntu Server 24.04, but 26.04 LTS was already out. And many pages still say ATT&CK has 14 Enterprise tactics, though [MITRE's own page](https://attack.mitre.org/tactics/enterprise/) now lists 15. Even careful documents go stale. That's the Recency step.
:::

## Red flags in AI output

- Confident precision with no source: exact percentages, dates, "industry standard" numbers.
- Command flags or API parameters that aren't in the documentation.
- CVE IDs whose description doesn't match, or ATT&CK IDs that map to something else.
- Package or repository names that don't exist.
- Legal or compliance clause numbers: the most dangerous category, because almost nobody checks them.
- Outdated product names or retired portals, a sign of stale training data.

?? An AI suggests `pip install fast-sigma-parser`, a package you've never heard of. Best move?
+ Confirm it exists and check who publishes it
- Install it inside a fresh new virtual environment
- Ask the AI to confirm the exact name
- Install it now, then scan it for malware
=> Attackers register names that AI invents. Check the registry, the publisher, the age and the source repository first. Installing can run code.

?? In S-T-A-R-S, what does Stakes change?
+ How much checking a claim deserves
- Whether the model tells the truth
- Which vendor owns the original document
- How quickly the answer goes stale
=> A lab command needs a glance, and a client report needs full verification plus a second reviewer.

## Twelve exercises

| # | Exercise | When | What it teaches |
|---|---|---|---|
| 1 | **Hallucination hunt:** ask for 20 commands, event IDs or ports, verify each, classify errors | M2–M5 | Where models fail, and how confidently |
| 2 | **Shadow triage:** triage 20 alerts, compare with AI verdicts, classify disagreements | M9 | A realistic view of AI in SOC work |
| 3 | **Rule forge:** AI drafts 10 Sigma rules, test each with Atomic Red Team | M11 | AI drafts, tests decide |
| 4 | **Policy audit:** AI writes a policy; verify every clause and control ID | M12 | Compliance hallucinations are invisible |
| 5 | **IAM duel:** AI writes 3 IAM policies; validate with Access Analyzer | M13 | Over-permissioning is the default failure |
| 6 | **Local model:** run Ollama on sensitive logs; compare with an API model | M14 | AI on data that can't leave |
| 7 | **Mapping check:** AI maps a 40-page report to ATT&CK; verify every technique | M15 | Precision matters when detections follow |
| 8 | **Code-review duel:** you vs Semgrep vs an LLM; build a confusion matrix | M17 | Complementary tools, not substitutes |
| 9 | **Build and break:** create an agent, attack it, harden it, measure | M18 | The core AI-security skill |
| 10 | **Prompt library as code:** versioned prompts with tests in CI | M18–24 | Prompts are software |
| 11 | **Vendor claim evaluation:** design a test for an "AI security" product | M20 | The skill buyers need |
| 12 | **AI usage policy:** write the rules for AI use in a SOC | M12/M18 | Governance literacy |

## AI + security project ideas

- A retrieval assistant over ATT&CK and your runbooks, with mandatory citations and a 50-question evaluation.
- A cloud audit-log narrator, evaluated against ground truth from your own P10 attacks.
- A detection-rule generator whose test harness rejects anything that doesn't fire or floods false positives.
- An MCP server security review checklist and scanner, a genuinely under-served area.
- A phishing triage classifier compared with an LLM baseline and a human baseline.
- An AI bill of materials mapped to ISO/IEC 42001 and EU AI Act obligations.

?! Start your AI log now. Ask any AI for the default ports of five services, check each against [IANA's registry](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml), and paste your results here.
