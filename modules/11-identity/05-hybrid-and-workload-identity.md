---
title: Hybrid and workload identity
summary: Joining on-premises directories to the cloud, enforcing Conditional Access, and giving software its own identity, so that no long-lived secret is left for anyone to steal.
level: advanced
side: defence
minutes: 45
attack: T1078.004, T1098.001
needs: 0045-attacking-and-defending-identity, 0063-cloud-foundations-and-iam
pair: 11-02-authentication-mechanics, 07-07-zero-trust-in-depth, 13-02-cicd-attacks
source: Microsoft, Conditional Access overview | https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview
words: Conditional Access, service principal, workload identity
---
Most large organisations straddle two worlds: an old Active Directory, and a cloud identity platform. Whatever joins them is a bridge in both directions. Meanwhile, machines now outnumber people, and each one needs an identity too. This module covers the two fastest-moving parts of identity security.

@term workload identity = An identity given to software, rather than to a person.
@term non-human identity = Any account, key or token used by software.

## Concept

### Fundamentals: hybrid identity

**Microsoft Entra Connect** syncs users from on-premises AD to Entra ID. Three sign-in designs exist.

| Method | Password checked | Trade-off |
|---|---|---|
| Password hash sync | In Entra, using a hash of the hash | Simple and resilient, and Microsoft's usual advice |
| Pass-through authentication | On premises, by an agent | Depends on local agents |
| Federation (AD FS) | On premises | Most complex, and [its keys are critical](/modules/11-04-saml-attacks/) |

The sync server holds a powerful account, so it's **Tier 0**: if it falls, both directories may follow. Separating cloud admins from on-premises accounts is key: cloud-only admin accounts stop an on-premises compromise from climbing straight into the tenant. CISA's [advisory on SVR cloud access](https://www.cisa.gov/news-events/cybersecurity-advisories/aa24-057a) shows how much attention capable actors now give to cloud identity.

### Conditional Access

**Conditional Access** is Entra's policy engine, and a practical [policy decision point](/modules/07-07-zero-trust-in-depth/). A policy reads signals (user, group, device, location, app, risk), and returns a decision (block, or grant with requirements).

```
IF   user in "Admins" AND app = "Azure management"
THEN require phishing-resistant MFA AND a compliant device
```

Common gaps: legacy protocols that skip it, excluded "temporary" accounts, and policies in report-only mode forever. Keep two **break-glass accounts**, excluded and heavily monitored, for when a policy locks everyone out.

### Non-human identities

Service accounts, API keys, tokens, and service principals often have broad rights, no MFA, and no owner. They seldom expire. Service principals with leaked credentials bypass user-focused controls, and stay active through a staff change. [T1098.001](https://attack.mitre.org/techniques/T1098/001/) adds credentials to such an app for persistence, which is a common step in cloud intrusions.

### Advanced: removing the secret

The best secret is the one that doesn't exist. **Workload identity** lets software prove what it is from where it runs.

| Platform | Mechanism |
|---|---|
| AWS | IAM roles for EC2, EKS Pod Identity |
| Azure | Managed identities |
| Google Cloud | Workload Identity Federation |
| Kubernetes | Projected service account tokens |
| Anywhere | [SPIFFE and SPIRE](https://spiffe.io/) |

**OIDC federation for CI/CD** is the pattern to know. GitHub Actions gets a short-lived OIDC token that says "this repo, this branch". The cloud trusts that issuer, and exchanges it for temporary credentials. No access key sits in repository secrets. Restrict the trust policy tightly, by repository and branch, or a different repository could use the role. See [CI/CD attacks](/modules/13-02-cicd-attacks/).

**SPIFFE** standardises workload identity across platforms: each workload gets a short-lived identity document, and a [service mesh](/modules/07-07-zero-trust-in-depth/) can use that for mTLS.

?? Why is an Entra Connect server treated as Tier 0?
+ Its sync account can reach both directories
- It stores every employee's mail on disk
- It routes all Internet traffic for users
- It issues the company's public TLS certificates
=> Compromise there can cross from on-premises into the cloud, so it needs domain-controller-level protection.

## Threat model

| Technique | ATT&CK |
|---|---|
| Abusing cloud accounts | [T1078.004](https://attack.mitre.org/techniques/T1078/004/) |
| Adding cloud credentials | [T1098.001](https://attack.mitre.org/techniques/T1098/001/) |

Attackers move between identity planes: on-premises to cloud, user to service principal, CI pipeline to production. Each bridge needs its own controls.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Entra sign-in and audit logs | Evidence | All investigation |
| Conditional Access What If | Tests policies | Before enforcing |
| [Maester](https://maester.dev/) | Automated Entra checks | Testing your tenant |
| ROADtools, AzureHound | Map Entra | Authorised reviews |
| SPIRE | Issues SPIFFE IDs | Multi-platform workloads |
| Cloud IAM analysers | Find unused permissions | Least privilege |

## Defence

- **Separate cloud admins** from on-premises accounts.
- **Protect sync servers** as Tier 0.
- **Require phishing-resistant MFA and compliant devices** for admins.
- **Block legacy authentication.**
- **Inventory non-human identities,** with owners and expiry.
- **Replace keys with workload identity** wherever you can.
- **Monitor** new app credentials, consent grants, new federation trusts and role assignments.
- **Keep break-glass accounts,** tested, with alerts on any use.

## Pitfalls

- **"Temporary" exclusions that last for years.**
- **Report-only policies.** They enforce nothing.
- **Federating GitHub with a loose trust policy.** Any repo in the organisation could then assume the role.
- **Forgetting service principals in access reviews.** They hold real privileges.
- **Syncing privileged on-premises accounts to the cloud.**

?? What does OIDC federation remove from a CI pipeline?
+ Long-lived cloud access keys in its secrets
- Every build step that runs a test
- All logging from the cloud provider's side
- The need for any source code review
=> The pipeline gets a short-lived credential on each run, so there's no static key for an attacker to steal.

## Exercise

::: law Lab only
Use a free test tenant or your own cloud account. Set billing alerts, and don't test identity paths in an employer's tenant without approval.
:::

1. In an Entra test tenant, create a Conditional Access policy in report-only mode for one test user. Use What If to check it.
2. Create an app registration, and find its credentials in the audit log.
3. Set up GitHub Actions OIDC to assume an AWS role in your account, with the trust restricted to one repository and branch. Confirm that another branch fails.
4. List every long-lived key in your own account, and plan to retire them.
5. Run Maester against the test tenant, and read three failures.

?! Your organisation has 12,000 service accounts and no owners. Write the first 90 days of your plan.

## Further reading

- [Conditional Access overview](https://learn.microsoft.com/en-us/entra/identity/conditional-access/overview).
- [Protecting Microsoft 365 from on-premises attacks](https://learn.microsoft.com/en-us/entra/architecture/protect-m365-from-on-premises-attacks).
- [GitHub Actions OIDC](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect).
- [SPIFFE](https://spiffe.io/docs/latest/spiffe-about/overview/).
- [OWASP Non-Human Identities Top 10](https://owasp.org/www-project-non-human-identities-top-10/).
