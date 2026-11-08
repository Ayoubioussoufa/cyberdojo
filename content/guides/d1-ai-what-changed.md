---
title: AI and the future of the field
summary: What AI has really changed in security, which tasks it automates, what stays human, and which skills gain value.
group: Working with AI
minutes: 12
source: Verify the claims here yourself; that's the point. Start with the OWASP GenAI Security Project | https://genai.owasp.org/
---
@term EMEA = Europe, the Middle East and Africa, as one business region.
The roadmap calls this its most important part. Your career decisions depend on separating signal from marketing. This is a snapshot from September 2026, and it will age, so treat every specific claim as something to verify.

## What actually changed

| Area | Where it stands |
|---|---|
| **Security operations** | AI "SOC agents" moved from demos to production in 2025–2026: they enrich alerts, correlate context and draft summaries. Accuracy on novel cases stays weak, so human sampling is standard. Net effect: fewer pure Tier-1 seats, more analyst-engineers |
| **Detection** | ML in detection is a decade old. What's new is natural-language querying and AI-drafted rules. Quality still depends on telemetry and testing: an untested AI rule is worse than no rule |
| **Vulnerability research** | The biggest change. AI systems find real zero-days at scale: Google's Big Sleep (from 2024), the DARPA AI Cyber Challenge finals (2025), and reported 2026 work with restricted models. Discovery gets cheap, so triage, patching and secure design become the bottleneck |
| **Offensive testing** | Autonomous pentesting platforms reached the top of public bug-bounty leaderboards in 2025. They're strong on known classes, weak on scoping, business logic and chained attacks |
| **Attackers** | Documented AI-assisted phishing and recon; malware that queries LLM APIs during execution; a late-2025 report of an AI agent doing most of the tactical work in an espionage campaign; deepfake-enabled fraud |
| **New attack surface** | AI apps themselves: zero-click exfiltration from an enterprise assistant (EchoLeak, CVE-2025-32711), compromised AI coding extensions, agents deleting production databases |

@term zero-day = A flaw that's unknown to the vendor, so no fix exists yet.
@term agent (AI agent) = An AI system that can take actions through tools, not just produce text.

::: key The honest summary
AI isn't replacing security professionals. It's raising the floor and moving the bottleneck. Routine, well-documented work is automated first, and that's exactly what junior roles used to be made of. The answer isn't to avoid AI or fundamentals: it's to get good enough at fundamentals to **verify** AI, then use AI for work that used to be out of a junior's reach.
:::

## What's automated, and what stays human

| Task | Status | Why |
|---|---|---|
| Alert enrichment, deduplication | Automated | Deterministic lookups |
| Tier-1 triage of known patterns | Mostly automated | Needs human sampling of verdicts |
| First drafts of queries, rules, scripts | Assisted | Good at syntax, unreliable on meaning |
| Summarising logs and reports | Assisted | Omissions and invented mappings are common |
| Finding common web flaws | Increasingly automated | Strong on this narrow slice |
| Finding bugs in large codebases | Increasingly automated | The limit is review and patching capacity |
| Patch generation | Assisted | A human owns correctness and regressions |
| Scoping and authorization | **Human** | Legal accountability can't be delegated to a model |
| Containment of critical systems | **Human** | Business trade-offs under uncertainty |
| Business-logic and multi-system chains | Human-led | Needs intent and context |
| Threat modeling a new system | Human-led | Someone must know what matters |
| Risk acceptance, regulatory judgment | **Human** | Accountability and consequences |
| Talking to executives and regulators | **Human** | Trust is a relationship |
| Verifying AI, designing evaluations | **Human (new skill)** | Becoming a job in itself |
| Securing AI systems | Human-led (new) | New, under-documented and changing monthly |

## Skills: gaining value versus commoditised

| Invest here | Don't build a career on this |
|---|---|
| Deep fundamentals: the only way to catch a confident wrong answer | Memorising commands, ports and syntax |
| Investigation judgment: which question to ask next | Running a scanner and forwarding the output |
| Threat modeling and secure design | Boilerplate report and policy text |
| Detection validation and data engineering | Manual IOC lookups and copy-paste enrichment |
| Evaluation design | Tier-1 triage of high-volume alerts |
| Programming and automation | Generic compliance questionnaires |
| AI/LLM security | "Know the tool" without the system underneath |
| Cloud and identity architecture | Recognising CTF patterns with no depth |
| Writing and speaking | Certificates with no artifact behind them |
| Domain and business context; ethics and scepticism | Basic log parsing and spreadsheet wrangling |
| Languages: multilingual analysts are scarce in EMEA | |

::: why The junior paradox
Entry-level work is the most automatable work, so the classic "learn on the job at Tier 1" ladder is narrowing. The way through is to arrive with what juniors historically lacked: verified fundamentals, a portfolio of finished work, and the ability to supervise automation. That's what this roadmap builds, and why the gates insist on unaided work, measurement and writing.
:::

?? AI gets better at finding vulnerabilities. Where does the roadmap say the bottleneck moves?
+ To triage, patching, and then secure design
- To writing faster exploits for every flaw
- To memorising more ports and event numbers
- To buying more scanners for each team
=> When discovery is cheap, the hard part is deciding what matters and fixing it safely.

?? Which task stays firmly human, according to the table?
+ Agreeing the scope of a security test
- Removing duplicate alerts from a busy queue
- Drafting a first version of a query
- Looking up reputation data for an address
=> Authorization carries legal accountability, and that can't be delegated to a model.

?! The roadmap says fundamentals matter more with AI, not less. Explain why in your own words.

## Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [OWASP GenAI Security Project](https://genai.owasp.org/)
