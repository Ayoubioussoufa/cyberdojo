---
title: CI/CD pipeline security
summary: Your pipeline can read your code, hold your secrets and deploy to production, which makes it a top target. Its failure patterns, and how to harden runners, workflows and credentials.
level: advanced
side: defence
minutes: 45
attack: T1195.002, T1552.001
needs: 0069-supply-chain-and-pipelines, 13-01-dependency-attacks
pair: 13-01-dependency-attacks, 11-05-hybrid-and-workload-identity, 13-03-slsa-and-maturity
source: OWASP Top 10 CI/CD Security Risks | https://owasp.org/www-project-top-10-ci-cd-security-risks/
words: poisoned pipeline execution, runner, pinning
---
A CI/CD system is effectively a remote code execution service with production credentials, triggered by anyone who can open a pull request. Treat it as a build tool and you'll under-defend it. Treat it as a production system with high privileges, and everything here follows.

@term CI/CD runner = The machine that executes pipeline jobs.
@term poisoned pipeline execution = Getting a pipeline to run attacker-controlled instructions, by changing what it reads.

## Concept

### Fundamentals: why pipelines are a target

A pipeline usually holds what everyone wants: cloud credentials, signing keys and publish tokens. It runs arbitrary code by design, often with internet access. And its output is trusted downstream, so a compromise spreads to every customer. The [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/) lists the common failures, including insufficient flow control, poisoned pipeline execution, and third-party services.

### Trust boundaries in a pipeline

| Input | Trusted? |
|---|---|
| Code on a protected branch | After review |
| Pull request from a fork | **No** |
| Issue titles, branch names, commit messages | **No**: they can be injected into scripts |
| Third-party actions and plugins | Only as far as you've verified them |
| Build tool config in the repo | Same as the code that changed it |

The central rule: **untrusted input must never run with secrets**.

### The classic mistakes

**Poisoned pipeline execution.** If a pipeline reads its instructions from the repository, then whoever changes those files changes what runs. So a pull request can modify a `Makefile` or a test script, and that runs in CI.

**`pull_request_target` on GitHub Actions.** This trigger runs in the context of the base repository, with its secrets, and was built for things like labelling. If a workflow also checks out the PR's code and runs it, then untrusted code runs with secrets. [GitHub Security Lab](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/) calls these "pwn requests".

**Script injection.** Interpolating a value such as a pull request's title straight into a shell step treats data as code, the same root cause as SQL injection.

**Mutable tags.** `uses: some/action@v3` follows a tag that its owner can move. In March 2025, the widely used [tj-actions/changed-files](https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction) action was compromised, with tags repointed to code that dumped secrets into build logs.

### Advanced: runners and credentials

**Self-hosted runners** are dangerous on public repositories: code from a fork can persist on the machine and attack later jobs. Use ephemeral runners, one job each, on isolated networks.

**Secrets.** Long-lived cloud keys in CI are a top risk. [OIDC federation](/modules/11-05-hybrid-and-workload-identity/) replaces them with short-lived tokens. Scope secrets to protected environments, with required reviewers.

**Build integrity.** A compromised build can produce a signed malicious artifact, as SolarWinds did. **Hermetic builds** reduce outside influence, and [provenance](/modules/13-03-slsa-and-maturity/) records what happened. [Reproducible builds](https://reproducible-builds.org/) let anyone check that a binary really came from its source.

**Pipelines as lateral movement.** Developers' tokens often have wide rights. In the 2021 [Codecov incident](https://about.codecov.io/security-update/), a modified script exported environment variables from customers' CI, showing how one tool could reach many pipelines.

?? Why should third-party actions be pinned to a commit hash?
+ Tags can be moved to malicious code
- Hashes make the pipeline run much faster
- Tags only work on private repositories today
- Commit hashes encrypt every secret in logs
=> A commit hash is immutable, whereas a tag can be repointed by anyone with write access.

## Threat model

Attackers may come through a pull request, a stolen developer token, a compromised action or plugin, or an exposed CI server. Their goals are secrets ([T1552.001](https://attack.mitre.org/techniques/T1552/001/)), and tampering with what ships ([T1195.002](https://attack.mitre.org/techniques/T1195/002/)).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| zizmor | Audits GitHub Actions workflows | Reviewing workflow files |
| Poutine, Legitify | Scan CI configurations | Organisation-wide checks |
| StepSecurity Harden-Runner | Monitors runner egress | Watching build behaviour |
| gitleaks | Finds secrets | Pre-commit and CI |
| Dependabot for actions | Updates pinned hashes | Keeping pins current |
| Cosign | Signs artifacts | Proving origin |

## Defence

- **Set `permissions:` to minimal** in each workflow, with read-only as the default.
- **Pin third-party actions to full commit hashes.**
- **Never run untrusted code with secrets.** Avoid checking out PR code under `pull_request_target`.
- **Pass untrusted values through environment variables,** not by direct interpolation.
- **Require reviews** and branch protection for `main`, workflow files, and environments.
- **Use OIDC** rather than stored cloud keys.
- **Use ephemeral runners,** with restricted egress.
- **Log pipeline runs** to your SIEM, and alert on changes to workflow files, new secrets and unusual destinations.

## Pitfalls

- **"Only our team can push."** Forks, tokens and dependencies can all reach the pipeline.
- **Secrets masked in logs.** Masking is a convenience. A script can encode a secret past it.
- **Self-hosted runners on public repositories.**
- **Treating CI config as boring.** It's production code with credentials.
- **A shared long-lived deploy key** across all your repositories.

?? What makes `pull_request_target` risky with untrusted code?
+ It runs with the target repository's secrets
- It disables branch protection on main branches
- It deletes each contributor's fork after running
- It publishes a release for every comment
=> The trigger runs with base repository privileges, so checking out and executing PR code hands those to the contributor.

## Exercise

::: law Lab only
Use your own repositories. Don't submit test pull requests to other people's projects, and never try to extract secrets from a project you don't own.
:::

1. Audit one of your GitHub workflows with [zizmor](https://docs.zizmor.sh/). Fix each finding that you understand.
2. Set top-level `permissions: {}`, and grant only what each job needs.
3. Pin every third-party action to a commit hash, and add Dependabot for actions.
4. In a throwaway private repo, create a workflow that interpolates a PR title into a shell step. Explain the risk, then fix it using an environment variable.
5. Replace a stored cloud key with OIDC, as in [Hybrid and workload identity](/modules/11-05-hybrid-and-workload-identity/).

?! Your CI system is breached, and all repository secrets may be exposed. List what you'd do in the first hours, in order.

## Further reading

- [OWASP Top 10 CI/CD Security Risks](https://owasp.org/www-project-top-10-ci-cd-security-risks/).
- [GitHub Actions security hardening](https://docs.github.com/en/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions).
- [Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/).
- [CISA on the tj-actions compromise](https://www.cisa.gov/news-events/alerts/2025/03/18/supply-chain-compromise-third-party-tj-actionschanged-files-cve-2025-30066-and-reviewdogaction).
- [Reproducible Builds](https://reproducible-builds.org/).
