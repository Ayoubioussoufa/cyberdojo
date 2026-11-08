---
title: Tabletop exercises
summary: Rehearse a crisis while nothing's on fire. How to design, run and learn from a tabletop exercise, so that the first time your team makes these decisions isn't during a real incident.
level: foundation
side: defence
minutes: 35
attack: none
needs: 0059-incident-response
source: NIST SP 800-84, Guide to Test, Training, and Exercise Programs | https://csrc.nist.gov/pubs/sp/800/84/final
words: tabletop exercise, inject, after-action review
---
During a real incident, the hard questions aren't technical. Who can decide to take the shop offline? Who tells customers? Do we pay? Whose phone number is that? A tabletop exercise asks those questions in a meeting room, at no cost beyond people's time, and it usually exposes more than a technical test does.

@term inject = A new piece of information the facilitator adds during an exercise, to move the scenario on.
@term after-action review = A structured discussion, after an exercise or incident, of what happened and what should change.

## Concept

### Fundamentals: what it tests

A tabletop tests **people and process**, not tools. It answers questions such as: does the plan work, do people know their roles, and can decisions be made in time?

| Type | What happens | Cost |
|---|---|---|
| Tabletop | Discussion around a scenario | Low |
| Functional or drill | One team performs its actual tasks | Medium |
| Full-scale | Several teams act, with real systems | High |

[NIST SP 800-84](https://csrc.nist.gov/pubs/sp/800/84/final) sets out this progression, and CISA publishes free [Tabletop Exercise Packages](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages).

### Who should be there

An exercise that only includes the security team tests almost nothing. For a serious scenario, invite:

- Incident lead and technical responders
- IT operations
- Legal and privacy (data protection officer)
- Communications
- An executive who holds decision rights
- Whoever owns the affected business service

### Designing one

1. **Set objectives.** "Test our notification decision under GDPR's 72 hours" beats "practise a breach".
2. **Pick a realistic scenario.** Use your own systems, and threats that are likely, such as ransomware, a leaked key, or a supplier breach.
3. **Write a timeline of injects**, about six to ten, each forcing a decision.
4. **Prepare questions** for each inject, along with the facilitator's notes.
5. **Plan logistics:** 60 to 120 minutes, a facilitator, a scribe and a no-blame rule.

An example inject sequence for ransomware:

| Time in scenario | Inject | Decision forced |
|---|---|---|
| Friday 18:00 | Helpdesk reports encrypted files on two laptops | Who declares an incident? |
| 19:30 | The file server's affected, backups are unclear | Do we isolate the network? |
| Saturday 09:00 | A ransom note gives 72 hours | Who's involved? Legal? Insurer? |
| 12:00 | A journalist emails asking for comment | Who answers, and with what? |
| Sunday | The attackers post a sample of customer data | Do we notify? Whom? |

### Advanced: making it hard enough

- **Remove someone.** "The CISO is on a flight, unreachable." Do deputies know what to do?
- **Remove a system.** If email and chat are down, how do you talk? Out-of-band communications are often missing.
- **Add ambiguity.** Real incidents start with incomplete facts.
- **Time pressure.** Run a section in real time.
- **Bring in third parties.** Does your cloud provider, MSSP or insurer's contract say what you think it does?
- **Executive version.** Boards benefit from a short exercise on ransom, regulators and reputation. Regulations such as [NIS2](/modules/12-05-eu-regulation/) make management directly accountable.

### After the exercise

The value lies in the follow-up. Hold an **after-action review** right away. Record what went well, what failed, and specific actions with owners and dates. Update the plan, then test those changes next time. An exercise with no actions was just a meeting.

?? What is a tabletop exercise mainly for?
+ Finding gaps in plans, roles and decisions
- Testing how fast the firewall hardware is
- Grading each employee's technical knowledge for HR
- Proving to auditors that nothing can fail
=> It rehearses people and process. Discovering a gap in a meeting is the cheapest way to find it.

## Threat model

Tabletops don't map to a technique. They answer an organisational threat: slow or confused response. Attackers exploit that gap by striking on holiday weekends, spreading misinformation, and pressuring executives directly. A prepared team reduces the time an attacker has, and the impact of what they did.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [CISA CTEPs](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages) | Ready-made scenarios | Your first exercise |
| [Backdoors & Breaches](https://www.blackhillsinfosec.com/projects/backdoorsandbreaches/) | Incident card game | Fun, frequent practice |
| Incident response plan | The thing being tested | Always bring it |
| A shared timeline doc | Record of decisions | The scribe's main tool |

## Defence

- **Run them on a schedule**, at least yearly, and after major changes.
- **Vary the scenario,** so that people don't just rehearse the last one.
- **Track actions** to closure, the same as audit findings.
- **Keep an offline copy** of the plan and the contact list, as well as a way to reach people when systems are down.
- **Include the night shift** and deputies, not only the usual leaders.

## Pitfalls

- **A script that always ends well.** If nothing failed, it wasn't hard enough.
- **Blame.** People stop speaking up. Keep it about the plan.
- **Too technical for the room.** Executives switch off, and the key decisions don't get practised.
- **The wrong people.** Sending deputies with no authority tests nothing.
- **No follow-up.** Findings that sit in a slide deck will be found again next year.

?? What's the best first scenario?
+ A likely incident that affects real systems
- A rare attack from a foreign government
- A perfect plan that always works well
- A purely technical test with no managers
=> Starting with a plausible event on your own systems keeps people engaged and finds practical gaps fast.

## Exercise

::: law Lab only
This is a discussion, but treat it with care. Use a fictional company, or get agreement from your organisation, and keep any real weaknesses you discover confidential.
:::

Run a one-hour tabletop with two or three classmates, for a fictional 200-person company.

1. Choose an objective, and write a scenario with six injects. Take the ransomware table above as a template.
2. Assign roles: incident lead, IT, legal, communications, CEO.
3. Run it. One person facilitates, and one takes notes.
4. Add one hard inject: "email and chat are down".
5. Hold a 15-minute after-action review, and write five actions with owners.
6. Update your incident response template from P11 or your own notes.

?! Which decision in an incident should be made in advance, rather than at 3 a.m.? Pick one, and write down who decides, based on what, and how fast.

## Further reading

- [NIST SP 800-84](https://csrc.nist.gov/pubs/sp/800/84/final).
- [CISA Tabletop Exercise Packages](https://www.cisa.gov/resources-tools/services/cisa-tabletop-exercise-packages).
- [NIST SP 800-61r3](https://csrc.nist.gov/pubs/sp/800/61/r3/final), incident response recommendations.
- [NCSC Exercise in a Box](https://www.ncsc.gov.uk/information/exercise-in-a-box), free from the UK's cyber security agency.
