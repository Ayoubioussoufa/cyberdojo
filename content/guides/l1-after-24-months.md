---
title: What you can do after 24 months
summary: An honest statement of your level, the competency checklist, and seven plans for what comes next.
group: Habits
minutes: 10
source: NIST NICE Framework, for mapping your skills to work roles | https://niccs.cisa.gov/workforce-development/nice-framework
---
After 24 months at 12–15 hours a week you'll be a **strong junior**, not a senior engineer. That distinction matters: overclaiming is the fastest way to fail an interview.

You'll be able to:

- Investigate an alert end to end across Windows, Linux and cloud telemetry, and write a verdict with evidence.
- Map the attack paths in a small enterprise lab, detect that activity, and explain both sides.
- Build and secure infrastructure as code, and defend the design choices.
- Review code and applications for the vulnerability classes that actually appear in production, and fix them.
- Run a risk assessment and translate findings into a prioritised, costed plan.
- Assess and harden an AI application, a skill most working professionals lack.
- Produce written deliverables that a manager, an engineer and an auditor can each use.
- Learn a new tool quickly, because you understand the systems underneath.

::: law If you're aiming for penetration testing
This site teaches testing from the defender's side: how attacks work, how to find the weakness, and how to prove the fix. The hands-on attacking itself is practised on legal training platforms, such as [PortSwigger's Web Security Academy](https://portswigger.net/web-security) and Hack The Box. The [platforms guide](/guides/e1-platforms/) says when. Add those hours if you choose track B.
:::

**What you won't be:** an expert reverse engineer, a red-team operator, a security architect or a seasoned incident commander. Those come from years of production exposure. You'll have the foundation that makes them achievable in three to five years, plus, unusually for a junior, the evidence to prove it.

**Roles you should be competitive for:** SOC analyst, junior penetration tester, vulnerability management analyst, junior cloud security analyst, junior AppSec/DevSecOps engineer, detection engineer (with the portfolio), GRC analyst or junior consultant, IAM analyst, and AI-security-adjacent roles.

## Final competency checklist

Tick only with evidence: every box should link to a repository, a report, a recording or a lab you can rebuild.

### Technical knowledge

- Explain a full web request, including DNS, TCP, TLS and HTTP, with packet evidence.
- Explain Kerberos and NTLM and the events that record them.
- Explain OAuth 2.0, OIDC and SAML well enough to review an integration.
- Explain how AWS or Azure evaluates an authorization request, including organisation guardrails.
- Explain the OWASP Top 10:2025 with a real example and fix for each.
- Explain hashing, encryption, signatures, PKI and password storage.
- Explain the IR lifecycle and what changes in the cloud.
- Explain risk assessment, NIST CSF 2.0 and ISO/IEC 27001 and how they differ.
- Explain prompt injection, the lethal trifecta and architectural defences.
- Explain your track's core at the depth of a competent practitioner.

### Practical skills

- Build and rebuild a segmented lab with Windows, Linux, firewall and SIEM from scripts.
- Investigate a host from logs, memory and disk and produce a defensible timeline.
- Audit a small AD lab for attack paths, and detect abuse of them in your own SIEM.
- Write and test detections, and honestly measure coverage and false positives.
- Find, test and fix the main web vulnerability classes in your own code.
- Build cloud infrastructure as code, then detect and respond to an attack on it.
- Build a CI/CD pipeline with gates, SBOM, signing and policy enforcement.
- Red-team an LLM application and harden it with measured results.
- Run a risk assessment and produce a prioritised remediation roadmap.
- Write professional assessment, incident, intelligence and risk reports.

### Tools

Wireshark, Nmap and tcpdump, fluently. Burp Suite's full manual workflow. A SIEM: ingestion, queries, detections, tuning. Sysmon, Velociraptor, KAPE, Volatility. Sigma and Atomic Red Team. Terraform, Docker, Kubernetes, GitHub Actions. Python tools with tests. garak, PyRIT or promptfoo.

### Published work and presence

P01–P16 and a capstone with a demo video. About 20 write-ups, one talk or open-source contribution. Two or three certifications, or a documented decision not to. A GitHub README with six pinned repos, a portfolio site, a LinkedIn aligned with your track, a one-page project index and a consistent commit history.

### Professional, AI and interview skills

An executive summary a manager can act on. A 10-minute talk without notes. Running a tabletop exercise. Giving and receiving feedback without defensiveness. Knowing legal and ethical boundaries. AI used daily with rules, your own failure examples, measured assistants, systematic attacks, architectural defences, and the governance landscape. The 25 questions aloud, three project walkthroughs, six STAR stories, "I don't know" handled with reasoning, informed questions for them, and comfort discussing pay.

## Seven plans for Months 25–30

| Path | Months 25–27 | Months 28–30 | Certifications | Target roles |
|---|---|---|---|---|
| **A · SOC / blue** | Depth in one SIEM/EDR stack; advanced hunting; 20 more detections | Cloud detection or identity threats; SOAR; mentor someone | CDSA or SC-200; CySA+ if asked; GIAC if funded | SOC L2, detection engineer, threat hunter |
| **B · Pentest / red** | OSCP+ prep with 30–40 machines; AD depth; two timed reports | Web/API depth, cloud pentesting or red-team tradecraft | OSCP+ or CPTS, then CRTO or CAPE | Junior pentester, app tester |
| **C · Cloud** | Second provider; landing zones; Kubernetes depth | Publish a reusable secure baseline; contribute upstream | SCS-C03 or AZ-500, then CKA → CKS | Cloud security engineer, DevSecOps |
| **D · AppSec** | Code review in two languages; ASVS assessments; custom rules | Run an AppSec programme for a project | BSCP, CWES/CWEE, later OSWE | AppSec engineer, product security |
| **E · Security engineering** | Software depth; identity infrastructure; automate two processes | Run a platform component with SLOs; publish a tool | A cloud cert, KCSA/CKA | Security engineer, platform security |
| **F · AI security** | Deepen AppSec and identity; agent red-team tooling; supply chain | Original reproducible research, published and presented | HTB AI Red Teamer; SecAI+ or AI governance later | AI security engineer, AI red teamer |
| **G · GRC** | Full ISMS or audit simulation; one regulation end to end; GRC as code | AI governance: ISO 42001 and EU AI Act mapped to controls | ISO 27001 LI then LA; CISA or CRISC; AIGP | GRC analyst, IT auditor, AI governance analyst |

::: key The last advice in the roadmap
The people who go furthest aren't the ones who knew the most at 24 months. They're the ones who kept the habits: build something, break something, write it down, publish it, help someone else. The roadmap ends at Month 24. The habits shouldn't.
:::

?? What level does the roadmap honestly promise after 24 months?
+ A strong junior who can prove it
- A senior engineer ready to lead teams
- An expert in every single security specialty
- A red-team operator with real production experience
=> Overclaiming is the fastest way to fail an interview. Those senior skills come from years of production exposure.

?! In two sentences, write the honest statement of what you want to be able to say about yourself at Month 24.
