---
title: Policy, privacy and your midpoint
summary: Policies people can follow, privacy law, vendors, continuity planning, and the Month 12 review that picks your provisional track.
month: 12
minutes: 45
builds: three usable policies, and your midpoint review
source: CNIL, GDPR guidance (in French) | https://www.cnil.fr/fr/reglement-europeen-protection-donnees
words: policy, business continuity, data controller
---
A policy nobody reads protects nothing. And after 12 months, it's time to stop and take stock honestly.

@term policy = A short statement of what an organisation requires.
@term standard = A specific rule that supports a policy.
@term procedure = Step-by-step instructions for doing something.
@term business continuity = Keeping critical operations running during a disruption.
@term disaster recovery = Restoring IT systems after a major failure.
@term data controller = The organisation that decides why and how personal data is used.
@term data processor = An organisation that handles personal data on a controller's behalf.
@term personal data = Any information relating to an identifiable person.
@term third-party risk = Risk that comes from your suppliers and partners.
@term CNDP = Morocco's data protection authority.

## Policy, standard, procedure

| Level | Answers | Example |
|---|---|---|
| Policy | What and why | "Admin accounts require MFA" |
| Standard | Exactly which | "FIDO2 keys for all admins" |
| Procedure | How | "Steps to enrol a key" |

Keeping these apart means that when technology changes, you update a procedure rather than reissuing a policy. Good policies are short, have an owner and a review date, and define how to get an exception.

?? Where does "Laptops must use BitLocker with a 14-digit PIN" belong?
+ In a standard, because it's a specific rule
- In a policy, because it's the top level
- In a procedure, because it lists numbered steps
- In the risk register, as a separate entry
=> It names an exact requirement. The policy says that laptops must be encrypted, and the procedure shows how to set it up.

## Privacy and local law

Security protects data from attackers. Privacy asks whether you should have that data, and what you may do with it. **Personal data** is anything relating to an identifiable person, including names, emails and often IP addresses.

- **GDPR:** the EU's personal-data law, which reaches beyond Europe if you offer services to, or monitor, people in the EU. A **data controller** decides why and how data is used, and a **data processor** handles it on the controller's behalf. Key principles include having a lawful basis, collecting only what you need, and keeping it only as long as needed.
- **Morocco:** law 09-08 on personal data, overseen by the [CNDP](https://www.cndp.ma/), and cybersecurity law 05-20 with the DNSSI baseline from the [DGSSI](https://www.dgssi.gov.ma/).
- **EU sector rules:** NIS2 and DORA, if your employer serves Europe.
- **AI governance:** NIST AI RMF, ISO/IEC 42001 and the EU AI Act.

These change, so check the official source, and ask a lawyer for real decisions.

?? A Moroccan company sells online to customers in France. Does the GDPR matter to it?
+ Yes, it offers services to people there
- No, the GDPR only covers European companies
- No, because the servers are in Morocco
- Yes, but only with European staff members
=> The GDPR's reach follows the people whose data is handled. Morocco's own law 09-08 applies as well.

## Suppliers and awareness

**Third-party risk:** a supplier with access to your data is part of your attack surface. Ask for evidence such as ISO certificates or SOC 2 reports, limit what they can reach, put security duties in the contract, and know how to cut them off.

**Awareness:** a yearly slideshow changes little. Short, relevant training and a simple way to report work better, and you should thank reporters rather than punish clickers.

**Metrics:** report what drives decisions. "Critical patches applied within SLA" is useful. "Number of blocked attacks" sounds impressive, but it tells nobody what to do next.

?? Which metric would help a board make a decision?
+ Critical systems patched within the agreed time
- Total number of firewall packets blocked yearly
- Number of pages in the security policy
- Count of security tools the company owns
=> A good metric shows performance against a target, and a miss tells someone what to act on.

## Continuity

Two numbers drive recovery planning: **RTO**, how quickly it must be back, and **RPO**, how much data you can afford to lose.

@term RTO (recovery time objective) = The target time to restore a service after a disruption.
@term RPO (recovery point objective) = The maximum acceptable data loss, measured in time.

If you back up every night and the database dies at 23:00, you lose almost a whole day. So a nightly backup only suits an RPO of 24 hours or more. A common rule for backups is **3-2-1**: three copies, on two kinds of media, with one off-site. Keep one offline too, because ransomware goes after backups first.

**Business continuity** keeps the business working, even on paper. **Disaster recovery** restores the IT behind it.

@drill rto-rpo

?? The business says it can lose at most one hour of orders. Backups run nightly. What's wrong?
+ The RPO is one hour, backups aren't
- The RTO is too long for servers
- Nightly backups always corrupt the order database
- Nothing, because backups exist and are recent
=> Worst case, you'd lose nearly a day of data against a limit of one hour. The schedule must match the target.

## The midpoint: don't skip this

::: key Week 4 is a full stop
Re-score the [skill matrix](/skills/), reread your write-ups, list what you can do unaided, and work through [choosing your track](/guides/c2-choosing-your-track/). Pick a lean, not a life sentence: 70% of effort stays on the common core through Month 18, and 30% goes to the lean.
:::

?! What can you do today without notes that you couldn't a year ago? What are you leaning towards, and what's your evidence?
