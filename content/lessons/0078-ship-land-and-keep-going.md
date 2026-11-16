---
title: Ship, land the job, keep going
summary: Months 21 to 24: finishing the capstone, preparing an exam, the job search, staying current in the age of AI, and an honest final assessment.
month: 21
minutes: 65
builds: a plan for your last four months
source: The final competency checklist | https://niccs.cisa.gov/workforce-development/nice-framework
words: bridge role, retrospective, informational interview
---
The last months are less about new knowledge and more about finishing, proving and communicating. Shipping is the skill nobody teaches.

@term bridge role = A job such as IT support or NOC that leads into security.
@term informational interview = A short conversation to learn about someone's work, not to ask for a job.
@term retrospective = A structured look back at what worked and what to change.

## Month by month

| Month | Focus | Done when |
|---|---|---|
| 21 | Capstone 60%, exam prep 25%, portfolio cleanup 15% | Demo recorded; two practice exams at passing level |
| 22 | Ship the capstone; sit the exam; 5–10 tailored applications a week | Published and reproducible; 40+ applications logged |
| 23 | Interview drills, one public contribution | 6+ mock interviews; [the 25 questions](/guides/h4-interviews/) answered aloud |
| 24 | Final assessment and next plan | [Checklist](/guides/l1-after-24-months/) complete with evidence; next 12 months written down |

Book the exam at the start of Month 22, so that the date can't drift. A booked date works better than any amount of motivation.

"Two practice exams at passing level" is a rule you can check, and it should be the last two you took, not your best two. One good score after four poor ones is luck until it repeats.

@code exam-ready

?? Why book the certification exam at the start of the month?
+ A fixed date stops your preparation from drifting
- Exams booked early are always much easier now
- Booking late is banned by every exam provider
- The fee is refunded if you book early
=> Deadlines beat intentions. An open-ended plan to sit the exam "when ready" tends to never arrive.

## Finish properly

Retest your own capstone as an adversary would. What you find goes into the **limitations** section, and senior reviewers read that first.

A finished project has a README a stranger can follow, a diagram, a demo of 10 to 15 minutes, and the numbers from your evaluation. Have someone who's never seen it try to run it. Everything they get stuck on is a fix for you.

::: tip Use AI, keep your voice
Compress the capstone for three audiences: a recruiter, an executive, an engineer. Then rewrite each sentence yourself. Unedited AI prose signals exactly the wrong thing.
:::

A README that a stranger can follow has the same few parts every time:

| Part | Answers |
|---|---|
| What it is | One paragraph, with the problem it solves |
| How to run it | Exact commands, from a clean machine |
| How it works | A diagram, and the main design decisions |
| Results | The numbers from your evaluation |
| Limitations | What it doesn't do, and what you'd fix next |

?? Your capstone has a known weakness you didn't fix. What should you do?
+ Document it clearly in the limitations section
- Remove the project from your portfolio entirely
- Hide it and hope that nobody notices
- Claim it was out of scope anyway
=> Honest limitations are the strongest credibility signal you can give.

## The search

Follow the [career guides](/guides/h1-cv-and-online-presence/). Apply at a 60–70% match, consider **bridge roles**, ask for referrals explicitly, and follow up after 7–10 days. Keep a rejection log with reasons, when you can get them.

Keep the search in a log, so that it's managed rather than remembered. Each row is one application: the company, the date you applied, its status, and whether you've followed up. The follow-up rule is the one people forget: no answer after seven days means a short, polite message.

| Company | Applied | Status | Followed up |
|---|---|---|---|
| Atlas Freight | 2026-11-02 | No reply | No |
| Rif Transport | 2026-11-12 | No reply | No |
| Sahel Logistics | 2026-10-28 | Interview | No |

@code follow-ups

Matching an advert is arithmetic too. Count the listed skills you can show evidence for, and divide by the total:

@code skills-match

An **informational interview** is often the best move a beginner has. Ask someone for 15 minutes about their job, with no request attached. People like to help, and that's how most referrals begin.

?? A job asks for ten skills, and you've got seven. What should you do?
+ Apply, because that's a reasonable job match
- Wait until you have all ten skills
- List all ten as skills you have
- Only apply to jobs with no requirements
=> Job adverts list a wish, not a minimum. But never claim what you can't defend in an interview.

## Interviews

Technical interviews test how you think. Say your reasoning out loud, admit what you don't know, and say how you'd find out. For behavioural questions, tell short **STAR** stories: situation, task, action, result. Then practise walking through a flagship project in 5–7 minutes: problem, approach, evidence, result, and what you'd do differently.

A STAR story is short, and its result has a number in it:

> **Situation:** our lab SIEM produced 400 alerts a day, and nobody read them. **Task:** I had two weeks to make the queue usable. **Action:** I measured the top ten rules, tuned three with documented exceptions, and removed two that never fired correctly. **Result:** alerts fell to 60 a day, and precision rose from 0.2 to 0.7.

"I improved our alerting" is a claim. The four parts, with a measured result, are evidence.

@code star-check

?? The interviewer asks something you don't know. What's the best answer?
+ Say so, then explain how you'd find out
- Invent a confident answer and hope it's right
- Change the subject to something else entirely now
- Ask them to skip it and move on
=> Honest reasoning is what they're hiring. A confident invention is the one thing that can't be trained away.

## Staying current

Your field changes every month. The tools an analyst uses in five years may look nothing like today's, and more routine work will be automated. What lasts is the reasoning: how systems really work, how to verify a claim, and how to explain risk. Keep a small routine, as the [staying current guide](/guides/k1-staying-current/) describes, and use AI as a colleague whose work you check. It's the same habit you've built for two years.

?? As AI automates more routine security tasks, which skill grows in value?
+ Judging and verifying what automated tools produce
- Memorising the numbers of every Windows event
- Typing shell commands faster than your colleagues
- Reading raw logs by hand all day
=> When a machine does the first pass, someone must know when it's wrong. That's what the fundamentals were for.

## After Month 24

Pick one of the [seven plans](/guides/l1-after-24-months/). Keep the habits: build something, break something, write it down, publish it, help someone else. Run a **retrospective** on the two years: what worked, what didn't, and what you'd tell yourself on day one.

?? Which habit from the last two years matters most after the roadmap ends?
+ Building, breaking, writing it down, and publishing it
- Collecting as many certificates as you possibly can
- Waiting until you feel ready before applying anywhere
- Avoiding AI tools so your skills stay pure
=> The roadmap ends, and the loop doesn't. Each cycle of building, testing, writing and sharing leaves evidence that someone else can read.

## Review a portfolio project

A friend asks you to read their capstone README before they send it with applications.

```
# AI-SOC: an assistant that detects all attacks
Built with the latest AI. Very accurate and production ready.
(No setup steps. No limitations section.)
```

?? What's wrong with the title's claim?
+ No system detects every attack, so it's implausible
- Titles should never mention any AI at all
- The title is too short for a project
- Capstones must never describe what they can detect
=> An absolute claim tells a reviewer that you haven't measured it. "Triages 100 labelled alerts at 0.8 precision" is smaller and believable.

?? What should replace "very accurate"?
+ The evaluation's numbers, with the test set's size
- A stronger adjective instead, such as extremely accurate
- A screenshot of the assistant's very best answer
- The name of the model used underneath it
=> Numbers with their conditions can be checked. Adjectives can't, and reviewers skip them.

?? Why add the missing sections?
+ Strangers need to run it and judge it
- Long READMEs always rank higher in search results
- GitHub rejects any repository that lacks these sections
- Recruiters only ever read the very last section
=> Setup steps prove it works outside your machine, and a limitations section proves you understand it. Both are what turn a repository into evidence.

?! Write three professional goals, with dates, for the 12 months after this roadmap.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [CyberSeek career pathway](https://www.cyberseek.org/pathway.html)
- [NICE Framework](https://niccs.cisa.gov/workforce-development/nice-framework)
