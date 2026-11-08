---
title: Usable security and culture
summary: When security fails because of how people work, the design is usually at fault. Warnings, passwords, phishing tests, and how to build a culture where reporting is safe.
level: intermediate
side: defence
minutes: 35
attack: none
needs: 16-01-social-engineering
pair: 16-01-social-engineering
source: Adams and Sasse, Users Are Not the Enemy | https://dl.acm.org/doi/10.1145/322796.322806
words: psychological acceptability, warning fatigue, just culture
---
People write down passwords, click through warnings, and email themselves files. It's tempting to call that carelessness. Research says otherwise: people are making sensible trade-offs against security that gets in the way of their work. If a control depends on everyone being perfect all day, then it's badly designed.

@term psychological acceptability = Saltzer and Schroeder's principle that security must be easy enough to use correctly by default.
@term warning fatigue = The habit of ignoring warnings after seeing too many of them.
@term just culture = An approach that treats honest mistakes as learning opportunities, while keeping accountability for reckless acts.
@term shadow IT = Tools that staff use for work without the IT department's approval.

## Concept

### Fundamentals: the classic findings

In 1975, Saltzer and Schroeder [listed design principles](https://web.mit.edu/Saltzer/www/publications/protection/) for secure systems, including **psychological acceptability**. Two 1999 papers then founded the field.

- **[Users Are Not the Enemy](https://dl.acm.org/doi/10.1145/322796.322806)** (Adams and Sasse) found that users' insecure habits came from password rules that conflicted with how they worked.
- **[Why Johnny Can't Encrypt](https://www.usenix.org/conference/8th-usenix-security-symposium/why-johnny-cant-encrypt-usability-evaluation-pgp-50)** (Whitten and Tygar) tested PGP, and found that most participants couldn't use it safely, even with time to try.

The shared lesson: security is a secondary task. Nobody logs in for the joy of logging in. When a control blocks the main job, people route around it.

### What goes wrong

| Design | Human response |
|---|---|
| Forced password rotation | `Summer2026!`, then `Autumn2026!` |
| Too many warnings | Clicking "OK" automatically |
| Slow approval process | Shadow IT, such as personal Dropbox |
| Long policy documents | Nobody reads them |
| Blame after mistakes | Hiding mistakes |

Each row is a rational response to a poor design. NIST's dropping of forced rotation, seen in [Password storage](/modules/03-10-password-cracking/), came directly from such evidence.

### Warnings

Browsers are the classic laboratory. [Akhawe and Felt](https://www.usenix.org/conference/usenixsecurity13/technical-sessions/presentation/akhawe) (2013) studied real-world warnings at scale, and found that design changes alter how often people click through. So warnings should be rare, specific, and offer a safe default. If everything's a warning, then nothing is.

### Advanced: phishing tests and culture

Simulated phishing is common, yet its value is debated. A [15-month study of 19,500 employees](https://arxiv.org/abs/2112.07498) (Lain and others, IEEE S&P 2022) found that embedded training didn't make people more resilient, and could even make them slightly more prone to fall for phishing. The same study found that crowd-sourced reporting worked well. So measure **reporting**, avoid punishing clicks, and don't trick staff with cruel lures, such as a fake bonus.

**Culture** matters more than posters. A **just culture**, borrowed from aviation and healthcare, separates honest error from negligence. A person who reports their own mistake quickly gives you minutes that might save the company. Sanctioning them teaches everyone else to stay silent.

**Security champions** place a trained volunteer inside each team, which gives the security group a friendly route into daily work.

**Developers are users too.** A safe API is one that's hard to misuse, as [crypto libraries](/modules/03-09-breaking-bad-crypto/) show. Good defaults beat documentation. The most effective security is the kind that nobody has to think about: passkeys, automatic updates, and encrypted-by-default storage.

?? What does "Users Are Not the Enemy" argue?
+ Bad security design causes many user failures
- Users should be punished for each mistake
- Passwords are stronger when changed every week
- Attackers rarely target ordinary employees at work
=> The study found that people work around controls that conflict with their tasks, so the fix lies in design.

## Threat model

Attackers exploit these gaps directly: habituated clicks on MFA prompts, shadow IT with no logging, and a culture where nobody reports a strange call. A control that people bypass gives the *appearance* of security, which is worse than an honest gap, because no one is watching for what's been missed.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Usability testing | Five users, watching | Testing any security flow |
| Password managers | Remove memory burden | A quick win |
| Passkeys | Replace passwords | Better security and easier |
| Report-phish button | Easy reporting | Building the habit |
| Staff surveys | Reveal workarounds | Finding hidden friction |

## Defence

- **Make the safe path the easy path.**
- **Ask why people bypass a control** before adding another one. Shadow IT is a user research finding.
- **Reduce warnings,** and test them with real people.
- **Reward reporting** publicly.
- **Measure time to report**, not click rate alone.
- **Keep policy short** and tied to real tasks.
- **Add security champions** to engineering teams.

## Pitfalls

- **"Humans are the weakest link."** It's a lazy phrase that blames the people you rely on.
- **Punishing the person who reported.** You'll get no second report.
- **Annual training as the whole programme.** It doesn't change daily habits.
- **Cruel phishing lures.** They damage trust in the security team.
- **Assuming experts are immune.** Admins click too.

?? What happens when warnings appear too often?
+ People learn to dismiss them without reading
- People read each of them more carefully
- People switch to a safer web browser
- People report every one to the SOC
=> Repetition trains a habit of dismissal, so the rare warning that matters gets treated like the rest.

## Exercise

::: law Lab only
If you survey or observe people, get their consent, keep the results anonymous, and don't deceive anyone.
:::

1. Pick a security flow you've used: MFA setup, or password reset. Time it, and list each moment of confusion.
2. Ask three friends to complete it while you watch silently. Note where they stop.
3. Redesign one step, and test it again.
4. Find a real warning in your browser or OS. Rewrite it so that a non-expert knows what to do.
5. Read the summary of the phishing study above. What would you change about a typical awareness programme?

?! Your staff keep using a personal cloud drive because the company one is slow. Write how you'd respond, as both a security lead and a colleague.

## Further reading

- Saltzer and Schroeder, [The Protection of Information in Computer Systems](https://web.mit.edu/Saltzer/www/publications/protection/).
- Whitten and Tygar, [Why Johnny Can't Encrypt](https://www.usenix.org/conference/8th-usenix-security-symposium/why-johnny-cant-encrypt-usability-evaluation-pgp-50).
- Lain and others, [Phishing in Organizations: Findings from a Large-Scale and Long-Term Study](https://arxiv.org/abs/2112.07498).
- [SOUPS](https://www.usenix.org/conference/soups2026), the Symposium on Usable Privacy and Security.
- [CyBOK Human Factors knowledge area](https://www.cybok.org/knowledgebase1_1/).
