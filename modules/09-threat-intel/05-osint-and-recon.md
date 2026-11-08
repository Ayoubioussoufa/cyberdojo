---
title: OSINT and your attack surface
summary: What the Internet already says about you. Open-source intelligence, passive reconnaissance, and how defenders use the same sources to find exposure before an attacker does.
level: intermediate
side: both
minutes: 45
attack: T1593, T1596, T1589, T1591
needs: 01-05-dns-in-depth, 03-07-pki-in-depth
pair: 01-07-scanning-in-depth
source: MITRE ATT&CK, Reconnaissance tactic | https://attack.mitre.org/tactics/TA0043/
words: OSINT, passive reconnaissance, attack surface management
---
Before touching a target, an attacker learns a great deal for free: staff names, technology, subdomains, leaked passwords, forgotten servers. None of it sets off an alert on your side, because none of it touches you. So the defender's move is to look first, and shrink what's visible.

@term passive reconnaissance = Collecting information without directly contacting the target's systems.
@term attack surface management = Continuously finding and assessing an organisation's exposed assets.

## Concept

### Fundamentals: passive and active

| Type | Touches the target? | Example |
|---|---|---|
| Passive | No | Reading CT logs, Shodan, LinkedIn |
| Semi-passive | Looks like normal use | Visiting the public website |
| Active | Yes | Port scans, directory brute forcing |

### Sources

| Source | Reveals |
|---|---|
| Certificate logs ([crt.sh](https://crt.sh/)) | Subdomains |
| Passive DNS | Past and present records |
| WHOIS and ASN data | Owners and IP ranges |
| [Shodan](https://www.shodan.io/), [Censys](https://search.censys.io/) | Exposed services, banners, certificates |
| Search engines | Indexed documents and login pages |
| GitHub | Code, sometimes with secrets |
| LinkedIn and job ads | Staff, roles, and the technology in use |
| Wayback Machine | Old pages and endpoints |
| Breach data | Reused passwords |
| Document metadata | Usernames, software, paths |

Job adverts are underrated: "experience with Palo Alto, Okta and Citrix required" gives away the security stack.

**Search operators** such as `site:` and `filetype:` narrow results, and collections of these are often called Google dorks. They turn a search engine into a way of finding exposed documents. Only use them for your own domains, or within scope.

### The process

The intelligence cycle from lesson 66 applies: decide the question, collect, verify, analyse, and report. **Verification is what separates OSINT from gossip**: confirm each fact from an independent source. Tools produce leads, and a person draws the conclusion. Bellingcat's public investigations show how far careful open-source work can go.

### Advanced: from recon to exposure management

Attackers scan continuously, so a yearly review is out of date within hours. **External attack surface management** does the same from the defender's side, and repeatedly:

@flow Discover assets > Identify owners > Assess exposure > Prioritise > Fix > Repeat

The usual findings are forgotten subdomains, test servers, cloud buckets, and acquired companies' infrastructure. [Dangling DNS records](/modules/01-05-dns-in-depth/) and old admin panels are common. CISA's [Binding Operational Directive 23-01](https://www.cisa.gov/news-events/directives/binding-operational-directive-23-01) requires US federal agencies to inventory assets for this reason.

**Git history** deserves its own mention. A secret removed in a later commit stays in history, and public commits get scanned within minutes by bots.

**Ethics and privacy.** Public doesn't mean free of duties. Profiling an individual, even legally, can raise legal and ethical problems, especially under GDPR, and aggregating harmless facts can produce something harmful. Stay on the organisation, stick to scope, and don't touch breach data containing other people's passwords unless you have a lawful reason. Using a stolen credential is unauthorised access, however you found it.

?? Why is reading certificate transparency logs considered passive?
+ You never touch the target's own systems
- The target gives written permission every time
- The logs are hosted by national police
- The search is encrypted end to end
=> The data sits on public logs, so nothing reaches the target and no alert fires.

## Threat model

This is ATT&CK's Reconnaissance tactic.

| Activity | ATT&CK |
|---|---|
| Searching websites and social media | [T1593](https://attack.mitre.org/techniques/T1593/) |
| Searching technical databases | [T1596](https://attack.mitre.org/techniques/T1596/) |
| Gathering identity information | [T1589](https://attack.mitre.org/techniques/T1589/) |
| Gathering business information | [T1591](https://attack.mitre.org/techniques/T1591/) |

You usually can't detect passive recon, so the only response is to reduce what it finds.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| theHarvester | Gathers emails and subdomains | A first pass on your own domain |
| Amass, subfinder | Enumerate subdomains | Asset discovery |
| Shodan, Censys | Search exposed services | Checking your IP ranges |
| Maltego | Graphs relationships | Linking findings |
| SpiderFoot | Automates many sources | Broad sweeps |
| recon-ng | Modular recon framework | Scripted workflows |
| ExifTool | Reads metadata | Checking your own documents |
| TruffleHog, gitleaks | Find secrets in repositories | Your own organisation's code |

## Defence

- **Do it to yourself** on a schedule. Treat results as findings with owners.
- **Keep an asset inventory,** and compare with what's discovered.
- **Monitor** CT logs and Shodan alerts for your ranges.
- **Scan repositories** and enable push protection.
- **Monitor breach data** for your domain, and reset exposed passwords.
- **Strip metadata** from published documents.
- **Think about job ads and staff pages.** Share only what the business needs.
- **Close dangling records,** and retire forgotten sites.

## Pitfalls

- **Treating tool output as truth.** Verify, as stale data is common.
- **Going active by accident.** Some "recon" tools touch the target.
- **Testing a found password.** That's access, and possibly a crime.
- **Scope creep.** An acquired company may not be in scope.
- **Forgetting people.** Technical assets get reviewed, whereas staff exposure doesn't.

?? What's the best reason to run OSINT against your own company?
+ You see what attackers can find first
- You can then ignore your internal assets
- You prove that no data has leaked
- You replace the need for penetration tests
=> It reveals your exposure as an outsider sees it, so you can fix it before anyone uses it.

## Exercise

::: law Lab only
Investigate only a domain you own, or one you have written permission for. Don't use leaked credentials, and don't profile private individuals.
:::

1. Use `crt.sh` on a domain you own. List every subdomain, and check each one's still needed.
2. Search your own public IP on Shodan or Censys.
3. Run `theHarvester` on your domain, and compare the results with what you expected.
4. Run ExifTool on three of your own published PDFs or images.
5. Scan your GitHub account with `gitleaks`, including the full history.
6. Write a one-page exposure report with owners and fixes.

?! You find a test server of your employer on Shodan, with an admin panel open. Write what you'd do, in order. Who do you tell, and what don't you do?

## Further reading

- [ATT&CK Reconnaissance](https://attack.mitre.org/tactics/TA0043/).
- [OSINT Framework](https://osintframework.com/).
- [Bellingcat's Online Investigation Toolkit](https://bellingcat.gitbook.io/toolkit).
- [CISA BOD 23-01](https://www.cisa.gov/news-events/directives/binding-operational-directive-23-01).
- Michael Bazzell, *OSINT Techniques*.
