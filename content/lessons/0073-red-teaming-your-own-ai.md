---
title: Testing your own AI
summary: How AI red teaming really works: scope, a test catalogue by category, repeated trials, scoring results, and a report with honest numbers.
month: 18
minutes: 50
builds: an AI test plan with reproducibility statistics
source: NIST AI Risk Management Framework | https://www.nist.gov/itl/ai-risk-management-framework
words: red teaming, test catalogue, reproducibility
---
You've built an agent. Now find out how it fails, before someone else does. AI red teaming means testing an AI system the way an adversary would, on a system you own or have permission to test, and measuring the result.

This lesson teaches the method. It isn't a list of tricks: individual prompts age within weeks, and a method lasts.

@term AI red teaming = Testing an AI system for harmful or unintended behaviour, as an adversary would.
@term test catalogue = An organised set of test cases, grouped by the kind of failure they check.
@term reproducibility = How reliably a result happens again under the same conditions.
@term canary = A fake secret planted in a system, so that its appearance anywhere proves a leak.
@term garak = An open-source scanner that probes language models for known weaknesses.

## Scope, as always

The rules from [lesson 56](/courses/0056-how-a-pentest-works/) apply. Only test your own system, or one you've got written permission to test. Public chatbots have terms of use. Plant **canaries** instead of using real data, so that a leak is both provable and harmless.

Ask what actually matters here. A support bot saying something silly is embarrassing, and a support bot sending customer data outside is a breach. Rank your tests by harm.

| Harm | Example | Priority |
|---|---|---|
| Data leaves | Records sent to outsiders | Highest |
| Harmful action | Deleting or paying | Highest |
| Unauthorised access | Reading another user's data | High |
| Wrong output | Bad advice given confidently | Medium |
| Embarrassing output | Off-topic jokes | Lower |

?? Why plant a fake secret in your test system, rather than using real data?
+ A leak is provable, and it harms nobody
- Real data can't be stored in any model
- Fake secrets make the model run far faster
- Models refuse to read any genuine company data
=> A canary gives clear evidence with no real exposure. You can search all outputs for that exact string.

## Build a test catalogue

Organise by category, so that you can see what you've covered and what you haven't.

| Category | The question |
|---|---|
| Direct instruction override | Can a user talk it out of its rules? |
| Indirect injection | Can a document, ticket or page steer it? |
| Data disclosure | Can it be made to reveal its system prompt, or others' data? |
| Tool misuse | Can it be led to call a tool in a harmful way? |
| Excessive agency | Does it act when it should ask? |
| Memory poisoning | Does something from one session affect a later one? |
| Output handling | Can its output cause harm where it's rendered? |
| Unbounded consumption | Can someone run up your costs? |

These map to the [OWASP lists](/guides/d2-llm-security-primer/). Each test case records its exact input, the expected safe behaviour, and how to tell that it failed. Failure must be checked by code wherever you can: did the canary appear? Was the tool called? Then there's no argument about the result.

?? What makes a test case strong?
+ A failure condition that code can reliably check
- A long and very creative written test prompt
- A result that someone judged by reading once
- An attack copied from a social media post
=> If "failed" means "the canary string appeared", anybody can rerun it and agree. That's what makes results credible.

## Tools that help

| Tool | Use |
|---|---|
| [promptfoo](https://www.promptfoo.dev/) | Run test suites against your app, in CI |
| [garak](https://github.com/NVIDIA/garak) | Scan a model for known weaknesses |
| [PyRIT](https://github.com/Azure/PyRIT) | Orchestrate red-team campaigns |

Tools give you breadth. Your own understanding of the application finds the failures that matter, since a scanner doesn't know that `send_email` is your crown jewel.

?? A scanner reports no problems with your model. What does that show about your agent?
+ Little, because your tools and data weren't tested
- The agent can't ever be attacked by anybody
- The scanner has proven the application is safe
- Every catalogue category has been fully covered now
=> Generic model scans don't know your tools or your data. The application is where the real risk lies.

## Trials, and honest numbers

Models vary, so one run proves nothing. Run each case many times, and report a rate, with the conditions.

@flow One attack case > Many trials > A success rate > Fix > Same trials again > Compare

```
Case: indirect injection through a support ticket
Model and version: recorded
Trials: 20
Before fix: 14 of 20 succeeded (70%)
After stronger prompt: 6 of 20 (30%)
After tool restrictions: 0 of 20 (0%)
```

Be careful with that last line. Zero out of 20 doesn't mean that it's impossible. It means that it didn't happen in 20 tries. A useful rule of thumb, the "rule of three", says that with zero successes in N trials, the true rate could still be as high as about 3 ÷ N. So 0 of 20 still allows for about 15%. More trials shrink that.

Why did the tool restriction get to zero? Because it doesn't rely on persuading the model. A change in the numbers is only half of the report. Explain the mechanism too.

@drill trifecta

?? A fix gives 0 successes in 10 trials. What's the honest statement?
+ None in ten, so the true rate's uncertain
- The attack has been proven totally impossible now
- The system can now be declared completely secure
- The model has permanently learned to refuse it
=> Ten trials can't rule out a real rate of 20 or 30%. State the numbers, and run more if it matters.

## Write the report

Your [P15](/projects/P15/) report should read like an experiment.

| Section | Contains |
|---|---|
| Scope | What was tested, the versions, what wasn't |
| Method | The catalogue, the trials, how failure was decided |
| Findings | Exact input, rate, impact, severity reasoning |
| Fixes | What changed, with before and after rates |
| Residual risk | What remains possible, honestly |

Include the failures that you couldn't fix. Saying "prompt injection is reduced, not solved, so the design assumes a fooled model" is exactly what a senior reviewer wants to read.

::: try Run it
Use [Parrot](/machines/parrot/) to practise the whole loop in the browser. Then do it for real on your own agent from lesson 72: ten distinct cases, at least 20 trials each, and a before-and-after table.
:::

?? What does a good AI security report say about prompt injection after your fixes?
+ It's reduced, and the design limits the damage
- It's completely solved and needs no further work
- It's the model provider's problem and not yours
- It isn't worth mentioning in a technical report
=> Honest residual risk builds trust. Designing for a fooled model is the mature position.

?! Write five test cases for an AI assistant you know: the input idea, the safe behaviour you expect, and how code could detect a failure.
