---
title: OT and industrial control systems
summary: Security when computers move physical things. PLCs, the Purdue model, Modbus, lessons from Stuxnet and Industroyer, and why safety comes before everything else.
level: advanced
side: both
minutes: 50
attack: T0855, T0883, T0886
needs: 01-07-scanning-in-depth, 07-04-network-architecture
pair: 07-04-network-architecture
source: NIST SP 800-82r3, Guide to OT Security | https://csrc.nist.gov/pubs/sp/800/82/r3/final
words: PLC, SCADA, Purdue model
---
In IT, the worst case is usually lost data. In operational technology, it's a blackout, a flood or an explosion. Power grids, water plants and factories run on control systems built for reliability over decades, not for hostile networks. The security approach changes accordingly, and much of what you've learned has to be rethought.

@term OT (operational technology) = Hardware and software that monitors and controls physical processes.
@term PLC (programmable logic controller) = A rugged computer that controls machinery, by reading sensors and driving actuators in a loop.
@term SCADA = Supervisory control and data acquisition: systems for monitoring and controlling a process across a site or region.
@term Purdue model = A reference architecture that divides industrial networks into levels.
@term safety instrumented system = An independent system that brings a process to a safe state when something goes wrong.

## Concept

### Fundamentals: priorities are reversed

| | IT | OT |
|---|---|---|
| First priority | Confidentiality | Safety, then availability |
| Lifespan | 3 to 5 years | 15 to 30 years |
| Patching | Monthly | Planned outages, maybe yearly |
| Scan tolerance | High | Can stop a process |
| Downtime | Annoying | Dangerous, and expensive |

### The layers

| Level | Contents |
|---|---|
| 5, 4 | Enterprise IT |
| 3.5 | Industrial DMZ |
| 3 | Site operations, historians |
| 2 | Supervisory control, HMIs |
| 1 | PLCs and controllers |
| 0 | Sensors and actuators |

The **Purdue model** isn't perfect today, since cloud and remote access cut across it, yet it remains the common language. The **DMZ** at 3.5 is key: nothing should go directly from IT to control networks.

### Protocols

Most industrial protocols predate security. **Modbus** (1979) has no authentication and no encryption: anyone who can reach a device can read or write its registers. **DNP3** has an optional secure mode, and **OPC UA** was designed with security in mind. Their job is deterministic control, so you can't just add TLS without care for timing.

### Case studies

| Incident | Lesson |
|---|---|
| Stuxnet, about 2010 | Air gaps can be crossed, and cyber can cause physical damage |
| [Ukraine grid, 2015 and 2016](https://www.cisa.gov/news-events/ics-alerts/ir-alert-h-16-056-01), Industroyer | Attackers can operate breakers at scale |
| [TRISIS/TRITON, 2017](https://www.cisa.gov/news-events/analysis-reports/ar18-352a) | Safety systems themselves can be targeted |
| Colonial Pipeline, 2021 | IT ransomware can stop OT, even without touching it |
| Oldsmar water plant, 2021 | A case worth treating carefully: later reporting cast doubt on the first account |

Colonial is the most common pattern today. Criminals hit billing or IT systems, and the operator stops production as a precaution.

### Advanced: defending OT

**IEC 62443** is the main standard family: zones and conduits, security levels, and duties for asset owners and vendors. [NIST SP 800-82r3](https://csrc.nist.gov/pubs/sp/800/82/r3/final) is a free companion.

**Passive monitoring** is the norm. Sensors watch a SPAN port for protocol commands such as a new program being downloaded to a PLC. Active scans can crash old devices, so use them only during outages, and with the plant's agreement.

**Remote access** is a leading risk, especially for vendors. Use a broker in the DMZ, with MFA, time limits and recording.

**Recovery** matters most: offline copies of PLC logic, and engineers who know how to run by hand. [ATT&CK for ICS](https://attack.mitre.org/matrices/ics/) maps these techniques.

?? What's the top priority in OT security?
+ Safety and availability of the physical process
- Confidentiality of all of the plant's email
- Speed of each of the quarterly patches
- Encryption of every sensor reading at rest
=> Harm to people and to the process comes first. Confidentiality matters, but it's usually further down.

## Threat model

| Technique | ATT&CK for ICS |
|---|---|
| Unauthorised command message | [T0855](https://attack.mitre.org/techniques/T0855/) |
| Internet accessible device | [T0883](https://attack.mitre.org/techniques/T0883/) |
| Remote services | [T0886](https://attack.mitre.org/techniques/T0886/) |

Attackers often start in IT, then pivot. States pre-position for conflict, criminals want ransom, and hacktivists have defaced exposed HMIs. Exposed devices on Shodan are a recurring problem.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Wireshark | Decodes Modbus, DNP3 | Reading traffic |
| Zeek ICS parsers | Log industrial protocols | Passive monitoring |
| [GRFICS](https://github.com/Fortiphyd/GRFICSv2) | A simulated plant | A safe lab |
| OpenPLC | Open-source PLC | Learning |
| Dragos, Claroty, Nozomi | Commercial OT monitoring | Plants |
| [Malcolm](https://malcolm.fyi/) | Traffic analysis suite | Free OT-friendly analysis |

## Defence

- **Segment** IT from OT, with a real DMZ.
- **Inventory assets,** passively.
- **Keep offline backups** of logic and configurations.
- **Control removable media and laptops.** That's how Stuxnet crossed.
- **Protect safety systems** on their own network.
- **Control remote access tightly.**
- **Practise manual operations.** Know how to run without the network.
- **Involve engineers.** They know what a dangerous change looks like.

## Pitfalls

- **"We're air-gapped."** Laptops, USB sticks and vendors cross the gap.
- **Applying IT tools blindly.** A scan or an agent can stop a process.
- **Patching on Tuesday.** Vendors must certify updates, and outages must be scheduled.
- **Ignoring physics.** Knowing normal process values is itself a detection.
- **Excluding OT staff.** Security imposed from outside gets bypassed.

?? Why is active scanning risky on an OT network?
+ Fragile controllers can crash or stop working
- Regulators ban every scanner in every country
- PLCs respond with far too much data
- Modbus hides each device from all scanners
=> Old devices can fail on unexpected packets, and a stopped controller may mean a stopped process.

## Exercise

::: law Lab only
Use simulators only, such as GRFICS or OpenPLC, on an isolated network. Never touch a real industrial system. Interfering with one is dangerous, and a serious crime.
:::

1. Run GRFICS or OpenPLC in VMs.
2. Capture Modbus traffic in Wireshark, and identify a read and a write. Note that there's no authentication.
3. Write a Zeek or Suricata rule that alerts on a write from an unexpected address.
4. Draw the lab on the Purdue model, and add a DMZ.
5. Read the CISA report on TRITON, and list which controls might have helped.

?! A water utility wants remote access for a vendor. Write the conditions under which you'd allow it.

## Further reading

- [NIST SP 800-82r3](https://csrc.nist.gov/pubs/sp/800/82/r3/final).
- [ATT&CK for ICS](https://attack.mitre.org/matrices/ics/).
- [CISA ICS advisories](https://www.cisa.gov/news-events/cybersecurity-advisories?f%5B0%5D=advisory_type%3A95).
- [CyBOK Cyber-Physical Systems Security](https://www.cybok.org/knowledgebase1_1/).
- Andy Greenberg, *Sandworm*, on Ukraine's grid attacks.
