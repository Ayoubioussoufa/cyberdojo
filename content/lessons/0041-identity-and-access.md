---
title: Identity and access management
summary: The identity lifecycle, MFA that resists phishing, RBAC and ABAC, and why identity is the most attacked layer.
month: 7
minutes: 30
builds: reason about who should have access to what, and for how long
source: NIST SP 800-63, Digital Identity Guidelines | https://pages.nist.gov/800-63-4/
words: IAM, RBAC, passkey
---
Phase 2 begins. Attackers increasingly don't break in: they log in. Stolen credentials and tokens feature in a large share of breaches, as each year's [Verizon DBIR](https://www.verizon.com/business/resources/reports/dbir/) shows, which makes identity the single most attacked layer, on-premises and in the cloud.

@term IAM (identity and access management) = The policies and tools that control who can access what.
@term joiner-mover-leaver = The lifecycle of a person's access as they join, change role and leave.
@term RBAC (role-based access control) = Granting permissions through roles, rather than to individuals.
@term ABAC (attribute-based access control) = Deciding access from attributes such as department, device or time.
@term passkey (FIDO2) = A login based on public-key cryptography tied to a device, which resists phishing.
@term just-in-time access = Granting elevated rights only for a limited time when needed.
@term PAM (privileged access management) = Tools that control and record the use of powerful accounts.
@term MFA fatigue = Flooding someone with login prompts until they approve one.
@term SSO (single sign-on) = Logging in once to access many applications.

## The identity lifecycle

Most access problems come from how people change over time:

@flow Joiner: create access > Mover: change access > Leaver: remove access

**Joiner:** a new hire gets what the role needs. **Mover:** someone changes team and keeps the old access too, slowly collecting rights. That's privilege creep. **Leaver:** someone leaves, and their account lingers. Orphaned accounts are a favourite way in.

IAM analyst is a common entry-level job, especially in banks and telecoms. Much of it is exactly this.

## Authentication factors

| Factor | Example | Weakness |
|---|---|---|
| Something you **know** | Password | Phished, guessed, reused |
| Something you **have** | Phone, security key | Lost, or prompts get approved |
| Something you **are** | Fingerprint | Can't be changed if leaked |

MFA means two *different* factors. They aren't equal, though:

| Method | Phishing resistance |
|---|---|
| SMS code | Weak: SIM swapping, and it can be relayed |
| Authenticator app code | Medium: can be typed into a fake site |
| Push approval | Medium: **MFA fatigue** |
| **FIDO2 / passkey** | Strong |

Why are passkeys different? The device uses a key pair, and the login is [bound to the site's real domain](https://fidoalliance.org/passkeys/). A fake site at a different domain gets nothing useful, so there's no code for a victim to type in.

?? Why does a passkey resist phishing where a one-time code doesn't?
+ It's cryptographically bound to the real site
- It changes every thirty seconds without input
- It's much longer than a six-digit code
- It's stored on the company's central server
=> A code can be typed into a fake site and relayed. A passkey's response only works for the genuine domain.

## Authorization models

| Model | How it decides | Example |
|---|---|---|
| **RBAC** | By role | "Analysts can read logs" |
| **ABAC** | By attributes and context | "Managers, on managed devices, in working hours" |

RBAC is simple but roles multiply. ABAC is flexible but harder to reason about. Many systems mix both. Conditional Access in Microsoft Entra is ABAC in practice.

## Reducing standing privilege

**Least privilege** applies over time as well. Why should an admin be an admin at 3 a.m. while asleep?

- **Just-in-time access:** request elevation for an hour, with a reason.
- **PAM:** check powerful credentials out of a vault, and record the session.
- **Separate admin accounts:** daily email from one account, administration from another.

If an account has no standing privilege, stealing it gains little.

?? An admin account is stolen. Which control would have limited the damage most?
+ Just-in-time elevation with no standing rights held
- A longer password expiry period for everyone
- A login banner that warns against misuse
- Monthly security awareness training for all staff
=> With no standing rights, the stolen account can't do much on its own.

@term access review = A periodic check that people still need the access they have.

?! A colleague moved from Finance to Marketing and still has Finance access. Name the problem, the risk, and the process that should have prevented it.
