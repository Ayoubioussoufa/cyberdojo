---
title: Working with your local tutor
summary: How to get real help from the AI tutor that runs on your own computer — the one rule that keeps every attack lab legal, how to ask so it actually helps, and when to use each of its modes.
group: Study skills
minutes: 12
source: Ollama, run large language models locally | https://github.com/ollama/ollama
---
The tutor runs on your own computer, through a local model, so nothing you type leaves your machine. It isn't a search box. It is a study partner that can explain a concept, quiz you on it, review your answer or your code, and walk you through a hands-on lab one phase at a time. Getting real help out of it is a skill of its own, and this guide is that skill.

## The one rule: everything hands-on is yours

Before anything else, the rule that sits under every lab in this course. Every attack you practise happens on something *you own*: your own machine on `127.0.0.1`, a virtual machine you built, or a training platform that invites you in. Never a system that isn't yours — that is the whole line between learning a craft and committing a crime.

So ask your questions in those terms. Not "how do I SQL-inject a login", but "how do I SQL-inject the login on *my own* Flask server at `127.0.0.1:5000`". The words matter: they keep you, and the tutor, on the right side of that line.

The tutor's **Lab** mode holds the line for you. If you ask it to aim an attack at any other host — a real website, an address you don't own — it refuses, says why in a sentence, and brings you back to your own machine. That refusal is not the tutor being difficult. It is the exact judgement you will be hired for. See the hands-on labs in the [Workshop](/workshop/), where every target is a small, deliberately weak service you stand up on your own box.

## Give it the context it needs

A model answers the question you actually asked. "It doesn't work" earns you a guess. The exact command, the exact output, and what you expected instead earns you an answer.

Compare these two:

- **Weak:** "my sql injection isn't working"
- **Strong:** "I'm on the SQL injection Workshop lab, attacking my own server at `127.0.0.1:5000`. I sent `' OR '1'='1` as the username and got back `no such column`. I expected to log in without a password. What did I get wrong?"

The second one names the lab, the target (yours), the input, the result, and the expectation. Tell it your level, too — "I have never used Docker before" changes the entire answer you get back.

## Use the right mode for the job

The tutor has five modes, and reaching for the right one is half the skill:

- **Explain** — you want to understand a concept. Start here when you are lost.
- **Hint** — you are stuck in the middle of a task and want the smallest nudge, not the answer.
- **Review my work** — paste your answer or your code and it tells you what is right, what is missing and what is wrong, without rewriting it for you.
- **Quiz me** — it tests whether the idea actually stuck. This is retrieval practice, the most powerful study tool there is; see [How memory works](/guides/s1-how-memory-works/).
- **Lab** — it walks you through a build-attack-defend lab one phase at a time, waiting for you to run each command, and bound to your own machine throughout.

## Getting unstuck in a lab

When a lab fights you, paste the command and the *full* error, then ask "why did this happen?" before you ask "what is the fix?". Understanding the cause *is* the lab; the fix is only the end of it. And always ask for the defence, not just the attack — "now, how do I stop this?" — because defending the thing you just broke is the entire point of every lab here. For the habits that make lab time count, read [Studying hands-on](/guides/s3-studying-hands-on/).

## What it won't do, and why that's good

The tutor will not point an attack at someone else's system, and it will not hand you a tool that takes an arbitrary target. Ask for either and it declines and offers the lab version instead. Treat that as a feature, not a wall: it is modelling the one habit that separates a professional from a defendant.

A local model is not perfect — a small one can slip. If it ever hands you something aimed off your own machine, that is a bug in the model, never a licence. Keep every hands-on step on `127.0.0.1` or a box you own, and you will never be the one explaining yourself to a judge. For the wider picture of using AI well without letting it think for you, see [AI: using it well](/guides/d3-using-ai-well/).

::: tip Think out loud first
Before you ask the tutor anything, write one line: what you are trying to do, what you tried, and what happened. Half the time you will answer your own question just writing it down — that is the "rubber duck", and it genuinely works.
:::

Everything in this guide is something you can practise right now: open the tutor, pick a mode, and ask it to explain this very page. It is your teacher — the more precisely you talk to it, the more it gives back.
