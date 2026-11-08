---
title: Social engineering
summary: Why people comply with attackers. The psychology behind phishing, voice and SMS scams, business email compromise and helpdesk fraud, and the process controls that actually stop them.
level: foundation
side: both
minutes: 40
attack: T1566, T1598, T1656
needs: 0054-phishing-analysis
pair: 16-02-usable-security, 11-02-authentication-mechanics, 15-09-physical-security
source: Verizon Data Breach Investigations Report | https://www.verizon.com/business/resources/reports/dbir/
words: pretext, vishing, business email compromise
---
It's often easier to ask for the password than to crack it. Social engineering works on people's instincts: to help, to obey, to hurry. Those are good instincts in normal life, so training alone can't remove them. Lesson 54 taught you to analyse an email. This module explains why such messages work, and which process changes make them fail.

@term pretext = A false story that gives an attacker a believable reason to ask for something.
@term vishing = Social engineering by voice call.
@term smishing = Social engineering by text message.

## Concept

### Fundamentals: why it works

Robert Cialdini described principles of persuasion, and attackers use all of them.

| Principle | In an attack |
|---|---|
| Authority | "This is the CEO" |
| Urgency, or scarcity | "Payment must leave by 3 p.m." |
| Social proof | "Everyone in your team has already done it" |
| Liking | A friendly caller who knows your manager's name |
| Reciprocity | "I fixed your ticket, could you just confirm this?" |
| Commitment | Small requests that lead to a big one |

All of them aim to replace careful thinking with quick reaction. Time pressure is the most dangerous one, because it stops people from checking.

### The attack sequence

Research comes first. LinkedIn, company sites and leaked data supply names, roles, suppliers and jargon. A **pretext** then gives a reason for contact. Then comes the request, and finally an exit that leaves no suspicion.

| Channel | Example |
|---|---|
| Email phishing | A fake login page |
| Spear phishing | A tailored message to one person |
| Vishing | "IT support" calling about a security issue |
| Smishing | A delivery fee link |
| Helpdesk fraud | A caller asks to reset an employee's MFA |
| Physical | Tailgating through a door |

### Business email compromise

**BEC** often involves no malware. An attacker takes over or imitates a mailbox, then asks for a change of bank details, or an urgent transfer. Because nothing malicious is attached, filters struggle. The FBI's [IC3 reports](https://www.ic3.gov/) put BEC among the costliest categories of cybercrime.

### Advanced: the helpdesk, and AI

**Identity processes are the new target.** Groups such as [Scattered Spider](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a) have phoned helpdesks while posing as employees, getting passwords and MFA reset. That sidesteps strong authentication altogether, by attacking its recovery path. MGM Resorts' 2023 incident was widely linked to such a call.

**MFA fatigue** floods a user with prompts until they accept one. Number matching defeats it. See [Authentication mechanics](/modules/11-02-authentication-mechanics/).

**Generative AI** removes the old clues. Perfect grammar and native language are now cheap, as lesson 54 showed, and **voice and video deepfakes** have been used in real fraud. In 2024, an employee of the firm Arup [reportedly paid out about US$25 million](https://www.cnn.com/2024/02/04/asia/deepfake-cfo-scam-hong-kong-intl-hnk/index.html) after a video call with fake colleagues. So "I recognised the voice" isn't verification any more.

The conclusion matters: **controls must not depend on people spotting a fake.**

?? Why do urgent requests work so well in social engineering?
+ Time pressure stops people checking the request
- Urgent emails bypass every spam filter automatically
- Busy staff have weaker passwords than others
- Attackers can only call during office hours
=> Urgency pushes people from careful thinking into quick reaction, which is exactly when a false story survives.

## Threat model

| Technique | ATT&CK |
|---|---|
| Phishing | [T1566](https://attack.mitre.org/techniques/T1566/) |
| Phishing for information | [T1598](https://attack.mitre.org/techniques/T1598/) |
| Impersonation | [T1656](https://attack.mitre.org/techniques/T1656/) |

It's often the first step: an attacker needs only one person to say yes, while defenders need everyone to say no.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| DMARC, SPF, DKIM | Stop domain spoofing | Protecting your own mail domain |
| Report-phish button | Lets staff report | Turning people into sensors |
| FIDO2 keys | Phishing-resistant login | Removing the password from play |
| GoPhish | Runs phishing simulations | Authorised awareness programmes |
| Have I Been Pwned | Finds exposed accounts | Understanding your exposure |

## Defence

Design the process so that one person's mistake can't cause a disaster.

- **Out-of-band verification.** Any payment change needs a call to a number already on file, never one from the message.
- **Two-person approval** for large transfers.
- **Helpdesk identity proofing.** Manager approval, video check against ID, or a code sent to a known device. Never reset MFA from a phone call alone.
- **Phishing-resistant MFA**, to make stolen passwords useless.
- **A safe word** for executive requests.
- **Report without blame.** People who feel safe report quickly. Time to report matters more than click rate.
- **Limit public information** where it doesn't serve a purpose, such as staff lists.

## Pitfalls

- **"Only stupid people fall for it."** A well-made attack works on experts. It's about timing, not intelligence.
- **"Awareness training will fix this."** It helps, but humans can't be perfect on every click.
- **Punishing clicks.** Fear hides incidents.
- **Trusting caller ID or a familiar voice.** Both can be spoofed.
- **Forgetting recovery paths.** Password reset is often weaker than login.

?? Which control best stops a fake CEO payment request?
+ A callback to a known phone number
- A longer annual security awareness slide deck
- A stronger password for the finance team
- A bigger spam filter on the gateway
=> Verification on a separate, trusted channel works, even if the email or the voice looks perfect.

## Exercise

::: law Lab only
Never send phishing or make pretext calls to people without written authorisation from their organisation. Simulated phishing against classmates or colleagues is unethical without consent. Test only your own accounts.
:::

1. Collect five real phishing emails from your own spam folder. For each, name the persuasion principle.
2. Write a helpdesk script for verifying a caller who has lost their MFA device.
3. Draw a payment change process that would resist a compromised mailbox.
4. Check what a stranger could learn about your own organisation from LinkedIn. Don't contact anyone.
5. With written approval and in a lab with test mailboxes, set up GoPhish, and send a harmless simulated email to your own test account.

?! You run security for a hospital. Write the three changes that would most reduce social engineering risk, without slowing urgent care.

## Further reading

- Robert Cialdini, *Influence: The Psychology of Persuasion*.
- [Verizon DBIR](https://www.verizon.com/business/resources/reports/dbir/).
- [CISA advisory on Scattered Spider](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-320a).
- [FBI Internet Crime Complaint Center](https://www.ic3.gov/), which publishes annual reports.
- Christopher Hadnagy, *Social Engineering: The Science of Human Hacking*.
