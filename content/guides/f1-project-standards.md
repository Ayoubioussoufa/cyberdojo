---
title: Project standards and the capstone
summary: The rules every portfolio project follows, and what the capstone looks like for each of the seven tracks.
group: Practice and projects
minutes: 8
source: The 16 projects, with full build plans | https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes
---
The [16 projects](/projects/) progress from beginner to professional. Each has an objective, a build plan, deliverables, how to present it, and an interview pitch.

## Standards for every project

- **Finished beats ambitious.** A small project with docs, tests and a write-up outranks an abandoned masterpiece.
- **Every project ends in writing:** a README a stranger can follow, plus a public write-up on the interesting decision you made.
- **Reproducible:** scripts, Terraform, Docker or step-by-step instructions. "It works on my VM" isn't a portfolio.
- **Honest limitations section.** Senior reviewers read it first, and it's the strongest credibility signal you can give.
- **Safe to publish:** no secrets (gitleaks in pre-commit), no client or personal data, no malware samples, no write-ups of active HTB machines, and a licence file.
- **Six pinned repositories** on your GitHub profile, refreshed as better work replaces older work.

| Level | Projects | What it proves |
|---|---|---|
| Beginner | P01 lab, P02 casebook, P03 toolkit, P04 AD lab | You can build, operate and document systems |
| Intermediate | P05 build–break–fix, P06 SOC-in-a-box, P07 pentest report, P08 detection-as-code, P09 GRC pack, P12 CTI | You can attack, defend, measure and explain |
| Advanced | P10 cloud, P11 DFIR, P13 malware, P14 pipeline, P15 LLM red team, P16 AI assistant + evaluation | You handle modern environments end to end |
| Professional | Track capstone, Months 20–22 | You can scope, deliver and present like a practitioner |

## The capstone

One substantial, track-aligned body of work, scoped to finish in eight weeks, documented as you go and presented with a recorded demo. Every interview will circle back to it, so it should be the work you can defend best.

| Track | Capstone |
|---|---|
| A · SOC / IR | Detection and response programme for a simulated company: telemetry design, 25+ tested detections, three playbooks, a simulated incident with a full report, metrics |
| B · Pentest / red team | Full engagement against a multi-domain lab: scope, attack narrative, custom tooling, client-grade report, retest, and a defender annex mapping each step to a detection |
| C · Cloud security | Secure landing zone as code: multi-account structure, SCP/RCP guardrails, centralised logging, 15+ detections, playbooks, before/after posture, break-glass procedure |
| D · AppSec / DevSecOps | AppSec programme for a real open-source project: threat model, code review, merged fixes, secure pipeline, ASVS requirements, developer guide |
| E · Security / detection engineering | Automation platform: tested log pipeline, detection CI/CD, two automated responses with guardrails, dashboards, measured reduction in manual work |
| F · AI security | AI red-team toolkit and method: reusable attack suites, an MCP review checklist, reproducible findings, a published methodology |
| G · GRC | ISMS starter kit for a fictional SME: scope, risk method and register, Statement of Applicability, 8–10 policies, evidence matrix, audit simulation, management review pack |

## What makes a capstone credible

- **A real constraint:** a budget, a deadline, a stakeholder like a friend's small business, a student association or an open-source project. Constraints create the stories interviewers want.
- **Measurements:** before/after numbers, coverage, detection rates, time saved. Numbers make claims checkable.
- **A demo video (10–15 minutes) and a one-page summary.** Many reviewers will never clone the repository.
- **A limitations and next-steps section** showing you know what you didn't solve.

?? What do senior reviewers reportedly read first in a project?
+ The honest limitations section of the project README
- The list of tools used across the project
- The commit count shown on the repository page
- The screenshots placed at the page's very top
=> Admitting what doesn't work shows you understand the work. It's the strongest credibility signal you can give.

?! Think of one real constraint you could give your capstone. Who might the stakeholder be?

## Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [GitHub Docs: About READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Diátaxis: a framework for technical documentation](https://diataxis.fr/)
- [Keep a Changelog](https://keepachangelog.com/)
