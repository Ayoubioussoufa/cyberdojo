---
title: Kerberos and NTLM
summary: How Windows logins actually work, ticket by ticket, and the event IDs that record each step.
month: 7
minutes: 40
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

?? Which key encrypts a Kerberos service ticket?
+ The target service account's key
- The requesting user's own key
- The `krbtgt` service account's key
- The domain controller's machine key
=> Only the service needs to read it. And since the requester can obtain it, they can try to crack it offline: that's Kerberoasting.

## NTLM

**NTLM** is older. The server sends a challenge, and the client answers using its **NT hash**. No third party issues tickets. It survives for compatibility, and when you connect by IP address rather than name, Windows generally falls back to it.

The big weakness: the hash itself is enough. Steal it and you can authenticate without ever knowing the password. That's **pass-the-hash**.

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

?! Explain Kerberos using your own analogy, then say exactly where Kerberoasting attacks it.
