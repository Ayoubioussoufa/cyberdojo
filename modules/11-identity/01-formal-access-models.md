---
title: Formal access control models
summary: The classic models behind every permission system. Reference monitors, Bell-LaPadula, Biba, Clark-Wilson, Chinese Wall, capabilities, and the confused deputy problem.
level: foundation
side: defence
minutes: 40
attack: none
needs: 0041-identity-and-access, 0007-users-and-permissions
pair: 02-03-linux-confinement, 04-07-ssrf-in-depth
source: Saltzer and Schroeder, The Protection of Information in Computer Systems | https://web.mit.edu/Saltzer/www/publications/protection/
words: reference monitor, Bell-LaPadula, confused deputy
---
SELinux labels, cloud IAM and database roles look unrelated, yet they rest on ideas from the 1970s. Those models were built to answer one question precisely: given subjects, objects and rules, can information ever flow where it shouldn't? Lesson 41 taught RBAC and ABAC as tools. This module gives you the theory beneath them.

@term reference monitor = A component that checks every access, can't be bypassed, and is small enough to verify.
@term trusted computing base = Everything a system's security depends on being correct.
@term Bell-LaPadula model = A confidentiality model: subjects may not read data above their level, or write data below it.
@term Biba model = An integrity model: subjects may not read data below their level, or write data above it.
@term confused deputy = A privileged program tricked into using its authority on behalf of someone who lacks it.

## Concept

### Fundamentals: the access matrix

Think of a table with subjects as rows, objects as columns, and rights in each cell. Real systems store it one of two ways.

| Store by | Name | Example |
|---|---|---|
| Column, on the object | Access control list | File permissions |
| Row, on the subject | Capability | A token that grants a right |

A **reference monitor** should enforce this table. It has three requirements: it's always invoked, it's tamper-proof, and it's small enough to verify. The less your **trusted computing base** contains, the better. These ideas shaped kernel design, and they still guide policy engines.

Saltzer and Schroeder's [1975 design principles](https://web.mit.edu/Saltzer/www/publications/protection/) remain the best summary: economy of mechanism, fail-safe defaults, complete mediation, open design, separation of privilege, least privilege, least common mechanism, and psychological acceptability.

### Confidentiality: Bell-LaPadula

Designed for military secrets in 1973, it gives subjects and objects clearance levels.

| Rule | Meaning | Why |
|---|---|---|
| No read up | Can't read higher than your level | Protects secrets |
| No write down | Can't write lower than your level | Stops leaks, even by a trojan |

The second rule is the insight. A trojan running as a top-secret user could copy secrets into a low file. So write-down must be blocked as well. The model enforces **mandatory** control, where owners can't override policy.

### Integrity: Biba

Biba flips it: no read down, no write up. A trusted process shouldn't read untrusted input, and a low-integrity process shouldn't alter high-integrity data. Windows integrity levels, in lesson 31, follow this idea with "no write up".

### Business: Clark-Wilson and Chinese Wall

Commerce cares more for integrity than secrecy. **Clark-Wilson** says data may only change through well-formed transactions, with **separation of duties**, so that no single person can create and approve a payment. **Chinese Wall** (Brewer and Nash) handles conflicts of interest: a consultant who's seen one bank's data can't then access a competitor's.

### Advanced: from theory to practice

**Limits.** Bell-LaPadula and Biba can't both apply simply, and strict rules are often impractical, so real systems add *trusted subjects* that break them. **Covert channels** can also leak across any policy, using timing or storage effects.

**The confused deputy.** Norm Hardy [described it](http://www.cap-lore.com/CapTheory/ConfusedDeputy.html) in 1988: a compiler with permission to write a billing file was asked by a user to write its debug output there. The compiler had the right. The user didn't. ACLs ask *who is the caller*, and the program's own identity was enough, so its authority was misused.

Today it's everywhere. [SSRF](/modules/04-07-ssrf-in-depth/) uses a server's network position, CSRF uses a browser's cookies, and AWS added `ExternalId` for cross-account roles because of this very problem. **Capabilities** help: if authority travels with the request, as an unforgeable token, then a program can't mix up whose authority it's using.

**Modern models.** RBAC, ABAC and **ReBAC** (relationship-based, as in Google's [Zanzibar](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/)) are engineering answers to the same matrix.

?? What does Bell-LaPadula's "no read up" protect?
+ Confidentiality of higher classified information
- Integrity of lower classified information
- Availability of the file server
- Accountability of every system administrator
=> A subject can't read above its clearance, so secrets stay with those cleared to see them.

## Threat model

These models address insiders, trojans and over-privileged programs: anyone already on the system. Attacks on access control usually target the gaps between model and implementation, such as a bypass of complete mediation, a missing check on one code path, or a confused deputy. In web terms, that's [broken access control](/courses/0048-access-control-that-holds/), the top OWASP risk.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| SELinux | Enforces type and level labels | Mandatory control on Linux |
| Open Policy Agent, Cedar | Policy as code | Application authorisation |
| OpenFGA, SpiceDB | ReBAC, Zanzibar-style | Sharing models |
| AWS Zelkova-based analysers | Reason about IAM policy | Checking cloud access |
| Alloy | Models access rules | Finding flaws in designs |

## Defence

- **Centralise checks.** One library, called everywhere, approximates a reference monitor.
- **Deny by default.**
- **Separate duties** for payments, code deploys and admin grants.
- **Keep the trusted base small.**
- **Avoid ambient authority.** Pass explicit, scoped tokens, rather than relying on who a service is.
- **Audit the matrix.** Who can really do what? Tools for cloud IAM answer that.

## Pitfalls

- **Thinking mandatory means no exceptions.** Trusted subjects exist, and they're the weak point.
- **Confusing Biba and Bell-LaPadula.** One protects integrity, the other confidentiality.
- **Assuming RBAC solves everything.** Roles explode, and they can't express "only your own records".
- **Check at the UI only.** Mediation must happen on the server.
- **Ignoring covert channels** in high-assurance designs.

?? What is a confused deputy?
+ A privileged program tricked into misusing authority
- A user who forgot their account password
- A server running two versions of software
- A firewall holding rules that contradict themselves
=> The program has rights the caller lacks, so it can be manipulated into using them on the caller's behalf.

## Exercise

::: law Lab only
Use your own VM and a small test application.
:::

1. Draw the access matrix for a small system: three users, three files. Write it as ACLs, then as capabilities.
2. Write down the two Bell-LaPadula rules, and test them on paper with a trojan example.
3. In your lab, use a Linux `setuid` helper that writes to a path given by a user. Show how it could act as a confused deputy, then fix it by opening files with the user's rights.
4. Model a "two-person payment" rule in Open Policy Agent, and test it.
5. Find one example of a confused deputy in a past bug report.

?! Explain why SSRF and CSRF are both confused deputy problems. Then name a design that would remove the problem, rather than patch it.

## Further reading

- [Saltzer and Schroeder](https://web.mit.edu/Saltzer/www/publications/protection/).
- Norm Hardy, [The Confused Deputy](http://www.cap-lore.com/CapTheory/ConfusedDeputy.html).
- [Zanzibar: Google's Consistent, Global Authorization System](https://research.google/pubs/zanzibar-googles-consistent-global-authorization-system/).
- [CyBOK Authentication, Authorisation and Accountability](https://www.cybok.org/knowledgebase1_1/).
- Ross Anderson, [Security Engineering](https://www.cl.cam.ac.uk/archive/rja14/book.html), free online.
