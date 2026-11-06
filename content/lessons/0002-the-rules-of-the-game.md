---
title: The rules that keep you safe and legal
summary: What you may and may not touch, how a safe lab protects you, and how to use AI without damaging your own learning.
month: 0
minutes: 15
builds: write your own learning contract
source: OverTheWire rules, a short model of how a practice community expects you to behave | https://overthewire.org/rules/
words: authorization, scope, lab
---
Cybersecurity teaches you how attacks work. The same action, like logging in to a system with a guessed password, is a professional service on one machine and a crime on another. **The only difference is permission.** Learn this before anything else.

@term scope = The exact list of systems and actions a security test is allowed to cover.
@term lab = A private practice environment that you own, where nothing real can be harmed.

## The one rule

::: law
Only test systems you own, or systems you have **written** permission to test. Curiosity is not a defence. "I didn't change anything" is not a defence. "I was only looking" is not a defence.
:::

Unauthorised access to a computer system is a crime almost everywhere, even when nothing is damaged:

- In **Morocco**, [Law 07-03](https://ictpolicyafrica.org/en/entity/s8yr3njtjo7) added computer offences to the Penal Code. The Council of Europe [lists them as Articles 607-3 to 607-11](https://www.coe.int/fr/web/octopus/-/morocco).
- In **France**, article 323-1 of the Penal Code punishes fraudulently accessing or staying in an automated data-processing system.

We're not quoting sentences here, because penalties change and this isn't legal advice. If you ever need certainty, ask your university's legal office or a lawyer. What matters is the principle: **accessing without permission is the offence**. Staying in a system you reached by accident can count too.

?? You find a flaw on your university's website by accident while browsing normally. What should you do?
+ Stop right there and report it through an official channel
- Explore a little further to prove how serious it is
- Post a warning publicly so all other students stay safe
- Test it with a friend's account to confirm it works
=> Going further turns an accident into unauthorised access. Stop, keep a note of what you saw, and report it to the university's IT or security contact.

## Where you're allowed to play

Good news: there's a huge legal playground, and this course uses it.

| Place | Why it's allowed |
|---|---|
| The terminal in this course | It's a simulation in your own browser |
| Your own virtual machines | You own them |
| Practice platforms like [OverTheWire](https://overthewire.org/wargames/) and [TryHackMe](https://tryhackme.com/) | They exist to be attacked, under their rules |
| Bug bounty programmes (Month 12+) | The company gives written permission, within a stated **scope** |

Each has rules. The [OverTheWire rules](https://overthewire.org/rules/) ask you not to spoil the game for others, and not to publish credentials. [Hack The Box](https://www.hackthebox.com/) forbids public write-ups of active machines. Breaking a platform's rules can get you banned, and in a bug bounty, going out of scope means you're no longer authorised.

@term bug bounty = A programme where a company invites people to find flaws in stated systems, under written rules, often for a reward.

## Four safety habits

These come directly from the roadmap's ground rules. Start them now so they're automatic later:

1. **Authorization first.** Before any test, ask: do I own this, or do I have it in writing?
2. **Malware stays locked up.** From Month 16, samples stay in an isolated lab: no shared folders, no internet, no personal accounts.
3. **No real data.** Don't use real personal or employer data in labs, in write-ups or in public AI tools. Use made-up data.
4. **Respect the platform.** Never share exam content or spoil active challenges.

?? You want to practise password attacks tonight. Which target is acceptable?
+ A virtual machine that you built yourself
- A friend's laptop, since they said "whatever"
- A small shop's website that looks abandoned
- Your university's login page, late at night
=> Only your own systems, or written permission, count. A casual "whatever" isn't written authorisation with a defined scope, and it wouldn't protect either of you.

## Rules for using AI

You'll have an AI tutor throughout this course, and every page has a button to send your work to it. AI makes learning faster if you use it well, and quietly hollow if you don't. The roadmap sets strict rules, and they're the most valuable habit in this lesson.

| Rule | Why |
|---|---|
| **Try first.** Give it 20 honest minutes before asking | The struggle is where learning happens |
| **Explain back.** Never keep an answer you can't explain | Interviews and incidents test understanding |
| **Verify.** Check claims against the primary source | AI invents flags, IDs and facts with total confidence |
| **Log it.** Note each claim you check, and whether it was right | After a year you'll know exactly where AI fails |
| **Protect data.** Never paste secrets or personal data | That's a data leak, and it's fireable |

@term hallucination = When an AI states something false with confidence, such as a command flag or a law that doesn't exist.
@term primary source = The original authority on a fact: the manual, the standard, the specification or the code itself.

::: ai How to use the copy button
Use **Copy everything for my AI tutor** *after* you've answered, not before. Then you're getting corrected, which builds memory. Asking first feels faster, but you'll have learned nothing.
:::

?? An AI gives you a command with a flag you've never seen. What's the professional next step?
+ Check the flag in the tool's own manual
- Run it right away on your main computer
- Ask the AI whether it is really sure
- Search for the same claim on social media
=> The AI can't verify itself. A manual is a primary source. Test anything unfamiliar in a lab, never on a machine you care about.

## Your learning contract

The roadmap asks you to write a one-page contract with yourself. It sounds silly, and it works, because you decide *now* what you'll do on a bad day.

?! Write your contract: your goal, how many hours a week you'll study, when, and how you'll reward yourself. The roadmap suggests 12–15 hours on top of your Master's, or 5 in exam season.

Next, we open up the computer itself.
