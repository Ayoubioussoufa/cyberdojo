---
title: Kerberos and NTLM
summary: How Windows logins actually work, ticket by ticket, and the event IDs that record each step.
month: 7
minutes: 60
builds: a hand-drawn Kerberos diagram annotated with event IDs
source: adsecurity.org, Sean Metcalf's AD security reference | https://adsecurity.org/
words: Kerberos, TGT, NTLM
---
"How does Kerberos work?" is a standard interview question and the base of half of all Active Directory attacks. It sounds intimidating, but it's a sequence of three exchanges, like getting into a theme park.

@term Kerberos = The default ticket-based authentication protocol in Active Directory.
@term KDC (key distribution center) = The service on a domain controller that issues Kerberos tickets.
@term TGT (ticket-granting ticket) = The ticket proving you've logged in, used to request other tickets.
@term service ticket (TGS) = A ticket that gives access to one specific service.
@term krbtgt = The hidden AD account whose key encrypts all TGTs.
@term NTLM = An older Windows challenge-response authentication protocol.
@term NT hash = The hash of a Windows password, used directly by NTLM.
@term pre-authentication = A Kerberos step proving that the client knows the password before a TGT is issued.
@term Kerberoasting = Requesting a service ticket and cracking it offline to get a service account's password.
@term AS-REP roasting = Cracking data from accounts that don't require Kerberos pre-authentication.
@term pass-the-hash = Authenticating with a stolen NT hash, without knowing the password.

## The theme park

1. At the gate, you show ID and get a **wristband**: that's the TGT.
2. At each ride, you show the wristband to a clerk and get a **ride ticket**: that's the service ticket.
3. You hand the ticket to the ride operator, who lets you on, without ever seeing your ID.

Your password is only used at step 1. After that, tickets do the work.

Your wristband and your ride tickets are real objects that you can list. On a domain-joined Windows machine, after opening a shared folder on the DC, run `klist`:

```
> klist
Cached Tickets: (2)

#0>  Client: ana @ CORP.LAB
     Server: krbtgt/CORP.LAB @ CORP.LAB
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
     Start Time: 11/15/2026 9:02:11 (local)
     End Time:   11/15/2026 19:02:11 (local)

#1>  Client: ana @ CORP.LAB
     Server: cifs/dc1.corp.lab @ CORP.LAB
     KerbTicket Encryption Type: AES-256-CTS-HMAC-SHA1-96
```

| Line | Meaning |
|---|---|
| `Server: krbtgt/CORP.LAB` | This one is the TGT. Its "service" is the ticket service itself |
| `Server: cifs/dc1.corp.lab` | A service ticket for file sharing on `dc1`. The text is an SPN |
| `Encryption Type` | How the ticket is protected. AES-256 is what you want to see |
| `Start Time`, `End Time` | Ten hours by default. After that the wristband is renewed or you log in again |

`klist purge` throws the tickets away, and the next thing you open quietly requests new ones. Tickets also depend on the clock. Each one carries timestamps, and a machine whose time is more than five minutes away from the domain controller's has its requests refused, so "Kerberos is broken" is very often "the clock is wrong".

?? When is your password used in Kerberos?
+ Only at the start, for the TGT
- At every service, for each new ticket
- Never, as Kerberos has no passwords here
- Each hour, to refresh the whole ticket
=> After the first exchange, tickets do the work.

## The three exchanges

| Step | Message | What happens | Event on the DC |
|---|---|---|---|
| 1 | **AS-REQ / AS-REP** | Client proves it knows the password, by encrypting a timestamp. The KDC returns a **TGT**, encrypted with the `krbtgt` key | **4768** (TGT requested), **4771** (pre-auth failed) |
| 2 | **TGS-REQ / TGS-REP** | Client presents the TGT and names a service by its SPN. The KDC returns a **service ticket**, encrypted with **the service account's key** | **4769** (service ticket requested) |
| 3 | **AP-REQ** | Client presents the ticket to the service | Logon on the server: **4624** |

@seq Client | KDC | Service
Client > KDC: AS-REQ: I know my password
KDC > Client: AS-REP: here's a TGT
Client > KDC: TGS-REQ: TGT, and I want this service
KDC > Client: TGS-REP: here's a service ticket
Client > Service: AP-REQ: here's my ticket

Two details matter for what comes next:

- **Anyone with a valid TGT can request a ticket for any service.** The KDC doesn't check whether you're allowed to use it: the service does that later.
- A service ticket is encrypted with **the service account's password-derived key**.

Each exchange leaves an event with fields you can read. This is a 4769, trimmed:

```
Event 4769: A Kerberos service ticket was requested.
    Account Name:            ana@CORP.LAB
    Service Name:            svc_sql
    Client Address:          ::ffff:192.168.56.20
    Ticket Encryption Type:  0x12
    Failure Code:            0x0
```

Who asked, for which service account, from which machine, how the ticket was encrypted, and whether it worked. The encryption type is the field to learn:

| Value | Algorithm |
|---|---|
| `0x11` | AES-128 |
| `0x12` | AES-256 |
| `0x17` | RC4-HMAC, old and weak |

?? Which key encrypts a Kerberos service ticket?
+ The target service account's key
- The requesting user's own key
- The `krbtgt` service account's key
- The domain controller's machine key
=> Only the service needs to read it. And since the requester can obtain it, they can try to crack it offline: that's Kerberoasting.

## NTLM

**NTLM** is older. The server sends a challenge, and the client answers using its **NT hash**. No third party issues tickets. It survives for compatibility, and when you connect by IP address rather than name, Windows generally falls back to it.

The big weakness: the hash itself is enough. Steal it and you can authenticate without ever knowing the password. That's **pass-the-hash**.

You can watch Windows choose between the two. From a domain workstation, list a share on the DC twice, once by name and once by address, then read the two 4624 events on the DC:

```
dir \\dc1.corp.lab\SYSVOL          by name: Kerberos can find the service's SPN
dir \\192.168.56.10\SYSVOL         by address: no SPN to look up, so NTLM
```

In each event the field `Authentication Package` says `Kerberos` or `NTLM`. On a healthy network, NTLM between domain machines should be rare, which is what makes it worth a second look when it appears.

?? Why is pass-the-hash possible with NTLM?
+ The hash alone is enough to log in
- The hash can be reversed into the password
- NTLM sends the password across in plain text
- NTLM has no form of authentication at all
=> The client answers the challenge using the hash, so whoever holds it can answer too.

## The attacks, in concept

| Attack | Idea | Detection clue |
|---|---|---|
| **Password spraying** | One common password, many accounts | Many 4625 or 4771 across accounts |
| **Kerberoasting** | Ask for service tickets, crack them offline | 4769 with RC4 encryption (type 0x17), many services, one user |
| **AS-REP roasting** | Accounts without pre-auth give out crackable data | 4768 with pre-auth type 0 |
| **Pass-the-hash** | Use an NT hash directly | NTLM logons (4624, type 3) where you'd expect Kerberos |
| **Golden ticket** | Stolen `krbtgt` key forges any TGT | Hard: tickets that never passed through the KDC |

Every row of that table has a defence that removes the weakness, and a defender is expected to know both columns:

| Attack | What stops it |
|---|---|
| Password spraying | Long passwords checked against breached lists, MFA, lockout tuned to slow guessing |
| Kerberoasting | Group managed service accounts, or 25+ character random passwords, and AES-only encryption |
| AS-REP roasting | Leave pre-authentication switched on for every account, and audit for the exceptions |
| Pass-the-hash | The tier model, no shared local administrator passwords, restricting NTLM |
| Golden ticket | Protecting DCs above all else, and changing the `krbtgt` password twice after a compromise |

Detection is counting. The clue for Kerberoasting is one account asking for many different services in a short time, and you can write that rule yourself.

@code kerberoast-suspects

Spraying turns the usual brute-force picture sideways: instead of many passwords against one account, it's one password against many accounts, so no single account fails often enough to lock. Counting distinct accounts per source finds it.

@code spray-suspects

Why RC4? Encryption type [`0x17` means RC4-HMAC](https://learn.microsoft.com/en-us/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4769), which is much faster to crack than AES. Microsoft has been moving Kerberos away from RC4, so check what's current on your Windows version.

@term golden ticket = A forged TGT made with the stolen krbtgt key, which grants access to anything in the domain.

?? Why is Kerberoasting hard to prevent with account lockout?
+ Cracking happens offline, away from the domain
- Service accounts are excluded from every policy
- Kerberos tickets can't be logged at all
- Lockout only applies to the Administrator account
=> After getting the ticket, the attacker never talks to the domain again, so there are no failed logins to lock out. Long random passwords, or managed service accounts, are the real fix.

::: try In your lab
Enable auditing, then log in and open a file share on the DC. Find 4768, 4769 and 4624 in the Security log, and match them to the steps above. Then draw the full diagram by hand, with event IDs. That's your exit gate.
:::

@drill event-ids

## Read the domain controller's log

Three things from a morning's Security log. Decide what each one means before you read the choices.

?? In one minute, the account `tom` produces forty 4769 events, each for a different service account, all with encryption type `0x17`. What does that look like?
+ Kerberoasting: tickets collected to be cracked later
- A normal login: one ticket per service
- A clock problem: requests keep being refused
- A golden ticket: forged on the DC
=> A person uses a handful of services. Asking for every service account at once, with the weakest encryption, is collecting material to guess passwords from.

?? A workstation's users suddenly can't open any network share, and its clock is twelve minutes fast. Why would that break logins?
+ Kerberos rejects times over five minutes off
- NTLM refuses any clock that is fast
- DNS refuses names when clocks are wrong
- Group Policy refuses to apply after noon
=> Tickets and requests carry timestamps so that they can't be replayed later. Outside the allowed five minutes, the DC rejects them.

?? A 4624 on a file server shows a network logon from another domain machine with `Authentication Package: NTLM`. What's the sensible reading?
+ Worth checking, as Kerberos was expected there
- Proof that the password was already cracked
- Normal, as NTLM is the usual default
- An error, as NTLM no longer exists
=> It may be a connection made by IP address, which is harmless. It's also what pass-the-hash looks like, so you check the source and what it did next.

?! Explain Kerberos using your own analogy, then say exactly where Kerberoasting attacks it.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [RFC 4120: The Kerberos Network Authentication Service (V5)](https://www.rfc-editor.org/rfc/rfc4120)
- [Microsoft Learn: Kerberos authentication overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/kerberos-authentication-overview)
- [Microsoft Learn: NTLM overview](https://learn.microsoft.com/en-us/windows-server/security/kerberos/ntlm-overview)
