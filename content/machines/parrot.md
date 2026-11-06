---
title: Parrot
summary: A support assistant leaks customer data because of a ticket written by a stranger. Reproduce it, measure the popular fix, then fix the design and prove it with numbers.
level: Intermediate
month: 18
minutes: 45
builds: an AI security fix with before-and-after measurements
words: lethal trifecta, attack success rate
---
Oasis added Parrot, an assistant that summarises support tickets, can look up customers and can send email. Last week a customer asked why an "auditor" emailed them about their own data. Nobody at Oasis sent that email.

@term attack success rate = The share of repeated attempts in which an attack works.

::: law This is a simulation
Parrot is a toy of a few dozen lines with fixed rules, not a real model. It reproduces the shape of the problem so you can study it safely. Only ever test AI systems you own, or those you've got written permission to test.
:::

## Before you start

Read [how language models work](/courses/0070-how-language-models-work/) and [securing AI applications](/courses/0071-securing-ai-applications/). Remember the rule from Month 18: a finding isn't a finding until it reproduces.

?? Why run an attack many times, rather than just once?
+ Models vary between runs, so the rates matter
- Running it only once is against the law
- Attacks only ever work on the tenth try
- It makes the model learn the attack permanently
=> One success or one failure proves little. A rate over many trials, with the conditions, is the real finding.

## The machine

@range parrot

## What just happened

| Run | Attack success |
|---|---|
| Baseline | High |
| Firm words in the system prompt | Lower, but never zero |
| Tools limited in code | Zero |

The stronger prompt failed for a simple reason: a prompt is a request, and the attacker's text arrives through the same channel as your request. The tool limits worked because they sit **outside** the model. It can be fooled as much as you like, and your code still refuses.

| OWASP risk | Here |
|---|---|
| LLM01 Prompt Injection | The hidden note in the ticket |
| LLM02 Sensitive Information Disclosure | Customer records leaving |
| LLM06 Excessive Agency | A bot allowed to email anyone, with no approval |

?? Why did the policy change work when the prompt change didn't?
+ Code limits hold even when the model's fooled
- Policy files are written in a smarter language
- The model reads policy files much more carefully
- Attackers aren't able to see any policy files
=> Controls outside the model don't depend on its judgement. That's the test of any AI defence.

## Your report

Good AI security reports read like experiments: the exact input, the number of trials, the rate before and after, and what's still at risk. Be honest about that last one. Parrot can still write a wrong summary after your fix, so a person should check anything important.

?? After your fix, what should your report still mention as a remaining risk?
+ It can still produce wrong or misleading summaries
- It's now completely safe from every possible attack
- Nothing, since the measured attack rate was zero
- The model has been proven always truthful now
=> Your fix closed one path. Stating what's left is what makes a report credible.

?! Write the finding: the risk, the exact conditions, the rate before and after each change, and the remaining risk.
