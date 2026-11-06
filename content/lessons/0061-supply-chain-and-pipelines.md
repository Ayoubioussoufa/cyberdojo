---
title: Supply chain and CI/CD security
summary: Why dependencies and build systems are targets, SBOMs, signing, least-privilege pipelines and hardened containers.
month: 17
minutes: 35
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

## What to study

The roadmap names real cases: the [xz-utils backdoor](https://openssf.org/blog/2024/03/30/xz-backdoor-cve-2024-3094/) in 2024, and the tj-actions compromise in 2025. Read how each was found, and what would've limited it.

## Controls

| Control | Protects against |
|---|---|
| Pin dependencies and CI actions by full commit SHA | A tag being moved to bad code |
| Least-privilege CI tokens | A compromised step doing too much |
| OIDC to cloud | Long-lived secrets in CI |
| SBOM | "Are we affected?" taking days |
| Signing and verifying | Tampered artifacts |
| Minimal, non-root images | A bigger blast radius |

?? Why pin a GitHub Action to a commit SHA rather than a tag like `v3`?
+ A tag can move, a SHA can't
- SHAs make the workflow run much faster
- Tags are not supported in workflow files
- It hides the action from other users
=> In a compromise, tags have been repointed to malicious code. A full SHA identifies one exact commit.

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
