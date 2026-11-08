---
title: Dependency risk
summary: Most of your code was written by strangers. How dependencies get compromised, what Log4Shell, SolarWinds and xz taught everyone, and the controls that reduce the risk.
level: intermediate
side: defence
minutes: 50
attack: T1195.001, T1195.002
needs: 0069-supply-chain-and-pipelines
pair: 13-02-cicd-attacks
source: OWASP A03:2025 Software Supply Chain Failures | https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/
words: typosquatting, dependency confusion, transitive dependency
---
A modern application is mostly other people's code. One `npm install` can pull in hundreds of packages, from maintainers you'll never meet. OWASP moved Software Supply Chain Failures to third place in its 2025 list for good reason: attacking one popular component reaches thousands of victims at once. Lesson 69 gave you the first view. This module goes deeper into how the trust fails.

@term dependency confusion = Tricking a build into fetching a public package instead of a private one of the same name.

## Concept

### Fundamentals: where trust sits

Each dependency is a decision to run someone's code, with your privileges, often at install time. You trust the author, everyone they gave publish rights to, their account security, the registry, and everything they depend on. **Transitive dependencies** multiply this, and most teams can't name theirs.

### The failure patterns

| Pattern | What happens | Example |
|---|---|---|
| Vulnerable component | A flaw in a library that you use | Log4Shell, 2021 |
| Typosquatting | A similar name catches a mistake | Many npm and PyPI cases |
| Dependency confusion | Public beats private in resolution | [Birsan's 2021 research](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610) |
| Maintainer takeover | An account is stolen or handed over | [event-stream, 2018](https://blog.npmjs.org/post/180565383195/details-about-the-event-stream-incident) |
| Long-term infiltration | A trusted contributor is the attacker | [xz, 2024](https://www.openwall.com/lists/oss-security/2024/03/29/4) |
| Build compromise | Clean source, poisoned build | SolarWinds, 2020 |
| Install scripts | Code runs during `install` | Common in npm |

### Three case studies

**Log4Shell** (CVE-2021-44228) showed the inventory problem. Log4j was buried deep in countless products. A flaw in how it handled logged strings let attackers cause remote code execution, and the first question for most companies was "do we even use it?" That's what an [SBOM](/courses/0069-supply-chain-and-pipelines/) is meant to answer.

**SolarWinds** showed the build problem. Attackers inserted code during the build of Orion, so customers received a validly signed update containing a backdoor. Reviewing source code wouldn't have helped. That's [the CI/CD problem](/modules/13-02-cicd-attacks/).

**xz** showed the human problem. An attacker spent about two years earning maintainer trust from an overworked volunteer, then hid a backdoor in release tarballs, aimed at OpenSSH on some Linux systems. A Microsoft engineer, Andres Freund, noticed a small slowdown in SSH, and caught it before it reached stable releases. It was close.

### Advanced: why this is hard

**Reachability.** A scanner reports every CVE in your tree, yet many are in code that you never call. Reachability analysis and **VEX** statements reduce the noise.

**Pinning and updates pull in opposite directions.** Pinning stops surprise changes, yet leaves you on known bugs. So pin with hashes, then update on purpose, with automation and tests.

**Maintainer burnout is a security issue.** Critical packages may have one unpaid person behind them. Funding and support, through efforts like the [OpenSSF](https://openssf.org/), matter.

**AI coding assistants** add a new angle: they can suggest package names that don't exist, and attackers can register those names. It's nicknamed "slopsquatting". Check that a suggested package is real and established.

?? What makes dependency confusion possible?
+ Build tools may prefer a public package
- Private registries share their passwords with npm
- Lockfiles always pull the newest available version
- Package names can't contain a company name
=> If a resolver checks a public registry for an internal name and finds a higher version, it may install the wrong one.

## Threat model

| Technique | ATT&CK |
|---|---|
| Compromising dependencies and tools | [T1195.001](https://attack.mitre.org/techniques/T1195/001/) |
| Compromising the software supply chain | [T1195.002](https://attack.mitre.org/techniques/T1195/002/) |

The impact is unusually wide: code runs inside trusted builds, developer laptops and production, and often it can reach secrets. Developer machines are a prime target, since install scripts run there with the developer's rights.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Syft, CycloneDX tools | Produce SBOMs | Knowing what you ship |
| Trivy, Grype, OSV-Scanner | Match to known flaws | Scanning |
| Dependabot, Renovate | Automate updates | Staying current |
| [OpenSSF Scorecard](https://scorecard.dev/) | Rates a project's practices | Choosing a package |
| [deps.dev](https://deps.dev/) | Shows dependency graphs | Investigating a package |
| Private registries (Artifactory, Nexus) | Curate packages | Enterprise control |

## Defence

- **Use lockfiles** with integrity hashes, and fail builds if they don't match.
- **Reserve your internal names,** and scope packages. Configure registries so that private names resolve privately.
- **Disable install scripts** where you can (`npm ci --ignore-scripts`).
- **Generate an SBOM** for each release.
- **Choose dependencies deliberately.** Check maintainers, activity and Scorecard. A small utility may not be worth the risk.
- **Delay new versions** by a few days, since many malicious releases get caught quickly.
- **Limit secrets** on developer machines and in builds.
- **Prepare to answer "are we affected?"** within an hour.

## Pitfalls

- **"It's open source, so people have checked it."** Often nobody has.
- **Treating every CVE equally.** Use reachability, EPSS and KEV.
- **Pinning forever.** Unpatched pins are a risk too.
- **Scanning only direct dependencies.**
- **Vendoring and forgetting.** A copied library gets no updates.
- **Trusting a package because an AI suggested it.**

?? What does a lockfile with hashes protect against?
+ A different file arriving for one version
- A vulnerability in the pinned version itself
- A developer reading the wrong package documentation
- A malicious maintainer of the original release
=> The hash ensures that you get exactly what you reviewed. It says nothing about whether that version is safe.

## Exercise

::: law Lab only
Use your own projects. Never publish a test package using another company's internal name, and don't upload malicious packages, even as research.
:::

1. Run `npm ls --all | wc -l` or `pip list` in one of your projects. How many packages are there? How many did you choose?
2. Generate an SBOM with Syft, then scan it using Grype.
3. Pick one finding. Is the vulnerable function reachable from your code?
4. Run OpenSSF Scorecard on two dependencies, and compare them.
5. In a lab, set up a private registry and show how a resolver picks a version. Fix the configuration so that the internal name can't come from the public registry.

?! A critical flaw in a logging library is announced at 18:00 on a Friday. Write how you'd find out whether you're affected, and how fast. What must exist beforehand?

## Further reading

- [OWASP A03:2025](https://top10.owasp.org/2025/A03_2025-Software_Supply_Chain_Failures/).
- [Dependency Confusion](https://medium.com/@alex.birsan/dependency-confusion-4a5d60fec610).
- [The xz disclosure](https://www.openwall.com/lists/oss-security/2024/03/29/4).
- [OpenSSF Concise Guide](https://best.openssf.org/Concise-Guide-for-Evaluating-Open-Source-Software).
- [CISA on Log4j](https://www.cisa.gov/news-events/cybersecurity-advisories/aa21-356a).
