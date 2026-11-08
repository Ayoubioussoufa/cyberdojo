---
title: LAN and legacy protocols
summary: SMB, RDP, SNMP, NFS, FTP, Telnet, NTP and name-resolution fallbacks. The services that fill real internal networks, how they get abused, and how to harden them.
level: intermediate
side: both
minutes: 55
attack: T1021.001, T1021.002, T1557.001, T1135, T1602
needs: 0018-tcp-udp-and-ports, 0043-active-directory, 01-04-layer-2-attacks
pair: 0045-attacking-and-defending-identity
source: CISA, Stop Ransomware guide | https://www.cisa.gov/stopransomware/ransomware-guide
words: SMB signing, LLMNR, community string
---
A real internal network isn't all HTTPS. It's file shares, management protocols, printers and things installed in 2009. Attackers love these because they were designed for a trusted LAN and they're usually spread widely. This module tours the ones you'll meet most often.

@term SMB signing = Attaching a keyed signature to each SMB message, so that a relayed or altered session fails.
@term LLMNR = A Windows name lookup used when DNS has no answer, sent to everyone on the local network.
@term community string = The shared password of SNMP versions 1 and 2c, sent in clear text.
@term root squash = An NFS setting that maps a remote root user to an unprivileged one.

## Concept

### Fundamentals: why old protocols persist

Each protocol here answered a real need before encryption was cheap. The common shape is a cleartext or weakly authenticated service that assumes the network is friendly. Removing one can break a business process that nobody remembers, so they linger, and they stay valuable to anyone who gets inside.

| Port | Protocol | Weak spot |
|---|---|---|
| 21 | FTP | Passwords and data in clear text |
| 23 | Telnet | Everything in clear text |
| 111, 2049 | NFS | Trusts client-supplied identities in older modes |
| 123 | NTP | Reflection, and time affects logs and Kerberos |
| 137, 5355 | NBT-NS, LLMNR | Anyone may answer a broadcast |
| 161 | SNMP | Community strings, and full device configuration |
| 445 | SMB | Lateral movement, relay, old versions |
| 3389 | RDP | Exposed brute force, session hijack |

### SMB

SMB shares files and printers, and carries much Windows management traffic. **SMBv1** is dangerous and obsolete: EternalBlue (MS17-010) exploited it, and WannaCry and NotPetya spread that way in 2017. Modern SMB3 supports encryption. **SMB signing** prevents tampering and defeats relay attacks.

Admin shares such as `C$` and `ADMIN$` allow file access and remote service creation, so a single reused local admin password can spread across a whole fleet. That's why LAPS exists.

### Name resolution fallbacks

When DNS fails to find a name, Windows may ask the local network with **LLMNR** or **NBT-NS**. That's a broadcast, and anyone can answer. So a mistyped share name lets an attacker reply "that's me", and the victim's machine tries to authenticate, sending a challenge-response derived from the user's password. An attacker can crack that offline or relay it live. Tools such as Responder automate it. mDNS has a similar risk.

### RDP

RDP gives a full desktop. On the Internet, it's a leading ransomware entry point: a steady stream of password guessing, plus critical flaws such as BlueKeep (CVE-2019-0708). **Network Level Authentication** forces login before a session is created, which cuts the exposed attack surface.

### SNMP

SNMP reads and sometimes writes device configuration. Versions 1 and 2c use a **community string**, and defaults such as `public` remain common. Read access can reveal routes, interfaces, ARP tables and running software. Write access can change configuration. SNMPv3 adds real authentication and encryption.

### NFS

Older NFS trusts the UID that the client reports. So anyone who controls a client can claim to be any user. **Root squash** stops a remote root acting as root on the share, though other UIDs are still believed. NFSv4 with Kerberos (`sec=krb5p`) ends the trust in client-supplied identity.

### Advanced: time as a security dependency

NTP is easy to overlook. Kerberos rejects clocks that are too far apart, certificates depend on dates, and log correlation depends on agreement. Moving a machine's clock can extend the use of expired certificates. [Malhotra and others](https://www.cs.bu.edu/~goldbe/papers/NTPattack.pdf) showed practical attacks on NTP in 2016. The `monlist` command also made NTP a large amplifier for DDoS. Network Time Security ([RFC 8915](https://www.rfc-editor.org/rfc/rfc8915)) adds cryptographic authentication.

?? A user mistypes `\\fileshrae\docs`. How can that leak a credential?
+ The fallback broadcast lets an attacker answer as that name
- The mistyped path is stored in clear text on DNS
- SMB sends the user's real password inside the file path
- Windows emails each failed lookup to the domain controller admin
=> DNS can't find the name, so LLMNR or NBT-NS asks the whole segment. A rogue responder claims it, and Windows tries to authenticate to it.

## Threat model

| Stage | Technique | ATT&CK |
|---|---|---|
| Initial access | Exposed RDP | [T1133](https://attack.mitre.org/techniques/T1133/) |
| Credential access | LLMNR and NBT-NS poisoning | [T1557.001](https://attack.mitre.org/techniques/T1557/001/) |
| Discovery | Share enumeration | [T1135](https://attack.mitre.org/techniques/T1135/) |
| Lateral movement | SMB and admin shares | [T1021.002](https://attack.mitre.org/techniques/T1021/002/) |
| Lateral movement | RDP | [T1021.001](https://attack.mitre.org/techniques/T1021/001/) |
| Collection | Network device configuration via SNMP | [T1602](https://attack.mitre.org/techniques/T1602/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `smbclient`, `enum4linux-ng` | Browse and enumerate SMB | Auditing your shares |
| `showmount -e` | Lists NFS exports | Checking what's exported |
| `snmpwalk` | Reads SNMP data | Testing your devices |
| Nmap `smb2-security-mode` script | Reports whether signing is required | Auditing signing at scale |
| Responder | Answers name queries | Authorised tests, with analyse mode first |
| PingCastle | Reviews AD configuration | Finding these settings across a domain |

## Defence

| Protocol | Harden with |
|---|---|
| SMB | Disable SMBv1. Require signing. Block 445 between workstations, and at the Internet edge |
| LLMNR, NBT-NS | Turn them off by Group Policy, and fix the DNS that made them necessary |
| mDNS | Disable or restrict on managed hosts |
| RDP | Never expose directly. Use a gateway with MFA, NLA on, and restrict who may log in |
| SNMP | Use v3 with auth and privacy. Restrict by ACL, and remove default strings |
| NFS | Use `root_squash`, restrict exports, and prefer `sec=krb5p` |
| FTP, Telnet | Replace them with SFTP and SSH |
| NTP | Use several authenticated sources, and disable `monlist` |

**Detection.** Windows records logon type 3 for SMB and type 10 for RDP. Event 5140 and 5145 record share access, and 4624 records logons. Look for one account logging on to many hosts in a short time, and for one host talking to port 445 on many others. Sysmon event 3 adds which process made the connection.

## Pitfalls

- **"It's internal, so it's safe."** Most ransomware spreads over exactly these internal paths.
- **"We disabled SMBv1, so we're done."** Relay and credential reuse work over SMB2 and 3 unless signing is enforced.
- **"RDP on another port is hidden."** Scanners find it within hours.
- **"SNMP is read-only, so it's harmless."** Device configs can reveal password hashes and network maps.
- **Disabling without inventory.** Some printers and old scanners need SMBv1 or FTP. Measure first, then remove, then fix what depends on it.

?? Which control best stops a relayed SMB authentication?
+ Requiring SMB signing on every client and server
- Moving SMB from port 445 to another port
- Hiding every share with a trailing dollar sign
- Changing all passwords on a shorter monthly schedule
=> A relay passes authentication along but can't compute valid signatures without the session key, so a signed session fails.

## Exercise

::: law Lab only
Do this in your own lab with a Windows domain or VMs you built. Don't enumerate shares or query SNMP on networks you don't own.
:::

1. Set up an SMB share on a lab VM. Check its signing status with `nmap --script smb2-security-mode -p445 <lab-ip>`. Enforce signing and scan again.
2. Install `snmpd` on a Linux VM with a default community. Run `snmpwalk -v2c -c public <lab-ip>`, and note everything it reveals. Then move to SNMPv3 and show that the old query fails.
3. Export an NFS directory with and without `root_squash`. Create a file as root from a client, then compare the owner in each case.
4. Capture a failed name lookup on your Windows lab VM, and find the LLMNR query in Wireshark. Disable LLMNR by Group Policy, then capture again to confirm.
5. Build a one-page table of the services in your lab: port, purpose, owner, and how it's hardened.

?! You inherit a network with SMBv1 still on, and nobody knows why. Write the plan for removing it safely, including how you'd find what depends on it.

## Further reading

- [CISA #StopRansomware guide](https://www.cisa.gov/stopransomware/ransomware-guide), for what real attackers abuse first.
- [Microsoft: detect, enable and disable SMBv1](https://learn.microsoft.com/en-us/windows-server/storage/file-server/troubleshoot/detect-enable-and-disable-smbv1-v2-v3), for the operational view.
- [Microsoft's SMB signing overview](https://learn.microsoft.com/en-us/windows-server/storage/file-server/smb-signing), for how signing works.
- [RFC 3414](https://www.rfc-editor.org/rfc/rfc3414), on the SNMPv3 security model.
- [RFC 8915](https://www.rfc-editor.org/rfc/rfc8915), on Network Time Security.
