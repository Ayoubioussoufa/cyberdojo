---
title: Computer crime law
summary: Where the legal lines sit for security work. Authorisation, the main laws in the US, UK, EU, France and Morocco, tools, hacking back, and how cross-border cases work.
level: foundation
side: both
minutes: 45
attack: none
needs: 0002-the-rules-of-the-game
pair: 12-02-disclosure-and-ethics
source: Council of Europe, Budapest Convention on Cybercrime | https://www.coe.int/en/web/cybercrime/the-budapest-convention
words: authorisation, dual-use tool, jurisdiction
---
Every technique in this course is legal or criminal depending on one thing: permission. Lesson 2 gave you the rule. This module gives you the detail, so that you know why your scope letter matters. It's general education, and not legal advice. Laws vary and they change, so for a real decision, ask a qualified lawyer in your country.

@term authorisation = Permission from someone who has the right to give it, for a stated scope and time.
@term dual-use tool = Software useful for both defence and attack, such as a scanner.

## Concept

### Fundamentals: access without authorisation

Most computer crime laws share a few building blocks, drawn from the Budapest Convention.

| Offence | Plain meaning |
|---|---|
| Illegal access | Entering a system without right |
| Illegal interception | Capturing non-public transmissions |
| Data interference | Damaging, deleting or altering data |
| System interference | Seriously hindering a system |
| Misuse of devices | Producing or supplying tools for these offences |

Notice what's absent: **motive**. In general, "I was only testing" or "I wanted to help" isn't a defence. Harm isn't required for many offences either. Simply getting in can be the crime.

### Main laws

| Jurisdiction | Law | Notes |
|---|---|---|
| United States | [Computer Fraud and Abuse Act](https://www.law.cornell.edu/uscode/text/18/1030), 18 U.S.C. § 1030 | Federal. States have their own too |
| United Kingdom | [Computer Misuse Act 1990](https://www.legislation.gov.uk/ukpga/1990/18/contents) | Section 3A covers tools |
| EU | [Directive 2013/40/EU](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX:32013L0040) | Sets a minimum across member states |
| France | [Code pénal, articles 323-1 and following](https://www.legifrance.gouv.fr/codes/section_lc/LEGITEXT000006070719/LEGISCTA000006149839/), from the 1988 Loi Godfrain | Article 323-3-1 covers tools, with a legitimate-motive exception |
| Morocco | Law 07-03 (2003), added to the penal code at articles 607-3 and following | Law 05-20 (2020) sets cybersecurity duties, and law 09-08 covers personal data |

For Moroccan students, [DGSSI](https://www.dgssi.gov.ma/) is the national authority on cybersecurity, and CNDP supervises personal data.

### What "authorisation" really means

Scope isn't a formality.

- **Who** can give permission? The owner, not a friend who works there. On a cloud host, the provider's rules also apply.
- **What** exactly? IP ranges, applications, accounts and techniques.
- **When?** Start and end dates and hours.
- **In writing,** with signatures, before you start.

A US case shows how the idea evolved. In [*Van Buren v. United States*](https://www.supremecourt.gov/opinions/20pdf/19-783_k53l.pdf) (2021), the Supreme Court held that "exceeds authorized access" covers entering areas that a person isn't entitled to reach. It doesn't cover misusing access they already have. In 2022, the [Justice Department said](https://www.justice.gov/archives/opa/pr/department-justice-announces-new-policy-charging-cases-under-computer-fraud-and-abuse-act) that it wouldn't charge good-faith security research under the CFAA. That's a charging policy, and it doesn't change the statute, or bind other countries.

### Advanced: the hard questions

**Tools.** Laws often cover tools "primarily designed" for crime, or tools supplied with knowledge of likely misuse. Nmap on your laptop is normal. Selling an exploit kit to a stranger isn't.

**Hacking back.** Breaking into an attacker's server to recover data is unauthorised access, even if they attacked you first. It may also hit an innocent third party whose machine they hijacked. Don't do it.

**Interception and monitoring.** Reading traffic on a company network needs a legal basis, and employment and privacy law apply, especially for [TLS inspection](/modules/07-03-sensors-and-tls-inspection/).

**Jurisdiction.** An attacker in one country using a server in a second to hit a victim in a third may fall under all three. The [Budapest Convention](https://www.coe.int/en/web/cybercrime/the-budapest-convention) (2001) harmonises offences and supports cooperation. Morocco has been a party since 1 October 2018. The [UN Convention against Cybercrime](https://www.unodc.org/unodc/en/cybercrime/convention/home.html), adopted in December 2024, opened for signature in Hanoi in October 2025. It enters into force after 40 states become parties, and civil society groups have raised concerns about its human rights safeguards.

?? Why can a well-meaning scan of a stranger's site still be illegal?
+ Good intent doesn't replace an owner's permission
- Scanning tools are banned in every country
- Websites publish their security rules in law
- Only police may run a network scan
=> Most laws focus on access without right, and don't excuse it for good motives. Nmap itself isn't illegal in most places.

## Threat model

Here the risk is to you. The common ways that students get into trouble are:

- Testing a university or employer system "to show them".
- Going beyond a bug bounty's scope.
- Pivoting from an in-scope host to an out-of-scope one.
- Keeping real customer data from a test.
- Being tricked by a client who doesn't own the target.

Check ownership yourself, and stop as soon as you're unsure.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Written authorisation letter | Your legal protection | Before any test |
| Rules of engagement | Defines scope and limits | Every engagement |
| `whois`, IP allocation lookup | Checks who owns a target | Verifying a client's claim |
| Provider policies | State cloud testing rules | Testing on AWS, Azure, GCP |
| A lawyer | Actual advice | Anything uncertain |

## Defence

- **Get it in writing,** every time, from the real owner.
- **Keep the letter with you** during testing.
- **Stick to the scope,** and log what you do, with timestamps.
- **Stop and ask** if you find you're somewhere unexpected.
- **Report crimes** through proper channels. For a company, involve legal counsel and law enforcement rather than taking action yourself.
- **Know your employer's cover.** Check what insurance and contracts protect you.

## Pitfalls

- **"It was public, so it's allowed."** Reachable doesn't mean authorised. Courts differ on this, so don't count on it.
- **"My friend who works there said OK."** They probably can't give that permission.
- **"I didn't take anything."** Access alone can be the offence.
- **"The law is the same everywhere."** It isn't, and your client's country can matter as much as yours.
- **Quoting penalties from a blog.** Sentences vary and sources disagree. Check the current text.

?? What does the Budapest Convention mainly do?
+ It aligns national cybercrime law and cooperation
- It sets one global prison term everywhere
- It licenses security professionals in member states
- It forces vendors to disclose every bug
=> It's a treaty that harmonises offences and supports cross-border investigation. Each state still writes and enforces its own law.

## Exercise

::: law Lab only
This exercise is research and writing only. Don't test anything to complete it.
:::

1. Read the text of your own country's computer crime law. Find the offence that covers unauthorised access. Copy out its key wording.
2. Compare it with section 1 of the UK's Computer Misuse Act. What's different?
3. Write a one-page authorisation letter for a test of a fictional company. Include owner, scope, dates, techniques, exclusions, emergency contact.
4. Read one cloud provider's penetration testing policy, and note what's forbidden.
5. Take these three scenarios: scanning your school's Wi-Fi, reporting an exposed database that you stumbled on, and scanning your own home router. For each, write what you'd do.

?! A friend who runs a small shop asks you to "test the website" as a favour, but a hosting company runs it. List what you need before you start, and from whom.

## Further reading

- [Budapest Convention](https://www.coe.int/en/web/cybercrime/the-budapest-convention), and its [explanatory report](https://rm.coe.int/16800cce5b).
- [18 U.S.C. § 1030](https://www.law.cornell.edu/uscode/text/18/1030).
- [Computer Misuse Act 1990](https://www.legislation.gov.uk/ukpga/1990/18/contents).
- [CyBOK Law and Regulation knowledge area](https://www.cybok.org/knowledgebase1_1/).
- [DGSSI](https://www.dgssi.gov.ma/), Morocco's cybersecurity authority.
