---
title: SLSA, SSDF and maturity models
summary: How to prove that software is what it claims to be. SLSA provenance, signing, SBOM formats, VEX, and the SSDF, SAMM and BSIMM models for measuring a whole programme.
level: intermediate
side: defence
minutes: 45
attack: T1195
needs: 0069-supply-chain-and-pipelines, 0068-threat-modeling-and-secure-sdlc
pair: 13-02-cicd-attacks
source: SLSA specification | https://slsa.dev/spec/
words: provenance, SSDF, maturity model
---
Customers and regulators now ask questions that "trust us" can't answer. Where was this built? From what? Who approved it? Are you affected by this flaw? This module covers the frameworks that make those answers verifiable, and the models that help a company improve its whole software security programme.

@term VEX = Vulnerability Exploitability eXchange: a statement of whether a known flaw actually affects a product.
@term maturity model = A framework that describes stages of capability, so that an organisation can measure and improve.

## Concept

### Fundamentals: three questions about an artifact

| Question | Answered by |
|---|---|
| What's in it? | SBOM |
| How was it made? | Provenance |
| Who vouches for it? | Signature |
| Are its flaws relevant? | VEX |

### SLSA

[SLSA](https://slsa.dev/) ("salsa"), Supply-chain Levels for Software Artifacts, sets rising requirements for build integrity. The Build track has these levels:

| Level | Requirement | Protects against |
|---|---|---|
| Build L0 | Nothing | Nothing |
| Build L1 | Provenance exists | Mistakes, and unclear origin |
| Build L2 | Signed provenance from a hosted build | Tampering after the build |
| Build L3 | Hardened, isolated build platform | Tampering during the build |

Provenance is an attestation, usually in the [in-toto](https://in-toto.io/) format. It says which source commit, builder and parameters produced an artifact, so a consumer can verify that it came from the expected repository. It's aimed at the SolarWinds class of problem.

### Signing

**Sigstore** made signing practical. Rather than guarding a long-lived key, `cosign` uses short-lived certificates tied to an OIDC identity, and records signatures in a public transparency log called Rekor. A verifier checks *who* signed, not just *which key*. Project P14 used this. Package registries increasingly support it: npm provenance, for instance, links a package to the workflow that built it.

### SBOM formats

**SPDX** and **CycloneDX** are the two main formats. An SBOM is only useful if it's accurate, machine-readable and kept with each release. **VEX** adds the missing half: a scanner may list 200 CVEs, and VEX says which ones are *not affected*, and why. That saves customers from a lot of wasted effort.

### Advanced: measuring the programme

**[NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) (SP 800-218)** lists practices in four groups: prepare the organisation, protect the software, produce well-secured software, and respond to vulnerabilities. It's a common reference for what "secure development" means, and US government buyers have asked vendors to attest to it.

| Model | Approach | Use it for |
|---|---|---|
| [OWASP SAMM](https://owaspsamm.org/) | Prescriptive, with maturity levels per practice | Planning improvement |
| [BSIMM](https://www.blackduck.com/services/security-program/bsimm-maturity-model.html) | Descriptive: observes what real firms do | Benchmarking |
| SSDF | A list of practices | Compliance and contracts |
| SLSA | Build integrity levels | Supply chain goals |

**SAMM** asks where you are, and gives a roadmap for five business functions: governance, design, implementation, verification and operations. **BSIMM** reports what many firms are actually doing, so it tells you what's common, not what's right.

**Using them.** Assess honestly, pick two or three practices, improve, and reassess. A maturity score isn't the goal. Reduced flaws and faster fixes are. And the [Cyber Resilience Act](/modules/12-05-eu-regulation/) is turning much of this from good practice into a legal duty for those selling in the EU.

?? What does SLSA provenance tell a consumer?
+ Where and how an artifact was built
- Who wrote each line of the code
- Which customers use this package in production
- How fast the software runs under load
=> Provenance is about the build: source, builder and parameters, signed so that it can be verified later.

## Threat model

These controls answer [T1195](https://attack.mitre.org/techniques/T1195/) from the consumer's side: was the package I received built from the source I expect? They don't prove that the source is safe. The xz backdoor would have passed some checks, since the attacker was an accepted maintainer, which is why review and maintainer health still matter. Attestations must be verified at the point of use, or they're just files.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `cosign` | Signs and verifies | Containers and blobs |
| `slsa-verifier` | Checks provenance | Consuming artifacts |
| SLSA GitHub Generator | Produces provenance | GitHub builds |
| Syft, `cdxgen` | Generate SBOMs | Every build |
| Dependency-Track | Monitors SBOMs | Ongoing tracking |
| OpenVEX tools | Write VEX statements | Reducing noise for users |

## Defence

- **Generate SBOM and provenance in the pipeline,** automatically.
- **Sign releases,** and publish how to verify them.
- **Verify at deploy time.** An admission controller can reject unsigned images.
- **Publish VEX** for customers.
- **Choose one maturity model,** and assess yearly.
- **Set a target,** such as Build L2 this year.

## Pitfalls

- **Generating an SBOM nobody reads.** Feed it into monitoring.
- **Signing without verifying.** A signature that's never checked protects nothing.
- **Treating provenance as proof of safety.** It proves origin.
- **Chasing a maturity score.**
- **Confusing SLSA with SOC 2.** One is about build integrity, the other about organisational controls.

?? What's the key difference between SAMM and BSIMM?
+ SAMM prescribes goals, and BSIMM observes practice
- SAMM covers hardware, and BSIMM covers software
- SAMM is a law, and BSIMM guidance
- SAMM requires payment, and BSIMM forbids audits
=> SAMM tells you what to aim for, whereas BSIMM reports what firms actually do.

## Exercise

::: law Lab only
Use your own repositories and images. Don't publish test artifacts under another project's name.
:::

1. Sign a container image with keyless `cosign` in a GitHub Action. Verify it, stating the expected identity.
2. Use the SLSA generator to produce provenance for a small release. Verify it with `slsa-verifier`.
3. Generate SPDX and CycloneDX SBOMs for the same image, and compare them.
4. Write a VEX statement for one CVE that doesn't affect your project.
5. Take a SAMM self-assessment for a project that you know, and choose two improvements.

?! A customer's security questionnaire asks "how do you ensure the integrity of your builds?" Write an honest three-sentence answer for a small team, and say what you'd improve next.

## Further reading

- [SLSA](https://slsa.dev/spec/).
- [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final).
- [Sigstore documentation](https://docs.sigstore.dev/).
- [OWASP SAMM](https://owaspsamm.org/).
- [CISA SBOM resources](https://www.cisa.gov/sbom).
