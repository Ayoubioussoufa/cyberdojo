---
title: Policy, privacy and your midpoint
summary: Policies people can follow, privacy law, vendors, continuity planning, and the Month 12 review that picks your provisional track.
month: 12
minutes: 70
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

A whole policy fits on one page:

```
Remote Access Policy                 Owner: Head of IT
Approved: 2026-03-01                 Next review: 2027-03-01

Purpose     Keep remote connections to company systems safe.
Scope       All staff and contractors, on any device.
Rules       1. Remote access to internal systems must go through the company VPN.
            2. Every remote sign-in must use MFA.
            3. Devices used for remote access must have disk encryption turned on.
Exceptions  Requested in writing from the owner, granted for 90 days at most, and logged.
```

Each rule says **must**, names who or what it applies to, and can be checked. Compare it with "staff should take care when working remotely, where possible". Nobody can follow that, and nobody can be shown to have broken it. Words like *should*, *where possible* and *as appropriate* are where policies go soft, and a program can find them.

@code policy-problems

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

The GDPR asks a controller to keep a **record of processing**. It's an inventory, like the one for assets, but of what you do with personal data:

| Activity | Data | Lawful basis | Kept for | Shared with |
|---|---|---|---|---|
| Delivering orders | Name, address, phone | Contract | 3 years after the last order | The courier |
| Newsletter | Email | Consent | Until consent is withdrawn | The mailing service |
| Payroll | Bank details, salary | Legal obligation | As long as the law requires | The payroll provider |

The GDPR lists six lawful bases: consent, contract, legal obligation, vital interests, public task and legitimate interests. Each activity needs one, chosen before you collect anything. The periods above are examples. The *kept for* column is the one most often left empty, and it's the easiest to check: anything older than its retention period should be gone.

@code retention-overdue

People also have rights over their data: to see it, to correct it, to have it erased and to take it elsewhere. A request must be answered within one month, so a company needs to know where each person's data lives before the first request arrives. That's one more use for the record above.

?? A Moroccan company sells online to customers in France. Does the GDPR matter to it?
+ Yes, it offers services to people there
- No, the GDPR only covers European companies
- No, because the servers are in Morocco
- Yes, but only with European staff members
=> The GDPR's reach follows the people whose data is handled. Morocco's own law 09-08 applies as well.

## Suppliers and awareness

**Third-party risk:** a supplier with access to your data is part of your attack surface. Ask for evidence such as ISO certificates or SOC 2 reports, limit what they can reach, put security duties in the contract, and know how to cut them off.

Before a supplier gets access, five questions cover most of the risk:

| Ask | A good answer |
|---|---|
| What data of ours will you hold, and where? | A list, and named countries |
| Who audited you, and when? | A current ISO 27001 certificate or SOC 2 Type II report |
| How fast will you tell us about a breach? | A number of hours, written into the contract |
| Who are your own suppliers? | A list of sub-processors |
| What happens to our data when we leave? | Returned or deleted, with written confirmation |

When the supplier handles personal data for you, the contract isn't optional: Article 28 of the GDPR requires one between a controller and its processor.

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

Write the targets and the reality side by side, with one row for each service:

| Service | RPO | Backups every | RTO | Last tested restore took |
|---|---|---|---|---|
| Orders database | 1 h | 24 h | 4 h | 6 h |
| File shares | 24 h | 24 h | 8 h | Never tested |
| Website | 24 h | 12 h | 2 h | 1 h |

Only the website meets both targets. The orders database misses both, and the file shares have a target that nobody has ever checked. A restore time that was never tested isn't a number.

@code continuity-gaps

The 3-2-1 rule can be checked the same way.

@code three-two-one

**Business continuity** keeps the business working, even on paper. **Disaster recovery** restores the IT behind it.

@drill rto-rpo

?? The business says it can lose at most one hour of orders. Backups run nightly. What's wrong?
+ The RPO is one hour, backups aren't
- The RTO is too long for servers
- Nightly backups always corrupt the order database
- Nothing, because backups exist and are recent
=> Worst case, you'd lose nearly a day of data against a limit of one hour. The schedule must match the target.

## Review a policy

A colleague asks you to look over this draft before it goes for approval.

```
Password Policy

1. Staff should choose strong passwords where possible.
2. Passwords must be at least 14 characters long on all company accounts.
3. To change your password, open Settings, choose Security, then click Change.
```

?? What's wrong with rule 1?
+ Nobody can check whether it was followed
- It is far too strict for staff
- It names a product that might change
- Policies can't mention passwords at all today
=> "Should", "strong" and "where possible" leave everything open. Rule 2 says the same thing in a way you can test.

?? Where does line 3 belong?
+ In a procedure, since it lists steps
- In a standard, since it sets numbers
- In the policy, since staff read it
- In a contract, since suppliers need it
=> Steps change every time the screen does. Kept in a procedure, they can be updated without anyone having to approve the policy again.

?? The draft has no owner and no review date. What happens to a policy like that?
+ It will go stale and be ignored
- It will be enforced by the regulator
- It will update itself from the standard
- It will apply only to new staff
=> A document that nobody answers for stops matching reality within a year or two, and staff learn that policies don't describe how things are done.

## The midpoint: don't skip this

::: key Week 4 is a full stop
Re-score the [skill matrix](/skills/), reread your write-ups, list what you can do unaided, and work through [choosing your track](/guides/c2-choosing-your-track/). Pick a lean, not a life sentence: 70% of effort stays on the common core through Month 18, and 30% goes to the lean.
:::

?! What can you do today without notes that you couldn't a year ago? What are you leaning towards, and what's your evidence?
