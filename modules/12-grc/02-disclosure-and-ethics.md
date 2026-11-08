---
title: Disclosure and professional ethics
summary: What to do when you find a flaw. Coordinated disclosure, bug bounties, safe harbour, handling sensitive data during tests, and the ethics that separate this field from crime.
level: foundation
side: both
minutes: 40
attack: none
needs: 0002-the-rules-of-the-game, 0056-how-a-pentest-works
pair: 12-01-computer-crime-law, 16-07-reading-and-doing-research, 04-13-testing-workflow-burp
source: CERT Guide to Coordinated Vulnerability Disclosure | https://certcc.github.io/CERT-Guide-to-CVD/
words: coordinated disclosure, safe harbour, embargo
---
Security people work with dangerous knowledge. Sooner or later, you'll find something that wasn't meant to be found, and what you do in the next hour may define your career. This module covers how the field has learned to handle that responsibly, and why it took decades of arguments to get there.

@term coordinated vulnerability disclosure = Reporting a flaw privately and agreeing on a time to publish it after a fix.
@term embargo = An agreed period during which details of a flaw stay private.

## Concept

### Fundamentals: three models

| Model | What happens | Problem |
|---|---|---|
| Non-disclosure | Tell nobody, or sell it | Users stay exposed |
| Full disclosure | Publish everything at once | Attackers learn at the same time as defenders |
| **Coordinated disclosure** | Report privately, fix, then publish | Depends on vendors responding |

Coordinated disclosure is now the norm. A deadline keeps vendors honest. [Google Project Zero](https://googleprojectzero.blogspot.com/p/vulnerability-disclosure-policy.html) popularised a default of 90 days, with extensions in some cases, and a much shorter limit if a flaw is already being exploited.

### The process

@flow Find > Verify, minimally > Report to the owner > Vendor fixes > Agree a date > Publish advisory and CVE

ISO/IEC 29147 covers how vendors receive reports, and ISO/IEC 30111 covers how they handle them. [security.txt](https://www.rfc-editor.org/rfc/rfc9116) gives a standard place for contact details, at `/.well-known/security.txt`. If a vendor doesn't answer, a coordinator such as [CERT/CC](https://www.kb.cert.org/vuls/report/) or a national CERT can help. In Morocco, that's maCERT at DGSSI.

### Bug bounties

A bounty programme pays for valid reports within a stated scope. Read the policy as you'd read a contract: scope, forbidden tests, data handling, and rules on publishing. Out-of-scope testing isn't protected, whatever you find. **Safe harbour** language says that the company won't pursue legal action for good-faith research. Frameworks such as [disclose.io](https://disclose.io/) offer standard wording. Remember that one company's promise can't bind prosecutors or third parties.

### Handling what you find

The most serious ethical test comes when you see real people's data.

- **Stop at proof.** Show that you could read a record, and don't read a thousand.
- **Don't download what you don't need,** and delete what you must keep, once the report's closed.
- **Don't test on real accounts** unless you're explicitly allowed. Use your own test accounts.
- **Protect your findings.** Reports are a map for attackers, so encrypt them and limit who sees them.
- **Report critical findings right away**, without waiting for the final report.

### Advanced: ethics beyond the rules

The law sets a floor. Professional codes go further. The [ACM Code of Ethics](https://www.acm.org/code-of-ethics) starts with contributing to society and avoiding harm. [ISC2's Code](https://www.isc2.org/ethics) asks members to protect society and act honourably. Certification bodies can withdraw credentials for breaches.

Research has hard cases.

- **Human subjects.** In 2021, University of Minnesota researchers [submitted flawed patches](https://lore.kernel.org/lkml/YH%2FfM%2FTsbmcZzwnX@kroah.com/) to the Linux kernel to study review, without consent. Maintainers banned the university, and the researchers apologised. The lesson: people's time and trust count as harm.
- **Internet measurement.** Scanning the Internet can disturb systems. The [Menlo Report](https://www.dhs.gov/sites/default/files/publications/CSD-MenloPrinciplesCORE-20120803_1.pdf) adapts research ethics principles to ICT research, and asks about respect, beneficence, justice and public interest. Universities' ethics boards review this kind of work.
- **Selling exploits.** A legal market exists for vulnerabilities, and tools have been used against journalists. Many researchers refuse such work. Others don't. Think about what you'd accept before you're offered money.
- **Conflict of interest.** Testing your employer's competitor or auditing your friend's work needs disclosure.

?? What does `security.txt` tell a researcher?
+ How to report flaws to that organisation
- Which passwords the administrators are using now
- Which server versions are currently left unpatched
- What a bug bounty pays for findings
=> RFC 9116 defines this file, so that a researcher can find the right contact without guessing.

## Threat model

The risks are mostly to you and to others. A sloppy test can damage production or expose data. A rushed public post can arm attackers. An angry vendor might threaten legal action. Attackers also watch patches: when a fix ships, they diff it to find the flaw, so the time between patch and exploitation keeps shrinking, which is why vulnerability management (lesson 55) has to be fast.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `security.txt` | Publishes your contact | Running a programme |
| PGP or age | Encrypts reports | Sending sensitive details |
| CVE program and CNAs | Assigns identifiers | Publishing a flaw |
| HackerOne, Bugcrowd, YesWeHack | Run bounties | Finding a legal target |
| [disclose.io](https://disclose.io/) | Policy templates and a directory | Writing a policy |
| CERT/CC | Coordinates multi-vendor cases | When a vendor doesn't respond |

## Defence

For an organisation:

- **Publish a vulnerability disclosure policy,** with a contact and safe harbour.
- **Acknowledge fast.** A human reply within days prevents most conflicts.
- **Track reports** to closure with a clear owner.
- **Credit reporters** if they want it.
- **Prepare legal and communications** before a report lands.
- **Look for a sector duty.** The EU's [Cyber Resilience Act](/modules/12-05-eu-regulation/) requires manufacturers to run a disclosure process, and to report actively exploited flaws.

## Pitfalls

- **Threatening a researcher.** This almost always ends badly for the company.
- **"I'll show them by posting it."** You may harm users, and yourself.
- **Asking for money before you share details.** It can look like extortion, unless a bounty programme exists.
- **Testing further to prove a bigger impact.** Stop at the minimum that demonstrates the issue.
- **Forgetting that an NDA may limit you.** Check before you publish client work in a portfolio.

?? You find exposed customer data during an authorised test. What should you do?
+ Stop, prove minimally, and report it immediately
- Download everything to show the full impact
- Post a redacted sample on social media
- Keep testing until the engagement is finished
=> Prove the access with the least possible data, then tell the client at once, as they may be under active attack.

## Exercise

::: law Lab only
Write only. Don't test any organisation to complete this. If you practise reporting, use a platform's training programme or your own lab.
:::

1. Fetch `/.well-known/security.txt` from three large companies. Which have one? What does each ask for?
2. Read a public bounty policy, and list its scope, forbidden tests and safe-harbour language.
3. Write a vulnerability report for a fake flaw in your lab: title, impact, steps, evidence, fix.
4. Draft a one-page disclosure policy for a small company.
5. Read the Menlo Report's four principles, and apply them to a proposal to scan all Moroccan universities' websites for a known flaw.

?! You find an SQL injection on a local company's site by accident, while using it normally. There's no policy or contact. Write out, step by step, what you'd do, and what you wouldn't.

## Further reading

- [CERT Guide to Coordinated Vulnerability Disclosure](https://certcc.github.io/CERT-Guide-to-CVD/).
- [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116), `security.txt`.
- [The Menlo Report](https://www.dhs.gov/sites/default/files/publications/CSD-MenloPrinciplesCORE-20120803_1.pdf).
- [ACM Code of Ethics](https://www.acm.org/code-of-ethics).
- [OWASP Vulnerability Disclosure Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Vulnerability_Disclosure_Cheat_Sheet.html).
