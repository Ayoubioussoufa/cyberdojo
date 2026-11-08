---
title: Firmware and IoT security
summary: Why cheap connected devices became a global weapon. Debug interfaces, firmware analysis, default passwords, secure updates, and the rules now forcing manufacturers to do better.
level: advanced
side: both
minutes: 45
attack: T1542.001, T1495
needs: 05-02-executables-and-linking, 0035-how-the-web-works
source: OWASP IoT Project | https://owasp.org/www-project-internet-of-things/
words: firmware, UART, secure boot
---
A camera, a router and a smart plug are small Linux computers that nobody patches. They sit on networks for ten years, often with a default password. Lessons from this domain have reached the whole Internet, as a 2016 botnet of such devices took down major websites.

@term firmware = The software embedded in a device, which runs its hardware.
@term UART = A simple serial interface, often left on circuit boards, which can give console access.
@term JTAG = A hardware debugging interface that can read and control a chip.

## Concept

### Fundamentals: why IoT is different

| Normal IT | IoT |
|---|---|
| Patched regularly | Patched rarely, if ever |
| Owned by IT | Bought by whoever needed it |
| Replaced in five years | Stays for 10 or more years |
| Runs EDR | Runs nothing |
| Full OS | Stripped-down, often old |

Low prices leave little budget for security, and the buyer can't see the difference. It's a market failure, which explains why regulators have stepped in.

### What's inside

A typical device has a system-on-chip, SPI flash storing firmware, and debug points on the board.

| Interface | What it offers |
|---|---|
| **UART** | Boot logs, and often a shell |
| **JTAG, SWD** | Debugging, memory read and write |
| SPI flash | Direct firmware read |
| Web admin | Configuration, frequent bugs |
| Cloud API | Remote control |
| Mobile app | Keys and endpoints |

Firmware images are often available from a vendor's support page. `binwalk` finds and extracts the filesystem inside, which usually reveals configuration, certificates and binaries. Common findings: hardcoded credentials, old libraries, debug shells, and command injection in the web interface.

### Mirai

In 2016, [Mirai](https://www.usenix.org/conference/usenixsecurity17/technical-sessions/presentation/antonakakis) scanned the Internet for devices with Telnet open, and tried a short list of default passwords. It needed no exploit. It built a botnet of hundreds of thousands of devices, and its attack on the DNS provider Dyn took down major sites. Its source code was released, and variants continue.

### Advanced: secure design

A secure device needs a chain from hardware up.

@flow Immutable boot ROM > Verified bootloader > Signed firmware > Authenticated updates

**Secure boot** verifies each stage. **Signed updates** stop tampered images, and **anti-rollback** stops downgrades to vulnerable versions. Each device should have **unique credentials**, set in manufacture, and a secret should sit in a secure element, not in flash.

**Update lifecycle.** A/B partitions allow a safe rollback if an update fails. A vendor must state how long it will support a device, and it must have a way to accept vulnerability reports.

**Regulation.** [ETSI EN 303 645](https://www.etsi.org/technologies/consumer-iot-security) is the baseline for consumer IoT: no universal default passwords, a disclosure policy, and software updates. The UK's PSTI regime and the EU's [Cyber Resilience Act](/modules/12-05-eu-regulation/) make this kind of thing a legal duty.

**At the network level,** many IoT devices can't be fixed, so contain them. See [Network architecture](/modules/07-04-network-architecture/).

?? What made Mirai so effective?
+ Many devices still kept default Telnet passwords
- Every camera shared one zero-day kernel bug
- Routers run the same antivirus with flaws
- Its authors held stolen manufacturer signing keys
=> No exploit was needed. A short password list and open Telnet were enough.

## Threat model

| Technique | ATT&CK |
|---|---|
| System firmware modification | [T1542.001](https://attack.mitre.org/techniques/T1542/001/) |
| Firmware corruption | [T1495](https://attack.mitre.org/techniques/T1495/) |

Remote attackers build botnets, or use a router as a [proxy](/modules/01-10-proxies-pivoting-and-tunnels/). State actors have used small office routers to hide their traffic, as [FBI and CISA advisories](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a) on Volt Typhoon describe. Physical attackers with brief access can read secrets from flash. If one key is shared across a product line, one device breaks them all.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `binwalk` | Extracts firmware | Studying your device |
| FACT, EMBA | Automated firmware analysis | Larger reviews |
| Ghidra | Reverse engineering | Understanding a binary |
| USB-UART adapter | Serial console | Your own board |
| Logic analyser | Decodes signals | Finding what a bus carries |
| QEMU | Emulates firmware | Testing without hardware |
| Nmap | Finds exposed services | Auditing your network |

## Defence

**As a buyer:**

- Inventory devices, and ban those without updates.
- Change default credentials.
- Put IoT on its own VLAN, with egress restricted.
- Disable UPnP, and unused services.

**As a manufacturer:**

- No shared default passwords.
- Signed updates, with rollback protection.
- Disable or protect debug interfaces in production.
- Publish an SBOM and a support period.
- Run a disclosure programme.

**Detection.** Watch for unusual outbound traffic and for scanning from IoT VLANs.

## Pitfalls

- **"It's only a light bulb."** It's a computer on your network.
- **"It's behind NAT."** Cloud services and UPnP open paths.
- **Disabling UART in software only.** Fuses and a secure boot chain are stronger.
- **Encrypting firmware and calling it secure.** Obscurity won't replace authentication.
- **Forgetting end of life.** Plan the replacement.

?? What should a secure device update check?
+ A valid signature and no version rollback
- A faster download from any available mirror
- A user's approval by telephone each time
- A matching serial number printed on it
=> The signature proves origin, and rollback protection stops a return to a known vulnerable version.

## Exercise

::: law Lab only
Examine only devices that you own, and firmware the vendor publishes. Keep a test device off your real network. Don't scan or log in to devices that aren't yours, even with default passwords.
:::

1. Download a firmware image for a router that you own, from the vendor's site.
2. Run `binwalk -e`, and browse the extracted filesystem.
3. Look for hardcoded credentials and old library versions, and write the findings for the vendor.
4. Scan your own home network with `nmap`, then list each device and its owner.
5. Create an IoT VLAN or guest network, and move a device onto it.
6. If you have an old device and a USB-UART adapter, find its console and read the boot log.

?! A hospital's infusion pumps run old firmware with no available patches. Write how you'd reduce that risk, without touching the devices themselves.

## Further reading

- [OWASP IoT Project](https://owasp.org/www-project-internet-of-things/).
- [Understanding the Mirai Botnet](https://www.usenix.org/conference/usenixsecurity17/technical-sessions/presentation/antonakakis).
- [ETSI EN 303 645](https://www.etsi.org/technologies/consumer-iot-security).
- [NIST IR 8259](https://csrc.nist.gov/pubs/ir/8259/final), on IoT device manufacturers.
- [CISA advisory on Volt Typhoon](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-038a).
