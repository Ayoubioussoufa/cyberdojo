---
title: Honeypots and deception
summary: Instead of hunting for intruders among millions of normal events, plant something that no honest person will touch. Honeypots, honeytokens, canaries and how to run them safely.
level: intermediate
side: defence
minutes: 40
attack: T1078, T1552
needs: 0023-ids-and-network-monitoring
pair: 08-02-threat-hunting
source: MITRE Engage | https://engage.mitre.org/
words: honeypot, honeytoken, canary token
---
Detection usually means searching for bad among huge amounts of good. Deception flips that. You place decoys with no legitimate use, so any touch at all is suspicious. There's almost no tuning, the false-positive rate is tiny, and an alert from one can be the earliest sign of an intruder inside your network.

@term honeypot = A decoy system built to attract and record attackers.
@term honeytoken = A fake credential, file or record whose only purpose is to raise an alert when used.
@term canary token = A small tracked item, such as a URL or document, that alerts you when it's opened or used.

## Concept

### Fundamentals: why deception works

Every alert has a cost, and the base rate makes most alerts false. A decoy changes the maths. A fake server that no one was told about has no normal traffic, so the first connection is already a strong signal. Attackers must also now doubt what they find: every credential might be a trap, which slows them down.

### Types

| Type | Example | Good for |
|---|---|---|
| Low-interaction honeypot | A fake SSH login prompt | Cheap, safe, broad coverage |
| High-interaction honeypot | A real, instrumented system | Learning full attacker behaviour |
| Honeytoken | A fake AWS key in a config file | Spotting theft and use |
| Honey account | A fake privileged AD user | Spotting enumeration and guessing |
| Canary document | A Word file that calls home | Spotting data access |
| Canary record | A fake customer in a database | Spotting a stolen dump |

### Where decoys pay off

Put them where an attacker looks, and where nobody else does. Good placements:

- A file called `passwords.xlsx` on a share.
- An AWS key in a developer's `.aws/credentials`, on a decoy role with no permissions.
- A fake service account with an SPN, so that any ticket request for it raises an alert.
- A server named `backup-admin` on the server VLAN.
- A unique email address in your customer database. If it gets mail, your data has leaked.

### Internet honeypots

Research honeypots face the Internet to study mass exploitation. Tools such as Cowrie (SSH and Telnet) and T-Pot (a collection) log what bots do within minutes of going online. This is a good way to see attacker tooling, and it shows how quickly an exposed service is found, as [Scanning in depth](/modules/01-07-scanning-in-depth/) explains.

### Advanced: operating deception seriously

**Realism matters.** Attackers fingerprint honeypots. A default Cowrie banner or a box with no history is easy to spot. Match real naming, keep realistic ages, and vary what you deploy.

**Keep them secret.** A decoy that's in your asset list, or that vulnerability scanners and admins keep touching, generates noise. Exclude your own tools from alerting, not from the network.

**Containment is everything.** A high-interaction honeypot is a real compromised machine. It must not be able to attack anyone else, so filter its outbound traffic strictly, and watch it. If yours is used to attack a third party, that's your problem.

**Legal and ethical points.** Entrapment is rarely the real issue, as a honeypot doesn't induce a crime. Privacy is the live one: you're recording data about people, which may fall under data protection law. Take advice before capturing anything beyond what you need. "Hacking back" is another matter: tracking an attacker's system with a beacon can cross into unauthorised access. See [Computer crime law](/modules/12-01-computer-crime-law/).

**MITRE Engage** frames this as adversary engagement, with goals such as expose, affect and elicit, and helps teams plan it deliberately.

?? Why is a honeytoken alert usually high signal?
+ No legitimate user should ever touch it
- It always identifies the attacker by name
- It blocks the intruder's connection by itself
- It scans every host on the network
=> It has no normal use, so the alert has almost no false-positive background to compete with.

## Threat model

Decoys target attacker habits, including [valid account](https://attack.mitre.org/techniques/T1078/) abuse, and [hunting for credentials in files](https://attack.mitre.org/techniques/T1552/). They work at the stages between foothold and impact, which is exactly where a lot of detection is weakest. A skilled attacker may detect and avoid decoys, so treat them as an extra layer, not the only one.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| [Canarytokens](https://canarytokens.org/) | Free tracked tokens | Starting today |
| OpenCanary | Lightweight multi-service honeypot | Internal decoys |
| Cowrie | SSH and Telnet honeypot | Studying bots |
| T-Pot | Suite of honeypots with dashboards | Research |
| PowerShell's AD module | Creates decoy accounts and objects | Domain detection |
| MITRE Engage | Planning framework | Designing a programme |

## Defence

Start small:

1. Add a canary token to a file share and a cloud key to a repo that's only internal.
2. Add one honey admin account in AD. Alert on any logon attempt or Kerberos ticket request.
3. Add a low-interaction honeypot on each server VLAN.
4. Route all alerts to a high-priority queue with a one-page playbook. Every alert should get a response.

Review them each quarter. Decoys go stale, and a dead alert path is worse than none. Send a test trigger.

## Pitfalls

- **Forgetting the alert path.** A perfect honeytoken that emails an unwatched inbox is useless.
- **Exposing a real system as a honeypot.** Isolate it first.
- **Leaving real data on a decoy.** It's a target by design.
- **Letting vulnerability scanners cry wolf.** Allow-list your own tools in the alert logic.
- **Deception as a substitute for hygiene.** It's a detection layer, not a fix.

?? What's the main risk of a high-interaction honeypot?
+ An attacker may use it against others
- It produces far too few useful logs
- It requires a licence from a regulator
- It needs a public DNS name always
=> It's a real system under an attacker's control, so without strict egress filtering it can become a launch point.

## Exercise

::: law Lab only
Run honeypots only on systems and networks you own, and never store other people's data longer than you need. Don't take any action against an attacker's systems.
:::

1. Create a free Canarytoken for a Word document, using an email address you control. Open it, and read the alert.
2. Install OpenCanary on a lab VM, with an SSH and SMB decoy. Scan it from another VM, and read the JSON log.
3. Put a canary AWS key in a test file, and try using it. Note how quickly the alert arrives.
4. In your lab domain, make a decoy account, and add an alert for any event 4624, 4625, 4768 or 4769 naming it.
5. Write a one-page playbook for "honeytoken fired".

?! Your budget is one week of one engineer's time. Which three decoys would you deploy, where, and what would each one tell you?

## Further reading

- [MITRE Engage](https://engage.mitre.org/).
- [Canarytokens](https://canarytokens.org/) and the [documentation](https://docs.canarytokens.org/).
- [Cowrie](https://github.com/cowrie/cowrie).
- [T-Pot](https://github.com/telekom-security/tpotce).
- Cliff Stoll, *The Cuckoo's Egg*, the 1989 classic that started all this.
