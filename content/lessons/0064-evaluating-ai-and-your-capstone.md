---
title: Your capstone and measuring AI
summary: Designing a capstone you can finish, and proving an AI assistant's worth with a real evaluation.
month: 20
minutes: 30
builds: a scoped capstone proposal and a ground-truth dataset plan
source: promptfoo, testing prompts and models as code | https://www.promptfoo.dev/docs/intro/
words: ground truth, precision, recall
---
This is when your profile stops looking like a student's. You choose one substantial project, and you learn to measure rather than claim.

@term ground truth = Verified correct answers used to judge a system.
@term precision = Of the things flagged, the share that were really correct.
@term recall = Of the things that should be flagged, the share that were found.
@term capstone = The substantial final project of the roadmap.

## Scope the capstone

Write: the problem, success criteria, threat model, architecture, timeline and deliverables. It must be finishable in **eight weeks**. See [the capstones by track](/guides/f1-project-standards/).

## P16: the evaluation is the project

The assistant is the excuse. The point is proving what it's worth.

@flow Build ground truth: 100+ items > Run the assistant > Score it > Classify failures > Improve > Rescore

| Measure | Question |
|---|---|
| Precision | When it says "malicious", how often is it right? |
| Recall | How many real cases did it catch? |
| Cost and latency | Is it worth running? |
| Failure taxonomy | How does it go wrong? |

?? An alert assistant flags 10 alerts as malicious, and 8 really are. There were 16 in all. What's its recall?
+ 50%, since it found 8 of 16
- 80%, since 8 of 10 were right
- 100%, since it found some of them
- 62%, since it missed 6 of them
=> Recall is found divided by total real cases: 8 / 16. The 80% figure is its precision.

Anyone can say "I use AI a lot". Very few juniors can say "it agreed with my verdicts on 84% of 120 alerts, and here are the 19 cases where it was confidently wrong."

?! Name a task from your own track that an AI assistant could help with. What would your ground truth be?
