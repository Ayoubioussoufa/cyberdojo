---
title: Network security architecture
summary: From flat networks to designs that assume breach. Tiers, microsegmentation, bastions, 802.1X, egress control and DDoS protection, with the failure each one answers.
level: intermediate
side: defence
minutes: 50
attack: T1021, T1599, T1048
needs: 0021-firewalls-and-segmentation, 07-01-iptables-and-nftables
pair: 01-04-layer-2-attacks, 01-10-proxies-pivoting-and-tunnels, 01-13-denial-of-service, 15-08-ot-and-ics
source: NSA and CISA, Top Ten Cybersecurity Misconfigurations | https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a
words: microsegmentation, bastion host, egress control
---
Networks rarely fall because of a clever firewall bypass. They fall because one laptop could reach everything. NSA and CISA list [poor network segmentation](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a) among their top ten misconfigurations. Good architecture doesn't stop the first compromise. It decides how much the second step can reach.

@term microsegmentation = Enforcing access between individual workloads, rather than between whole networks.
@term bastion host = A hardened machine that's the only permitted route for administrative access into a network.
@term management plane = The interfaces and traffic used to administer devices, rather than to carry user data.

## Concept

### Fundamentals: think in blast radius

For every system, ask: **if this falls, what can the attacker reach next?** Segmentation is how you control the answer. Group systems by trust and function, then allow only named flows between groups.

| Zone | Holds | Reachable from |
|---|---|---|
| DMZ | Public-facing services | Internet, on specific ports |
| Application | Business logic | DMZ, on specific ports |
| Data | Databases | Application only |
| Management | Admin interfaces | Bastion only |
| User | Workstations | Outbound through a proxy |
| Guest and IoT | Untrusted devices | Internet only |

Workstations almost never need to talk to each other, and blocking that stops a great deal of ransomware. Windows Firewall can do this host by host.

### The management plane

Admin interfaces are the highest-value targets on a network: hypervisors, switches, BMCs, backup consoles. **Separate them from data traffic.** A **bastion host** gives one audited way in, with MFA and session logging. Administrators use dedicated privileged access workstations, so that an infected email laptop never holds a domain admin session.

Backup systems deserve their own zone. Ransomware operators target them first, and backups that sit on the same domain as production can be destroyed along with it.

### Network access control

Plugging into a wall socket shouldn't be enough. **802.1X** blocks a port until the device authenticates through a RADIUS server.

@flow Device (supplicant) > Switch (authenticator) > RADIUS server > Port opens or stays closed

The strongest option is EAP-TLS, with device certificates. MAC Authentication Bypass exists for printers, but MAC addresses are easily spoofed, so put such devices in a limited VLAN. 802.1X alone can be defeated by sitting between an approved device and the switch, and MACsec closes this. See [Layer 2 attacks](/modules/01-04-layer-2-attacks/).

### Egress control

Most effort goes on inbound rules, yet malware has to call home, and data has to leave. **Default-deny egress** on servers cuts command and control, downloads and exfiltration. Users go out through a filtering proxy with logging. This also buys time: even if the first step works, the next one fails loudly.

### Advanced: microsegmentation and resilience

**Microsegmentation** moves policy from VLANs to workloads. In the cloud, security groups do this. On hosts, agents programme firewalls. In Kubernetes, NetworkPolicy does. Rules follow identity tags, not addresses, so they survive scaling. The challenge is learning real flows first: start in visibility mode, then enforce, or you'll break things you didn't know existed.

**DDoS protection** is an architecture matter too. Keep origin servers hidden behind a CDN, use anycast and scrubbing, and split critical services onto separate links. See [Denial of service](/modules/01-13-denial-of-service/). Keep out-of-band access, so that you can still reach your routers in an attack.

**Shared infrastructure** is the catch: DNS, Active Directory, monitoring, patching and backup tools reach everything by design. Compromising one crosses every segment. So these are Tier 0 assets, and they need the strongest protection in your estate.

?? What does 802.1X decide before a port opens?
+ Whether the device proves its own identity
- Whether the switch has enough free ports
- Whether the cable meets the speed rating
- Whether the VLAN is using IPv6 addressing
=> The switch forwards only authentication traffic until a RADIUS server approves the device, then opens the port.

## Threat model

| Technique | ATT&CK | Countered by |
|---|---|---|
| Remote services | [T1021](https://attack.mitre.org/techniques/T1021/) | Host firewalls, jump hosts |
| Network boundary bridging | [T1599](https://attack.mitre.org/techniques/T1599/) | Device hardening, management separation |
| Exfiltration on alternative protocols | [T1048](https://attack.mitre.org/techniques/T1048/) | Egress deny, proxies, DNS control |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| FreeRADIUS | RADIUS server | Building 802.1X in a lab |
| Teleport, Apache Guacamole | Audited access gateways | Bastion design |
| `nmap` from each zone | Tests segmentation | Proving that rules hold |
| Illumio, Cilium, cloud security groups | Microsegmentation | Workload-level policy |
| NetBox | Network source of truth | Knowing what you have |

## Defence

- **Write a flow matrix:** source, destination, port, purpose, owner. Anything not on it is denied.
- **Test continuously.** Scan from each zone and compare with the matrix. A rule that exists on paper proves nothing.
- **Deny workstation-to-workstation** traffic and SMB.
- **Protect backups** with offline or immutable copies, on separate credentials.
- **Log denied flows.** A denied internal connection is often the earliest evidence of an intruder.
- **Prepare out-of-band access**, for when the network itself is the incident.

## Pitfalls

- **"Any-any for now."** Temporary rules tend to last for years. Give each one an owner and an expiry.
- **VLANs with routing and no filtering.** That's only one network with extra steps.
- **Segmenting everything at once.** Start with crown jewels, then work out.
- **A bastion that's reachable from everywhere with a shared account.** It should be the most monitored box you own.
- **Forgetting shared services.** A backup agent on every server is a path across every segment.

?? Which design best limits a compromised web server?
+ Default-deny egress to a named host list
- A larger firewall at the Internet edge
- A stronger TLS certificate on its site
- A second antivirus agent on the server
=> The attacker's next moves depend on where the server can connect. Restricting that shrinks the blast radius directly.

## Exercise

::: law Lab only
Build this with your own VMs. Scan only your own segments.
:::

1. In your OPNsense lab from P01, create user, server and management zones. Write a flow matrix first.
2. Implement it, and scan from each zone. Compare results with your matrix, and fix any difference.
3. Set up a bastion with SSH certificates, and make `internal` reachable only from it.
4. Configure default-deny egress for a server VM, with an allow-list for updates. Show that `curl` to anywhere else fails, and find the log entry.
5. Build FreeRADIUS and hostapd or a virtual switch with 802.1X, if your hardware allows it. Otherwise, draw the exchange on paper.

?! Take a flat 200-person office network. Give the first three segmentation projects, in order, with the risk each one removes.

## Further reading

- [NSA and CISA Top Ten Misconfigurations](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-278a).
- [CIS Critical Security Controls](https://www.cisecurity.org/controls), controls 12 and 13.
- [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final), for where architecture is heading.
- [Microsoft: Privileged Access Workstations](https://learn.microsoft.com/en-us/security/privileged-access-workstations/overview).
- [FreeRADIUS documentation](https://www.freeradius.org/documentation/).
