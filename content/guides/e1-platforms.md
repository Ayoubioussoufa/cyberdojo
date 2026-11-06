---
title: Hands-on platforms
summary: There are hundreds of platforms and you need about six. What to do on each, when, what it costs, and the usual mistake.
group: Practice and projects
minutes: 10
source: OverTheWire, the free starting point | https://overthewire.org/wargames/
---
@term HTB = Hack The Box: a training platform with legal practice machines.
@term CISA = The US Cybersecurity and Infrastructure Security Agency. It publishes advisories and the KEV list of flaws being exploited.
::: key The rule that prevents two wasted years
One platform per objective at a time, finished before the next. Platform-hopping feels productive and teaches almost nothing. A completed path with written notes beats four half-finished subscriptions, every time.
:::

Prices are approximate as of September 2026. Confirm before paying. In the tables below, M6 means Month 6 of your roadmap, and M6–M8 means Months 6 to 8.

| Platform | What to actually do | When | Cost | Common mistake |
|---|---|---|---|---|
| [OverTheWire](https://overthewire.org/wargames/) | Bandit end to end; Natas 0–15 before Burp | M1–M3, M6 | Free | Copying solutions. The struggle is the content |
| [pwn.college](https://pwn.college/) | Linux Luminarium; later modules if you want low-level | M1, optional M16 | Free | Advanced dojos too early |
| [TryHackMe](https://tryhackme.com/) | Pre Security, Cyber Security 101, SOC Level 1 (M9), Jr Penetration Tester (M10), SOC Level 2 and DFIR | M1–M15 | Free tier; Premium ≈ $15–20/mo | Treating room completion as competence |
| [Hack The Box](https://www.hackthebox.com/) | Starting Point, then retired easy/medium machines. Try ≥ 2 h before watching IppSec | M10+ | Free tier; VIP ≈ $14/mo | Walkthroughs first; publishing write-ups of active machines is forbidden |
| [HTB Academy](https://academy.hackthebox.com/) | Job-role paths: SOC Analyst, Penetration Tester, Web Exploitation, AI Red Teamer | M18–M24 | Student ≈ $96/yr; Silver ≈ $490/yr | Buying Gold before you know your track |
| [PortSwigger Academy](https://portswigger.net/web-security) | All Apprentice labs per class, then Practitioner; Web LLM attacks | M8, M17–M20 | Free (BSCP ≈ $99) | Skipping notes: the value is explaining each class |
| [Blue Team Labs Online](https://blueteamlabs.online/) | Guided investigations, then unguided challenges | M9–M15 | Free tier + paid | Doing only the guided ones |
| [CyberDefenders](https://cyberdefenders.org/) | Realistic DFIR and SOC investigations | M9–M16 | Free tier + paid | Starting before Month 9 |
| [LetsDefend](https://letsdefend.io/) | SOC simulator with a live alert queue | M9–M11 | Free tier + paid | Using it as your only blue source |
| [KC7](https://kc7cyber.com/) | Free KQL investigation game | M9 | Free | Underestimating it because it's free |
| [OWASP projects](https://owasp.org/projects/) | Juice Shop and crAPI as targets; ASVS and Cheat Sheets as references | M8–M18 | Free | Reading the summary, not the category pages |
| [ATT&CK](https://attack.mitre.org/) / [ATLAS](https://atlas.mitre.org/) / [D3FEND](https://d3fend.mitre.org/) | Map every detection, report and project to techniques | M9+ | Free | Mapping generously to look thorough |
| NIST / CISA | CSF 2.0 (M1, M12), SP 800-61r3 (M11), SP 800-30 (M12), SP 800-207 (M19), KEV daily (M10+) | Throughout | Free | Treating them as bureaucracy |
| Cloud labs | flAWS 1 & 2, Big IAM Challenge, CloudGoat, Pwned Labs | M13–M14, M19 | Mostly free | No budget alarm: set one before the first deploy |
| GOAD / Ludus | A vulnerable Active Directory estate to attack and detect | M7, M10, M20 | Free (needs RAM) | Never instrumenting it |
| CTFs: [picoCTF](https://picoctf.org/), [CTFtime](https://ctftime.org/) | picoCTF as a gym; one weekend event a month from M6, with a team | M4+ | Free | Chasing points. No write-up, no learning |
| Bug bounty: HackerOne, Bugcrowd, Intigriti, YesWeHack | VDPs first, strictly in scope. The goal is proof of method | M12+ | Free | Expecting money |
| Tools to master | Wireshark, Nmap, Burp, Sysmon, Wazuh/Elastic, Velociraptor, Sigma, Volatility, Ghidra, Semgrep, Trivy, Prowler, garak | Throughout | Free | Collecting tools. Depth in ten beats familiarity with a hundred |
| Repos to read | Atomic Red Team, SigmaHQ, Elastic detection-rules, Impacket, BloodHound, Prowler, capa rules | M11+ | Free | Never opening the source of tools you depend on |

@term CTF (capture the flag) = A security competition where you solve challenges to find hidden text strings called flags.

## If money is tight

- **Months 1–8:** free only: OverTheWire, pwn.college, PortSwigger, TryHackMe free rooms, MDN, NIST and OWASP docs.
- **Months 9–12:** one TryHackMe Premium subscription (SOC Level 1 + Jr Pentester), the highest-value paid month of the roadmap.
- **Months 13–18:** free cloud labs plus CyberDefenders and BTLO free tiers.
- **Months 19–24:** one platform aligned with your track, plus one exam voucher.

?? You finished half a TryHackMe path and a friend recommends HTB. What should you do?
+ Finish the path first, with written notes
- Open both and alternate between them nightly
- Switch now, because HTB is better known
- Subscribe to both so you never lag
=> One platform per objective at a time, finished before the next. Hopping feels productive and teaches almost nothing.

?! Pick the three platforms you'll use in your first six months and say what you'll do on each.
