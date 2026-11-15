---
title: Identity and access management
summary: The identity lifecycle, MFA that resists phishing, RBAC and ABAC, and why identity is the most attacked layer.
month: 7
minutes: 55
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

Follow one person through it. Ana joins Finance in January and is added to the group `finance-read`. In June she moves to Marketing and is added to `marketing-edit`. Nobody removes `finance-read`, because adding access is a request somebody chases, and removing it is a request nobody makes. In December she leaves, and her account stays enabled because HR and IT use different systems. One ordinary career has now produced both problems: six months of access she didn't need, and an account with no owner.

The fix isn't cleverness, it's a routine. An **access review** compares what people have with what their current role allows, and removes the difference. You can do a small one on your own Linux VM right now:

```
id sam                        one account: its user ID and every group it belongs to
getent group sudo             one group: everyone who is in it
sudo -l -U sam                what sam may run as root
last sam | head -3            sam's most recent logins
```

```
$ id sam
uid=1001(sam) gid=1001(sam) groups=1001(sam),27(sudo),999(docker)
```

Read the groups as a list of powers. `sudo` means "can become root". `docker` means nearly the same, because a member can start a container that mounts the whole disk. An account in either group needs a reason that someone can state.

When an account should go, disable it first and delete it later, so that its files and its history stay available:

```
sudo usermod -L sam           lock the password
sudo chage -E 0 sam           expire the account, which also blocks SSH keys
```

A review is a comparison of two lists, which makes it a natural thing to automate. Write the core of one.

@code extra-access

@code stale-accounts

IAM analyst is a common entry-level job, especially in banks and telecoms. Much of it is exactly this.

?? Someone changes team and keeps the old access. What's that called?
+ Privilege creep, a mover problem
- Orphaned accounts, a leaver problem
- Credential stuffing, a login problem
- Token theft, a session problem
=> Rights pile up over time unless the mover step removes the old ones.

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

To see why a code can be phished, look at how it's made. When you scan the QR code in an authenticator app, the site and your phone store the same secret. Every 30 seconds, both do the same calculation: an HMAC of the secret and the current time step, cut down to six digits. Nothing is sent to your phone. The site simply checks that you can produce the number it also computed.

| Step | What happens |
|---|---|
| 1 | Count the 30-second steps since 1970: the current time in seconds, divided by 30 |
| 2 | Compute HMAC-SHA1 of the secret and that counter, written as 8 bytes |
| 3 | Take the last 4 bits of the result as a position, and read 4 bytes from there |
| 4 | Clear the top bit, then keep the last six decimal digits |

Step 3 is called dynamic truncation, and it's only a fixed way to pick 4 of the 20 bytes. This is the algorithm in [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226), and [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) adds the clock. Notice what's missing from the calculation: the name of the site. The code is valid for whoever presents it within those 30 seconds, including a fake site that passes it straight on.

@code hotp-code

A passkey closes that gap. At registration your device creates a key pair for that one site and sends the public key. At login the site sends a random challenge, and the device signs the challenge together with the address of the site it's really talking to. A fake site at another address gets a signature that the real site rejects. There's no secret to type, so there's nothing to hand over.

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

?? "Managers, on managed devices, in working hours" is an example of what?
+ ABAC, which uses attributes and context
- RBAC, which only ever uses roles
- MFA, which uses several login factors
- SSO, which uses one single login
=> It decides on attributes of the user, device and time, not just a role.

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

## Run an access review

Three findings from a review. Decide what each one means before you read the choices.

```
uid=1014(intern-leo) gid=1014(intern-leo) groups=1014(intern-leo),27(sudo),999(docker)
```

?? What stands out about that account?
+ An intern can become root two ways
- An intern has a high user ID
- An intern belongs to their own group
- An intern has a hyphenated account name
=> `sudo` grants root directly and `docker` grants it in practice. Neither fits an intern's role, so both need an owner's reason or removal.

?? An account whose owner left eight months ago is still enabled, and it logged in last week. What do you do?
+ Disable it, then investigate that login
- Delete it, then forget about it
- Leave it, since it still works
- Reset its password, then reuse it
=> An orphaned account that's still in use means someone has its credentials. Disable it so the access stops, and keep it so the evidence stays.

?? At 2 a.m. a user receives thirty approval prompts on their phone and finally taps "Approve". What happened?
+ MFA fatigue: an attacker had the password
- A sync error: the app repeated itself
- A passkey login: the device signed it
- An access review: the system checked them
=> Prompts only appear after a correct password. The attacker already had it and kept asking until the user gave in. Number matching, or a passkey, removes the easy tap.

?! A colleague moved from Finance to Marketing and still has Finance access. Name the problem, the risk, and the process that should have prevented it.
