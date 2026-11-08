---
title: Physical security
summary: Every digital control sits in a building. Layers of physical defence, access cards, tailgating, malicious USB devices, evil maid risk, and how authorised physical tests are run.
level: foundation
side: both
minutes: 35
attack: T1200, T1091
needs: 0010-the-language-of-risk
pair: 16-01-social-engineering, 02-14-virtualisation-and-boot-integrity
source: ISO/IEC 27002, Physical controls | https://www.iso.org/standard/75652.html
words: tailgating, defence in depth, evil maid attack
---
If someone can walk up to a server, plug in a device, or carry away a laptop, then many software controls stop mattering. Physical security is often someone else's job, in facilities or a guard company. Yet attackers treat doors, badges and USB ports as part of the same attack surface.

@term tailgating = Following an authorised person through a secured door.
@term evil maid attack = Tampering with an unattended device so that it captures secrets when its owner returns.
@term HID attack = A device posing as a keyboard, which types commands when plugged in.

## Concept

### Fundamentals: layers

Think in rings, and aim to deter, detect, delay and respond at each one.

| Layer | Controls |
|---|---|
| Perimeter | Fences, lighting, cameras |
| Building | Reception, badge readers, guards |
| Secure areas | Mantraps, multi-factor doors, logging |
| Equipment | Locked racks, cable locks |
| Media | Encryption, secure disposal |

Delay matters most when paired with detection. A lock only buys time for someone to respond.

### Access cards

Older 125 kHz proximity cards broadcast a fixed ID when powered by a reader. A cheap cloner close by can copy it, even from a pocket. Newer smart cards, such as DESFire EV2 or EV3, use mutual authentication with cryptography, so that there's no fixed value to copy. Many buildings still use the old kind, often because readers and cards are expensive to replace.

### People

Most physical intrusions use social engineering, not lockpicks. **Tailgating** works because people are polite. A high-visibility vest, a clipboard, or a box in both hands gets doors held open. See [Social engineering](/modules/16-01-social-engineering/). Train staff to challenge politely, and give them a way of reporting without confrontation.

### USB and hardware

| Device | Risk |
|---|---|
| Dropped USB stick | Curiosity. A [2016 study](https://zakird.com/papers/usb.pdf) found that many were plugged in |
| **HID attack** device | Acts as a keyboard, so USB storage blocking doesn't stop it |
| Malicious cable | Hides a device inside a normal-looking cable |
| Network implant | A small box on a network port, phoning home |
| Hardware keylogger | Sits between a keyboard and a PC |

### Advanced: unattended devices

**The evil maid attack** targets a laptop left in a hotel: an attacker modifies the boot chain, so that the next time the owner enters a password, it's captured. **Cold boot attacks** read keys from RAM just after power-off, as memory fades slowly. **DMA attacks** used Thunderbolt or similar ports to read memory directly, though IOMMU protections reduce this. So [Secure Boot, TPM and full-disk encryption](/modules/02-14-virtualisation-and-boot-integrity/) work best with a pre-boot PIN.

**Data centres** and **disposal** are the other half. Old drives must be wiped or destroyed, following guidance such as [NIST SP 800-88](https://csrc.nist.gov/pubs/sp/800/88/r1/final). Studies keep finding data on second-hand drives.

**Physical penetration tests** need strict rules. Testers carry a signed letter and emergency contacts, as misunderstandings can end in arrest. In 2019, two Coalfire employees were arrested during an authorised test of an Iowa courthouse, after a dispute over who could authorise it. Charges were eventually dropped. It's a clear lesson about scope and [authorisation](/modules/12-01-computer-crime-law/).

?? What does a physical test team need on site?
+ A signed letter with emergency contacts
- A forged badge from another firm
- A police uniform for each tester
- A copy of every building key
=> The letter proves permission and tells security whom to call. Impersonating police is a crime.

## Threat model

| Technique | ATT&CK |
|---|---|
| Hardware additions | [T1200](https://attack.mitre.org/techniques/T1200/) |
| Removable media | [T1091](https://attack.mitre.org/techniques/T1091/) |

Attackers range from thieves, who want the hardware, to spies with short, targeted access. Insiders already have the badge.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Badge logs | Who went where | Investigating |
| Device control | Blocks or allow-lists USB | Endpoint policy |
| USBGuard | USB allow-listing on Linux | Linux hosts |
| Sysmon, Windows events | Log device connections | Detecting new hardware |
| Cameras with retention | Evidence | Investigating |
| Asset tags | Track equipment | Inventory |

## Defence

- **Encrypt all laptops,** with pre-boot authentication for high-risk staff.
- **Upgrade old access cards.**
- **Use visitor processes:** sign-in, escorts, visible badges.
- **Lock server rooms and network cabinets,** and disable unused network ports.
- **Control USB** by policy.
- **Use 802.1X,** so that a rogue box on a wall port gets nothing.
- **Dispose of media properly,** with evidence.
- **Log and alert** on badge use out of hours.
- **Train staff** to challenge and to report.

## Pitfalls

- **"Facilities handles that."** Then nobody connects badge logs to security.
- **Blocking USB storage only.** HID devices aren't storage.
- **Forgetting printers and network ports in meeting rooms.**
- **Propped doors.** The best lock fails to a fire door wedge.
- **Running a physical test without telling the right people.** Someone could get hurt.

?? Why are old 125 kHz access cards weak?
+ They broadcast a fixed ID when read
- They expire after a single calendar year
- They only work in very dry weather
- They need a password from each user
=> With no cryptography, a nearby reader can copy the ID, then replay it on a blank card.

## Exercise

::: law Lab only
Only assess your own home or a building where you have written permission. Don't tailgate, clone badges or bypass locks anywhere else.
:::

1. Walk through your own home or lab as an attacker would. List what's exposed: ports, laptops, papers.
2. Check your own laptop: is the disk encrypted? Is there a pre-boot PIN?
3. On a test Linux VM with USB pass-through, install USBGuard, and block a new device.
4. Read Windows events or `dmesg` after plugging in a keyboard. How would you detect a new HID device?
5. Write a one-page visitor policy for a small office.

?! You find a USB stick labelled "Salaries 2026" in the car park. Write what you'd tell staff to do, and what your team would do next.

## Further reading

- [NIST SP 800-88](https://csrc.nist.gov/pubs/sp/800/88/r1/final), on media sanitisation.
- Tischer and others, [Users Really Do Plug in USB Drives They Find](https://zakird.com/papers/usb.pdf).
- [NIST SP 800-116](https://csrc.nist.gov/pubs/sp/800/116/r1/final), on physical access with smart cards.
- [ISO/IEC 27002](https://www.iso.org/standard/75652.html).
- [TOOOL](https://toool.us/), an open organisation on locks, for the curious.
