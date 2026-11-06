---
title: How to run a month
summary: The rhythm of each month, how gates work, what to do when you fall behind, and how deep to go in each subject.
group: Start here
minutes: 10
source: The full month pages are on the Roadmap | https://overthewire.org/wargames/
---
Each month in [the roadmap](/roadmap/) has a goal, a week-by-week plan, labs, resources, an AI exercise, a portfolio output and an exit gate. **The exit gate is the part that matters.** It's the difference between "I studied that" and "I can do that".

## The rhythm of a month

- **Week 0 (30 minutes).** Read the whole month page, block the hours in your calendar and skim the gate, so you always know what you're working towards.
- **During the month.** One platform, one project, one topic thread. Write lab notes as you go, never afterwards.
- **Last weekend.** Test yourself against the gate, publish one write-up, run a 30-minute retrospective and decide what to carry into the buffer days.
- **If a milestone fails.** That's information, not failure. Diagnose it: a missing prerequisite, too little hands-on, too much video? Fix it with the buffer days before moving on.

## Timing rules

- A month is about 4.3 weeks. **The extra days are buffer.** Spend them on gaps. Never skip a gate in Phases 1–2.
- **Fast-track test (Phase 1).** At the start of Months 1–6, try the gate first. If you already pass 80%, which your Master's may cover, compress the month into one week and move on.
- **More than two weeks behind?** Cut optional items, such as paid resources and stretch labs. Never cut milestone items. Six months late with real skills beats on time with gaps.
- **Calendar.** The original plan assumes Month 1 = October 2026 and Month 24 = September 2028, matching a two-year Master's. If you start later, the numbers simply shift. If a final-year internship (PFE) falls in Months 17–22, switch to internship mode and make that project your capstone.

?? You reach the end of Month 2 and can't yet subnet quickly. What does the plan say?
+ Use the buffer days to close that gap
- Move on and come back to it later
- Skip it because the cloud handles subnetting now
- Restart the entire course from the very beginning
=> Gates in Phases 1–2 are never skipped. A failed gate tells you exactly what to fix, and buffer days exist for that purpose.

## The depth map: master, understand, or postpone

Nobody is an expert in everything, and trying is the fastest way to be mediocre at everything. This map decides where your hours go.

| Deep, for everyone | Working knowledge, for everyone | Deep only in your track | Later, after Month 24 |
|---|---|---|---|
| TCP/IP, DNS, HTTP, TLS | Cryptography (use it correctly, don't design it) | Blue: detection engineering, DFIR, hunting | Binary exploitation |
| Linux and Windows internals | Databases and SQL | Red: exploitation, AD attacks, web depth, reporting | Advanced reverse engineering |
| Identity: AD, Kerberos, OAuth/OIDC, Entra ID | Cloud security (AWS + Azure basics) | Cloud: IAM logic, IaC, Kubernetes, cloud detection | Hardware, IoT and embedded |
| Scripting: Python, Bash, PowerShell | Containers and Kubernetes | AppSec: code review, threat modeling, CI/CD | OT/ICS security |
| Log analysis and investigation | SIEM workflow, detection basics, incident response | SecEng: automation, data pipelines, hardening | Mobile app security |
| Web fundamentals, OWASP Top 10 | Pentest method, vulnerability management | AI Sec: LLM attacks, evaluations, guardrails | Wireless deep dives |
| Technical writing | Secure coding, GRC, threat intel, architecture, AI security basics | GRC: ISO 27001, risk, audit, AI governance | Cryptanalysis, red-team C2 development, SABSA/TOGAF |

**Why this split?** The left column is what interviewers probe for every junior role, and what lets you verify AI output. The second column prevents blind spots, like a SOC analyst who can't read an IAM policy. The "later" column is fascinating but has few junior openings and a long ramp, so it's a better investment after your first job.

?? Binary exploitation looks exciting. When should you study it, according to the depth map?
+ After Month 24, once you have a job
- During Month 1 to stand out from others
- Instead of networking, which AI handles for now
- Alongside Windows internals in the fifth roadmap month
=> It has few junior openings and a long ramp. Fascinating, but your fundamentals earn your first job.

## Scoring yourself

Use the [skill matrix](/skills/) at Months 6, 12, 18 and 24. Levels run 0 none, 1 aware, 2 working (guided tasks), 3 proficient (unguided, explains trade-offs), 4 advanced (can teach, handle novel cases). Score only what you can demonstrate with no notes and no AI.

?! Pick one subject from the "Deep, for everyone" column. Why do you think every junior role needs it?
