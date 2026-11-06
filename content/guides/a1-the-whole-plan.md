---
title: The whole plan in one page
summary: What you'll have after 24 months, the principles behind the plan, the four phases, the budget and your first week.
group: Start here
minutes: 12
source: NIST CSF 2.0 and MITRE ATT&CK are the two maps this plan is built around | https://www.nist.gov/cyberframework
---
This is a 24-month, month-by-month plan that takes a Master's student from practical zero to a junior professional who can **prove** her ability. At 12–15 hours a week on top of coursework, that's roughly 1,300 hours of deliberate practice: enough to become genuinely competent, if those hours go into building, breaking, defending and documenting rather than watching videos.

## What you'll have at Month 24

- **Evidence, not claims.** 16 published projects plus one capstone, each with a README, diagrams and a written report.
- **A T-shaped profile.** Solid fundamentals across networking, Linux, Windows and Active Directory, web, cloud, SOC work, incident response and GRC, with real depth in one track.
- **2–3 targeted certifications,** each paired with a project that shows the same skill.
- **An AI-augmented workflow.** You use AI to go faster, you can measure when it's wrong, and you know how to attack and secure AI applications.
- **Professional assets.** A CV, LinkedIn and GitHub presence, about 20 public write-ups, a recorded talk, a network and rehearsed interview stories.

@term T-shaped profile = Broad working knowledge across the field, plus deep skill in one specialty.

## The principles

| Principle | In practice |
|---|---|
| **Fundamentals before tools** | Tools change every year. TCP/IP, operating systems, identity and HTTP don't. Months 1–7 are about how systems work. |
| **Build → break → defend → document** | Every topic ends with something you built, attacked, detected or fixed, and wrote up. Writing is where learning becomes employable. |
| **Milestones are gates** | Each month ends with exit criteria. If you haven't met them, use the buffer days rather than starting the next month half-ready. |
| **Evidence over certificates** | Certificates pass HR filters. Projects and reports pass technical interviews. |
| **T-shaped, decided late** | Broad for 12 months, a provisional lean at Month 12, a commitment at Month 18. Specializing too early is the most common mistake. |
| **AI-augmented, not AI-dependent** | Rules from Month 1: attempt first, verify everything, keep a log. |
| **Consistency beats intensity** | Twelve focused hours every week beats heroic bursts. Exam periods drop to maintenance mode rather than stopping. |

?? Why does the plan delay choosing a specialty until Month 18?
+ You choose better after real experience of each field
- Employers usually refuse candidates who specialize before they graduate
- Specialties need certificates that take 18 months to earn
- The early months only cover tools every specialty needs
=> Nobody picks a specialty from a description. Months 9–18 are a tasting menu, so you decide from what you actually enjoyed and did well.

## The four phases

| Phase | Months | The question it answers | Main outputs |
|---|---|---|---|
| 1 · Foundations | 1–6 | How do computers, networks, operating systems, the web and cryptography actually work? | P01–P05 started; fluency in Linux, networking, Python, Windows, web and crypto |
| 2 · Core security | 7–12 | How are real environments attacked, detected, responded to and governed? | AD lab, web pentest, SOC lab, pentest report, detection repo, GRC pack; provisional track |
| 3 · Advanced core + lean | 13–18 | What do cloud, forensics, threat intel, malware, AppSec and AI security demand? | Cloud lab, DFIR and CTI reports, malware report, secure pipeline, LLM red team; track committed |
| 4 · Specialize & launch | 19–24 | How do I become the obvious hire for one role? | Track sprints, capstone, AI evaluation project, track certification, applications, interviews |

## Budget

Approximate US dollars as of September 2026. Always confirm on the official page, and ask for student pricing everywhere.

| Tier | Over 24 months | What it buys |
|---|---|---|
| **Free-first** | $100–300 | Everything in the free columns, plus one low-cost practical exam. Slower, but entirely viable. |
| **Recommended** | $1,000–1,800 | About 12 months of TryHackMe Premium, HTB Academy, 2–3 exams, 3–4 books, under $50 of cloud usage. |
| **Accelerated** | $3,000–4,500 | Adds a premium exam such as OSCP+, Gold-level lab access and paid courses. |

TCM Security offers about 20% for students, HTB Academy has a student plan, and OffSec has academic offers. Microsoft exams use regional pricing that's often below the US price.

## Your first seven days

You don't need all of this before starting: lessons 1–10 run in your browser. Do this list once you reach [the lab lesson](/courses/0012-build-your-lab/).

1. **Day 1:** Create a GitHub account and a public repo called `cyber-journey`. Install Obsidian and create the vault from [the learning system](/guides/j1-the-learning-system/). Start an hours-log spreadsheet.
2. **Day 2:** Install VirtualBox or VMware Workstation Pro. Create an Ubuntu Server VM. Take your first snapshot.
3. **Day 3:** OverTheWire Bandit levels 0–5. Write one lesson per level in Obsidian.
4. **Day 4:** pwn.college Linux Luminarium: the first module.
5. **Day 5:** Read the NIST CSF 2.0 overview and the ATT&CK Getting Started page. Draw both maps from memory.
6. **Day 6:** Block your weekly schedule in your calendar. Write your learning contract.
7. **Day 7:** A 30-minute review: what worked, what didn't, your three priorities for next week.

## Lab hardware

Buy nothing until Month 5 if you're unsure.

- **Minimum:** 16 GB RAM, 4+ CPU cores, 512 GB SSD. Enough for 3–4 virtual machines at once.
- **Comfortable:** 32 GB RAM, 1 TB SSD. Needed for a full Active Directory lab such as GOAD. A used mini-PC running Proxmox VE, which is free, makes a cost-effective lab.
- **Weak laptop?** Use browser-based machines like TryHackMe AttackBox or HTB Pwnbox, a smaller AD lab (one domain controller, one client) and cloud labs with a budget alarm.

?! Which of the seven principles do you expect to be hardest for you personally, and what will you do about it?
