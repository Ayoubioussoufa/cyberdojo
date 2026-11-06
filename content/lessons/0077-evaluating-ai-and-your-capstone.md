---
title: Your capstone and measuring AI
summary: Designing a capstone you can finish, and proving an AI assistant's worth with a real evaluation: ground truth, precision, recall, cost and failures.
month: 20
minutes: 50
builds: a scoped capstone proposal and a ground-truth dataset plan
source: promptfoo, testing prompts and models as code | https://www.promptfoo.dev/docs/intro/
words: ground truth, precision, recall
---
This is when your profile stops looking like a student's. You choose one substantial project, and you learn to measure rather than claim.

@term ground truth = Verified correct answers used to judge a system.
@term precision = Of the things flagged, the share that were really correct.
@term recall = Of the things that should be flagged, the share that were found.
@term capstone = The substantial final project of the roadmap.
@term failure taxonomy = Named categories for the ways a system goes wrong.
@term human in the loop = A design where a person reviews or approves before an action happens.
@term regression test (AI) = Rerunning a fixed evaluation after a change, to see whether quality dropped.

## Scope the capstone

Write: the problem, success criteria, threat model, architecture, timeline and deliverables. It must be finishable in **eight weeks**. See [the capstones by track](/guides/f1-project-standards/).

A good scope has a sentence you can test: "Triage 100 labelled alerts, and agree with a human on at least 80%." A bad one has no end: "Build an AI SOC." Cut features until you can finish, because a small finished project beats a large unfinished one in every interview.

?? Which is the better capstone success criterion?
+ Catch 90% of 100 labelled test cases
- Make the company's whole security much better
- Use as many AI models as possible
- Build something that looks really impressive overall
=> It's measurable and it has an end. If you can't tell whether you've met a goal, you can't finish.

## P16: the evaluation is the project

The assistant is the excuse. The point is proving what it's worth.

@flow Build ground truth: 100+ items > Run the assistant > Score it > Classify failures > Improve > Rescore

**Ground truth** is your answer key, and it's most of the work. It must be labelled before you see the assistant's answers, or you'll quietly mark in its favour. If a label is hard, get a second person to check it.

| Measure | Question |
|---|---|
| Precision | When it says "malicious", how often is it right? |
| Recall | How many real cases did it catch? |
| Cost and latency | Is it worth running? |
| Failure taxonomy | How does it go wrong? |

?? Why should you label your test set before running the assistant?
+ So its answers can't influence your own labels
- Because labelling afterwards always costs a lot more
- So the model can read your labels first
- Because the labels expire after a few days
=> Seeing an answer anchors your judgement. Blind labelling keeps the score honest.

## Precision and recall, slowly

Everything starts from four counts:

| | Really malicious | Really benign |
|---|---|---|
| **Said malicious** | True positive (TP) | False positive (FP) |
| **Said benign** | False negative (FN) | True negative (TN) |

- Precision = TP ÷ (TP + FP). Look at the top row.
- Recall = TP ÷ (TP + FN). Look at the left column.

So why not simply use accuracy? Suppose 1% of alerts are malicious. An assistant that says "benign" every time scores 99% accuracy and catches nothing. That's why accuracy alone misleads in security.

@drill pr-calc

?? An alert assistant flags 10 alerts as malicious, and 8 really are. There were 16 in all. What's its recall?
+ 50%, since it found 8 of 16
- 80%, since 8 of 10 were right
- 100%, since it found some of them
- 62%, since it missed 6 of them
=> Recall is found divided by total real cases: 8 / 16. The 80% figure is its precision.

## Score an assistant

@range evals

## Failures are the useful part

A single score doesn't tell you what to fix. So name each failure: wrong tool, wrong context, invented fact, misread log. This **failure taxonomy** gives you your improvement list. Rerun the same test set after every change as a **regression test**, because a fix for one thing often breaks another.

Don't forget cost. Note the tokens and the time per item, because a tool that's 2% better and ten times the price may not be better at all.

Anyone can say "I use AI a lot". Very few juniors can say "it agreed with my verdicts on 84% of 120 alerts, and here are the 19 cases where it was confidently wrong."

?? You change a prompt, and five failures disappear. What should you do before believing it?
+ Rerun the full set to catch new failures
- Declare victory and remove the old test cases
- Delete the failures from your results file then
- Try the new prompt once on a demo
=> Fixes have side effects, and models vary. Only the whole set, repeated, shows a real gain.

## Keep a human in the loop

An evaluation also tells you where an assistant may act alone. High-confidence, low-harm tasks might be automated. Anything irreversible, such as disabling an account, should have a **human in the loop**. Design that as a real decision, with the evidence shown to the person, not as a button that everyone clicks without reading.

?? What's the risk of a human approval step where people approve hundreds of items daily?
+ They stop reading and approve automatically
- The AI model becomes much slower
- Approvals are illegal for automated tasks
- Humans will always reject every request
=> Approval fatigue turns a control into a formality. It's alert fatigue again, so keep requests rare and meaningful.

?! Name a task from your own track that an AI assistant could help with. What would your ground truth be?
