# Tools

<!-- Written by scripts/tools/index.ts. Edit the tool pages, then run pnpm audit:tools. -->

148 tool guides, plus an A to Z of 895 names at [/tools/all/](../src/app/tools/all/page.tsx).

Every guide says what the tool is for and how it works, then what defenders see. How much it shows depends on its `use` field:

| Use | Meaning | Commands |
|---|---|---|
| `open` | Defensive or everyday tools | Full usage |
| `own` | Recon, scanning and audit | Usage aimed at your own lab or domain |
| `know` | Attack tools | None. How it works, how to detect it, and where to practise legally |

## Measured against outside lists (snapshot 2026-11-07)

| List | Size | With a guide here |
|---|---|---|
| Kali top 10 | 10 | 10 |
| ATT&CK tools seen with 2 or more groups or campaigns | 57 | 14 |
| Kali 802-11 | 19 | 4 |
| Kali bluetooth | 10 | 0 |
| Kali database | 10 | 1 |
| Kali exploitation | 9 | 4 |
| Kali forensics | 102 | 14 |
| Kali hardware | 11 | 2 |
| Kali identify | 15 | 6 |
| Kali information-gathering | 49 | 15 |
| Kali passwords | 48 | 7 |
| Kali post-exploitation | 22 | 0 |
| Kali recover | 8 | 0 |
| Kali reporting | 8 | 4 |
| Kali reverse-engineering | 15 | 4 |
| Kali sniffing-spoofing | 24 | 6 |
| Kali voip | 18 | 2 |
| Kali vulnerability | 37 | 4 |
| Kali web | 78 | 18 |
| Kali windows-resources | 16 | 0 |

## Reconnaissance and OSINT

What the Internet already says about a target, usually your own.

- [Amass](01-recon-osint/amass.md) (own): Maps a domain's external attack surface through DNS, certificates and scraping.
- [Censys](01-recon-osint/censys.md) (own): Searches Internet-wide scan data on hosts and certificates.
- [crt.sh](01-recon-osint/crtsh.md) (own): Searches public Certificate Transparency logs by domain.
- [dig](01-recon-osint/dig.md) (open): Asks DNS servers direct questions and shows their full answers.
- [dnsrecon](01-recon-osint/dnsrecon.md) (own): Enumerates a domain's DNS records and checks for common misconfigurations.
- [ExifTool](01-recon-osint/exiftool.md) (open): Reads and removes metadata from images, documents and other files.
- [fierce](01-recon-osint/fierce.md) (own): Finds non-contiguous IP space and hostnames for a domain through DNS.
- [Google dorks](01-recon-osint/google-dorks.md) (own): Uses advanced search operators to find exposed files and pages.
- [httpx](01-recon-osint/httpx.md) (own): Probes a list of hosts and reports which ones run a web server, and what it runs.
- [Maltego](01-recon-osint/maltego.md) (own): Draws links between people, domains and infrastructure on a graph.
- [recon-ng](01-recon-osint/recon-ng.md) (own): A modular recon framework with a console and a database of findings.
- [Sherlock](01-recon-osint/sherlock.md) (own): Checks which websites have an account with a given username.
- [Shodan](01-recon-osint/shodan.md) (own): A search engine for Internet-connected devices and the banners they expose.
- [SpiderFoot](01-recon-osint/spiderfoot.md) (own): Automates OSINT collection across more than 200 modules, with a web interface.
- [subfinder](01-recon-osint/subfinder.md) (own): Finds subdomains quickly from passive sources only.
- [theHarvester](01-recon-osint/theharvester.md) (own): Collects email addresses, subdomains and hosts for a domain from public sources.
- [whois](01-recon-osint/whois.md) (open): Looks up who registered a domain or holds an IP address range.

## Scanning and enumeration

Finding hosts, ports and services.

- [arp-scan](02-scanning/arp-scan.md) (own): Discovers every device on the local network segment through ARP.
- [enum4linux-ng](02-scanning/enum4linux-ng.md) (own): Gathers information from Windows and Samba hosts over SMB.
- [fping](02-scanning/fping.md) (own): Pings many hosts at once and reports which ones answer.
- [hping3](02-scanning/hping3.md) (own): Sends custom TCP, UDP and ICMP packets, for testing firewalls.
- [masscan](02-scanning/masscan.md) (own): Scans very large address ranges at high speed.
- [naabu](02-scanning/naabu.md) (own): A simple, fast port scanner built for pipelines.
- [nbtscan](02-scanning/nbtscan.md) (own): Lists Windows hosts on a network through NetBIOS names.
- [Netcat](02-scanning/netcat.md) (open): Reads and writes raw data over network connections.
- [netdiscover](02-scanning/netdiscover.md) (own): Finds hosts on a local network, actively or just by listening.
- [Nmap](02-scanning/nmap.md) (own): Finds live hosts, open ports, services and versions.
- [RustScan](02-scanning/rustscan.md) (own): Finds open ports fast, then passes them to Nmap.
- [smbclient](02-scanning/smbclient.md) (own): Lists and accesses Windows file shares from Linux.
- [snmpwalk](02-scanning/snmpwalk.md) (own): Reads a device's settings over SNMP.
- [socat](02-scanning/socat.md) (own): Relays data between two endpoints of almost any kind.
- [ss](02-scanning/ss.md) (open): Shows which ports are listening and who's connected on a Linux host.
- [traceroute](02-scanning/traceroute.md) (open): Shows the path packets take, hop by hop.

## Traffic and network analysis

Seeing what really crosses the wire.

- [Arkime](03-traffic/arkime.md) (open): Records full packets at scale and makes them searchable.
- [arpspoof](03-traffic/arpspoof.md) (know): Part of dsniff, the classic toolkit that redirects LAN traffic.
- [bettercap](03-traffic/bettercap.md) (know): A modern framework for network, Wi-Fi and Bluetooth attacks.
- [Ettercap](03-traffic/ettercap.md) (know): A suite for man-in-the-middle tests on a local network.
- [NetworkMiner](03-traffic/networkminer.md) (open): Extracts files, hosts and credentials from a capture.
- [ngrep](03-traffic/ngrep.md) (open): Searches network traffic for text, like grep for packets.
- [Scapy](03-traffic/scapy.md) (own): Builds, sends and decodes packets from Python.
- [tcpdump](03-traffic/tcpdump.md) (open): Captures packets from the command line with almost no overhead.
- [tcpreplay](03-traffic/tcpreplay.md) (open): Replays captured traffic onto a network, for testing sensors.
- [tshark](03-traffic/tshark.md) (open): Wireshark's dissectors on the command line, for scripts and servers.
- [Wireshark](03-traffic/wireshark.md) (open): Captures packets and shows each protocol in readable form.

## Web application testing

Proxies, discovery and scanners for web apps.

- [BeEF](04-web/beef.md) (know): A framework that controls browsers through cross-site scripting.
- [Burp Suite](04-web/burp-suite.md) (own): The standard intercepting proxy for testing web applications.
- [Caido](04-web/caido.md) (own): A lightweight web proxy, a newer alternative to Burp.
- [Commix](04-web/commix.md) (know): Automates testing for OS command injection.
- [curl](04-web/curl.md) (open): Makes web requests from the command line, showing exactly what's sent.
- [dirsearch](04-web/dirsearch.md) (own): A simple web path scanner with a built-in wordlist.
- [EyeWitness](04-web/eyewitness.md) (own): Takes screenshots of many websites, so you can triage them by eye.
- [feroxbuster](04-web/feroxbuster.md) (own): Recursive content discovery written in Rust.
- [ffuf](04-web/ffuf.md) (own): Fast web fuzzer that finds hidden paths, parameters and virtual hosts.
- [Gobuster](04-web/gobuster.md) (own): Brute-forces web paths, DNS names and virtual hosts from a wordlist.
- [mitmproxy](04-web/mitmproxy.md) (own): A scriptable HTTPS proxy with a terminal interface.
- [Nikto](04-web/nikto.md) (own): Checks a web server for dangerous files and outdated software.
- [SecLists](04-web/seclists.md) (open): The standard collection of wordlists for security testing.
- [sqlmap](04-web/sqlmap.md) (know): Automates finding and exploiting SQL injection.
- [wafw00f](04-web/wafw00f.md) (own): Detects whether a web application firewall protects a site.
- [wfuzz](04-web/wfuzz.md) (own): Web fuzzer that can target any part of a request.
- [WhatWeb](04-web/whatweb.md) (own): Identifies the technology behind a website.
- [WPScan](04-web/wpscan.md) (own): Audits WordPress sites for vulnerable plugins and weak settings.
- [XSStrike](04-web/xsstrike.md) (know): Scans for cross-site scripting flaws.
- [ZAP](04-web/zap.md) (own): A free, open-source web proxy and scanner, ideal for CI.

## Vulnerability scanning and audit

Finding known flaws and weak settings.

- [DefectDojo](05-vulnerability/defectdojo.md) (open): Collects findings from many scanners into one managed list.
- [Dradis](05-vulnerability/dradis.md) (open): Helps security teams collaborate on findings and reports.
- [Nessus](05-vulnerability/nessus.md) (own): A widely used commercial vulnerability scanner.
- [Nuclei](05-vulnerability/nuclei.md) (own): Scans for known flaws using community-written YAML templates.
- [OpenVAS](05-vulnerability/openvas.md) (own): An open-source vulnerability scanner, from Greenbone.
- [SearchSploit](05-vulnerability/searchsploit.md) (own): Searches a local copy of the Exploit Database.

## Passwords and credentials

How passwords get attacked, and how to audit yours.

- [hashcat](06-passwords/hashcat.md) (know): The tool that explains why password storage must use a slow, salted algorithm.
- [Hydra and the online guessers](06-passwords/hydra.md) (know): Tools that guess logins against live services, and the controls that stop them.
- [John the Ripper](06-passwords/john.md) (know): A classic password-auditing tool, and a guide to which hashes resist offline attack.

## Wireless, Bluetooth and radio

Monitoring and testing what's in the air.

- [Aircrack-ng](07-wireless/aircrack-ng.md) (own): The classic Wi-Fi testing suite, and the case for WPA3 and long passphrases.
- [Kismet](07-wireless/kismet.md) (own): Passively detects and maps wireless devices and networks.
- [Wifite](07-wireless/wifite.md) (know): Automates Wi-Fi security testing, and shows which networks resist it.

## Attack frameworks and C2

Names you'll meet in reports, and how to detect them.

- [Empire, Covenant, Mythic and the C2 landscape](08-frameworks/c2-matrix.md) (know): The wider family of command-and-control frameworks defenders see named in reports.
- [Cobalt Strike](08-frameworks/cobalt-strike.md) (know): A commercial red-team tool whose cracked copies made it a favourite of real attackers.
- [Metasploit](08-frameworks/metasploit.md) (know): The best-known exploitation framework, and a name every defender should understand.
- [Sliver](08-frameworks/sliver.md) (know): An open-source command-and-control framework that attackers increasingly adopt.

## Active Directory tooling

What these tools are, and what they leave behind.

- [BloodHound](09-active-directory/bloodhound.md) (know): Maps the hidden paths through an Active Directory that lead to full control.
- [Impacket](09-active-directory/impacket.md) (know): A library of Windows network protocols that powers many admin and attack tools.
- [NetExec](09-active-directory/netexec.md) (know): A Swiss-army tool for assessing Windows networks at scale, and a map of what to lock down.
- [PingCastle](09-active-directory/pingcastle.md) (open): Scores an Active Directory's security and reports what to fix.
- [Purple Knight](09-active-directory/purple-knight.md) (open): Assesses Active Directory and Entra ID for security weaknesses.
- [Responder](09-active-directory/responder.md) (know): Answers broadcast name requests to capture credentials; the clearest case for turning off old protocols.

## Built-in tools attackers abuse

Normal system programs, and how to spot misuse.

- [BITS and bitsadmin](10-built-in/bitsadmin.md) (know): A Windows file-transfer service that attackers use to download payloads quietly and persist.
- [certutil](10-built-in/certutil.md) (know): A Windows certificate utility that attackers misuse to download and decode files.
- [net, ipconfig and the net recon family](10-built-in/netutils.md) (know): Everyday Windows commands attackers run first to understand where they've landed.
- [PowerShell](10-built-in/powershell.md) (know): Windows' scripting engine, and a favourite of attackers for the same reasons admins love it.
- [rundll32, regsvr32 and mshta](10-built-in/rundll32.md) (know): Signed Windows programs that run code, which attackers use to launch payloads under a trusted name.
- [WMIC and WMI](10-built-in/wmic.md) (know): A Windows management interface used to run commands and gather information, locally and remotely.

## Host hardening and audit

Checking and locking down Linux and Windows.

- [auditd](11-hardening/auditd.md) (open): Records security-relevant events in the Linux kernel.
- [CIS-CAT](11-hardening/cis-cat.md) (open): Assesses systems against CIS Benchmarks.
- [Fail2ban](11-hardening/fail2ban.md) (open): Blocks addresses that show signs of attack in log files.
- [firewalld](11-hardening/firewalld.md) (open): Manages a Linux host firewall through zones.
- [Lynis](11-hardening/lynis.md) (open): Audits a Linux or Unix system and scores its hardening.
- [OpenSCAP](11-hardening/openscap.md) (open): Checks a system against formal security policies, such as CIS or STIG.
- [Sysmon](11-hardening/sysmon.md) (open): Records detailed activity on Windows, far beyond the default logs.
- [ufw](11-hardening/ufw.md) (open): A simple front end to the Linux firewall, common on Ubuntu.

## Detection and monitoring

IDS, SIEM, EDR and log tooling.

- [Elastic Stack](12-detection/elastic-stack.md) (open): Stores and searches huge volumes of logs, with dashboards.
- [osquery](12-detection/osquery.md) (open): Lets you query a computer's state as if it were a database.
- [Security Onion](12-detection/security-onion.md) (open): A ready-made Linux distribution for network security monitoring.
- [Sigma](12-detection/sigma.md) (open): A shared, tool-independent format for writing detection rules.
- [Snort](12-detection/snort.md) (open): The original open-source intrusion detection system.
- [Suricata](12-detection/suricata.md) (open): Inspects network traffic for known threats and logs rich metadata.
- [Velociraptor](12-detection/velociraptor.md) (open): Hunts across many endpoints and collects evidence at scale.
- [Wazuh](12-detection/wazuh.md) (open): An open-source platform for endpoint detection and log analysis.
- [Zeek](12-detection/zeek.md) (open): Turns network traffic into rich, structured logs.

## Forensics and incident response

Collecting and reading evidence.

- [Autopsy](13-forensics/autopsy.md) (open): A graphical workbench for examining disk images.
- [binwalk](13-forensics/binwalk.md) (open): Finds and extracts files hidden inside other files, especially firmware.
- [ClamAV](13-forensics/clamav.md) (open): An open-source antivirus engine, often used on mail and file servers.
- [foremost](13-forensics/foremost.md) (open): Recovers files from a disk image by their content, not the file system.
- [FTK Imager](13-forensics/ftk-imager.md) (open): Creates forensic disk and memory images, preserving the evidence.
- [Plaso](13-forensics/plaso.md) (open): Builds a single timeline from many sources of evidence.
- [The Sleuth Kit](13-forensics/sleuthkit.md) (open): Command-line tools for file system forensics.
- [Volatility](13-forensics/volatility.md) (open): Analyses the contents of a captured memory image.
- [YARA](13-forensics/yara.md) (open): Matches files and memory against patterns you define.

## Malware analysis and reversing

Taking programs apart safely.

- [gdb](14-reversing/gdb.md) (own): The GNU debugger: runs a program under your control to see what it does.
- [Ghidra](14-reversing/ghidra.md) (own): A free reverse-engineering suite with an excellent decompiler.
- [pwndbg](14-reversing/pwndbg.md) (own): A gdb plug-in for exploitation research and binary analysis.
- [radare2](14-reversing/radare2.md) (own): A scriptable command-line reverse-engineering framework.
- [strings](14-reversing/strings.md) (open): Prints the readable text inside a binary file.

## Cloud and containers

Auditing cloud accounts, images and clusters.

- [Checkov](15-cloud/checkov.md) (open): Scans infrastructure-as-code for misconfigurations before deployment.
- [Falco](15-cloud/falco.md) (open): Detects suspicious behaviour in containers and on hosts at runtime.
- [Grype](15-cloud/grype.md) (open): Finds known vulnerabilities in container images and file systems.
- [kube-bench](15-cloud/kube-bench.md) (open): Checks a Kubernetes cluster against the CIS Benchmark.
- [Prowler](15-cloud/prowler.md) (own): Audits a live cloud account against security best practices.
- [ScoutSuite](15-cloud/scoutsuite.md) (own): Reviews a cloud account's security and shows it in one report.
- [Trivy](15-cloud/trivy.md) (open): Scans images, file systems and code for vulnerabilities and misconfigurations.

## Code and supply chain

Finding flaws and secrets in what you build.

- [Bandit](16-appsec/bandit.md) (open): Finds common security issues in Python code.
- [CodeQL](16-appsec/codeql.md) (open): Treats code as a database you can query for security flaws.
- [Gitleaks](16-appsec/gitleaks.md) (open): Finds secrets such as keys and tokens in code and git history.
- [Semgrep](16-appsec/semgrep.md) (open): Finds bugs and risky patterns in source code using simple rules.
- [TruffleHog](16-appsec/trufflehog.md) (open): Finds secrets and checks whether they still work.

## Cryptography and secrets

Everyday tools for keys, TLS and encoding.

- [age](17-crypto/age.md) (open): A simple, modern tool for encrypting files.
- [CFSSL](17-crypto/cfssl.md) (open): Cloudflare's toolkit for running your own certificate authority.
- [GnuPG](17-crypto/gpg.md) (open): Encrypts and signs files and email with public-key cryptography.
- [hashID](17-crypto/hashid.md) (open): Identifies the type of a hash from its format.
- [OpenSSL](17-crypto/openssl.md) (open): The standard toolkit for TLS, certificates and everyday cryptography.

## Threat intelligence and deception

Sharing what you know, and setting traps.

- [Atomic Red Team](18-intel/atomic-red-team.md) (own): Small, scripted tests mapped to ATT&CK, to check your detection.
- [CALDERA](18-intel/caldera.md) (own): Runs automated, ATT&CK-based adversary emulation for defenders.
- [MISP](18-intel/misp.md) (open): An open-source platform for storing and sharing threat intelligence.
- [OpenCTI](18-intel/opencti.md) (open): Organises threat intelligence into a connected knowledge base.

## Mobile, firmware and hardware

Phones, embedded devices and radios.

- [Apktool](19-mobile-hardware/apktool.md) (own): Unpacks and repacks Android apps to inspect their contents.
- [Flipper Zero](19-mobile-hardware/flipper-zero.md) (own): A portable multi-tool for exploring radio, RFID and hardware.
- [MobSF](19-mobile-hardware/mobsf.md) (own): Analyses mobile apps for security problems, automatically.
- [Proxmark3](19-mobile-hardware/proxmark3.md) (own): A specialist device for researching RFID and NFC systems.
