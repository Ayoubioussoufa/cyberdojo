---
title: Supply chain and CI/CD security
summary: Why dependencies and build systems are targets, real cases, SBOMs, signing, least-privilege pipelines and hardened containers.
month: 17
minutes: 55
builds: a pipeline that blocks a critical finding, with an exception path
source: GitHub Actions security hardening | https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
words: SBOM, provenance, supply chain
---
You don't only run your own code. You run hundreds of dependencies, build tools and CI actions. If an attacker compromises one, they reach everyone downstream. That's why OWASP placed Software Supply Chain Failures third in its 2025 list.

@term supply chain attack = Compromising a dependency or build tool to reach its users.
@term SBOM (software bill of materials) = An inventory of the components in a piece of software.
@term provenance = A verifiable record of how and where software was built.
@term SLSA = A framework of levels for supply-chain integrity.
@term Sigstore = A project for signing and verifying software, including the cosign tool.
@term Trivy = A scanner for vulnerabilities in containers, code and configuration.
@term transitive dependency = A package you use indirectly, because something you depend on needs it.
@term typosquatting = Publishing a malicious package under a misspelt popular name.
@term OIDC to cloud = Letting a CI job prove its identity and receive short-lived cloud credentials, with no stored secret.

## Why it's such a good target

Add one library to a project and you may pull in dozens more, because that library has dependencies, and so do they. These are **transitive dependencies**. You didn't choose them or read them, but they run with your application's permissions, and often on your build machine, where the secrets are.

For an attacker, one popular package is worth more than one company. Compromise it once, and every project that updates does the delivery for you.

?? Why do attackers target a popular open-source library rather than one company directly?
+ One compromise reaches every project that uses it
- Open-source code can't be read by any defenders
- Libraries always run without any permissions at all
- Companies never update the libraries they depend on
=> The leverage is the point. Trust flows downstream automatically, and updates distribute the attack.

## What to study

| Case | What happened | The lesson |
|---|---|---|
| [xz-utils](https://openssf.org/blog/2024/03/30/xz-backdoor-cve-2024-3094/), 2024 | A contributor spent years gaining maintainer trust, then hid a backdoor in release files. A developer noticed slower SSH logins | Trust in people is an attack surface, and curiosity catches things |
| tj-actions/changed-files, 2025 | Version tags of a GitHub Action were moved to a malicious commit that exposed CI secrets | Tags can move, so pin by commit |
| Nx and npm worms, 2025 | Malicious package versions stole secrets, and in the Nx case abused AI command-line tools on developer machines to search for them | AI tools on a laptop are powerful and now targeted |

Read how each was found, and what would've limited it.

?? What made the xz-utils attack so unusual?
+ Years of patient trust-building by a new contributor
- A brute-force attack on the project's main password
- A flaw found by an automated code scanner
- A public demand for ransom from the maintainers
=> It was social engineering across years, and it nearly reached stable Linux releases. A curious engineer found it by chance.

## Knowing what you ship

An **SBOM** is an ingredients list. The two main formats are CycloneDX and SPDX. When a new critical flaw appears, you search your SBOMs instead of asking every team. **Provenance** answers another question: where did this build really come from? [SLSA](https://slsa.dev/) defines levels of confidence, and **Sigstore's** cosign lets you sign and verify artifacts.

@range supply

?? A critical flaw is announced in a logging library. How does an SBOM help first?
+ It shows which of your applications contain it
- It automatically patches the affected applications at once
- It blocks all attackers from the logging library
- It proves that the library was never exploited
=> An SBOM answers "are we affected, and where?" in minutes. Fixing comes next.

## Controls

| Control | Protects against |
|---|---|
| Pin dependencies and CI actions by full commit SHA | A tag being moved to bad code |
| Least-privilege CI tokens | A compromised step doing too much |
| OIDC to cloud | Long-lived secrets in CI |
| SBOM | "Are we affected?" taking days |
| Signing and verifying | Tampered artifacts |
| Minimal, non-root images | A bigger blast radius |

Here's what those look like in a GitHub Actions workflow:

```yaml
permissions:
  contents: read            # read-only by default

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      # a full commit SHA, not a tag like @v4
      - uses: actions/checkout@8e5e7e5ab8b370d6c329ec480221332ada57f0ab
```

The SHA above is only an illustration, so look up the current one for yourself. Be careful with workflows that run code from pull requests by strangers. They shouldn't get access to your secrets.

?? Why pin a GitHub Action to a commit SHA rather than a tag like `v3`?
+ A tag can move, a SHA can't
- SHAs make the workflow run much faster
- Tags are not supported in workflow files
- It hides the action from other users
=> In a compromise, tags have been repointed to malicious code. A full SHA identifies one exact commit.

## Hardened containers

A container image is a supply chain of its own. Prefer a minimal base image, so there's less to attack. Don't run as root. Scan with [Trivy](https://trivy.dev/), and pin the base image.

```dockerfile
FROM python:3.13-slim
RUN useradd --create-home app
USER app                     # don't run as root
COPY . /home/app
CMD ["python", "/home/app/main.py"]
```

?? What's the security gain from a minimal base image?
+ Fewer tools and packages for attackers to use
- Containers no longer need any patches at all
- The application automatically becomes free of any bugs
- Attackers can no longer reach the Docker registry
=> Less software means fewer vulnerabilities and fewer tools for someone who gets in. It reduces risk, without removing it.

## Gates people won't route around

A pipeline must block what matters, and also have a documented **exception process**. A gate nobody can bypass legitimately is one that teams will work around.

@flow Commit > Tests and SAST > SCA, secrets, SBOM > Build a minimal image > Sign > Verify at deploy

::: try Build P14
See [project P14](/projects/P14/). Prove that a commit with a planted test secret gets blocked, using a fake value.
:::

::: tip Check what AI suggests
Ask for libraries for a niche task, and verify that each exists before anyone installs it. [Slopsquatting](/guides/d3-using-ai-well/) is real.
:::

?! A critical CVE drops in a popular library. How does an SBOM help you, and what would you do next?
