---
title: Identity attacks and Entra ID
summary: BloodHound attack paths, cloud identity with Entra ID, Conditional Access, and reviewing your lab's identity attack surface.
month: 7
minutes: 45
builds: three BloodHound paths explained, and an Entra tenant with MFA enforced, finishing P04
source: BloodHound Community Edition documentation | https://bloodhound.specterops.io/
words: attack path, Entra ID, Conditional Access
---
Attackers think in graphs. A normal user might not be an admin, but they might be in a group that can reset a password on an account that's an admin on a server where a Domain Admin is logged in. Each step is a small permission. Together, they're a path to the domain.

@term attack path = A chain of permissions and relationships leading from a low-privilege account to a valuable target.
@term BloodHound = A tool that maps Active Directory relationships as a graph to reveal attack paths.
@term ACL abuse = Using permissions set on an AD object, such as password reset rights, to take it over.
@term Entra ID = Microsoft's cloud identity service, formerly called Azure AD.
@term tenant = One organisation's separate instance of a cloud service such as Entra ID.
@term service principal = The identity an application uses in Entra ID.
@term Conditional Access = Entra policies that decide access based on who, where, what device and what risk.

## BloodHound: seeing the graph

[BloodHound CE](https://bloodhound.specterops.io/) collects users, groups, sessions and permissions, then shows paths. **SharpHound** is its collector.

::: law
SharpHound queries your domain heavily, and it's a known tool that will trip monitoring. Run it only in your own lab.
:::

Reading a path is reading permissions:

```
ana ──MemberOf──▶ HelpDesk ──ForceChangePassword──▶ svc_sql
    ──AdminTo──▶ SRV1 ──HasSession──▶ dadmin ──MemberOf──▶ Domain Admins
```

In plain words: Ana is in HelpDesk, which can reset `svc_sql`'s password. That account is admin on SRV1, where a Domain Admin is logged in, so their credentials can be taken from memory.

| Edge | Meaning |
|---|---|
| `GenericAll` | Full control of the object |
| `ForceChangePassword` | Can reset the password |
| `WriteDacl` | Can change the object's permissions |
| `AddMember` | Can add people to the group |
| `HasSession` | That user is logged in on that machine |

The defender's use is the same: fix the edges. Remove a permission or a session, and the path falls.

@term PingCastle = A free tool that gives a score of an Active Directory's security posture.

?? BloodHound shows `HelpDesk → GenericAll → Domain Admins`. What's the best fix?
+ Remove that permission from the HelpDesk group entirely
- Rename the Domain Admins group to something else
- Tell the HelpDesk team not to use it
- Hide the group from the BloodHound collector tool
=> The path exists because of the permission. Remove the edge, then rerun the tool to prove the path has gone.

## Cloud identity: Entra ID

**Entra ID**, which used to be called Azure AD, isn't AD in the cloud. It's a different system built for the web: OAuth and OIDC rather than Kerberos and LDAP, with flat users and groups rather than OUs.

| Concept | Meaning |
|---|---|
| **Tenant** | Your organisation's instance |
| **App registration** | Defines an application |
| **Service principal** | That app's identity in a tenant |
| **Conditional Access** | if-then rules: if this user, from this risk, on this device, then require MFA or block |
| **Sign-in logs** | Every login, with result, location, device |
| **Audit logs** | Changes: roles, users, apps |

[Conditional Access](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview) is ABAC in action: "require compliant device and phishing-resistant MFA for admins".

Many companies run **hybrid**: on-premises AD synced to Entra. So a compromise can cross from one to the other.

::: try Your tenant
Create a free [Microsoft Entra](https://www.microsoft.com/en-us/security/business/identity-access/microsoft-entra-id) tenant. Add users and groups, enforce MFA, sign in, and read the sign-in logs. See what a failed login looks like, and what a successful one records.
:::

## Identity attacks at a glance

| Attack | Stops it |
|---|---|
| Password spraying | Banned common passwords, smart lockout, MFA |
| Credential stuffing | MFA, breached-password checks |
| MFA fatigue | Number matching, phishing-resistant MFA |
| Token theft | Short lifetimes, device binding, Conditional Access |
| Consent phishing | Restricting user consent to apps |
| Kerberoasting | Long random passwords, managed service accounts, AES |
| Pass-the-hash | Tiering, Credential Guard, limiting local admin |
| ACL abuse | Audit with BloodHound, least privilege |

?? An attacker sprays "Winter2026!" across 500 accounts, one try each. Why doesn't normal lockout stop this?
+ Each account sees only one failed attempt
- Lockout applies only to domain administrator accounts
- Spraying never touches the authentication service itself
- Passwords with symbols are excluded from lockout
=> It stays under the threshold per account. You need detection across accounts, like many 4625s from one source.

## Finish P04

The gate: a domain with 20+ users, 5 groups, 3 GPOs and a Kerberoastable service account, rebuilt from your own script. A Kerberos diagram with event IDs. Three BloodHound paths explained in writing. The authorization-code flow with PKCE, without notes. An Entra tenant with MFA enforced. See [Month 7](/roadmap/7/).

::: ai Roadmap exercise
Ask an LLM to explain Kerberoasting step by step. Reproduce it in your lab, and verify the detection it claimed (event 4769 with type 0x17). Anything it got wrong goes in the AI log.
:::

?! Write your lab's "identity attack surface" review in five bullet points.
