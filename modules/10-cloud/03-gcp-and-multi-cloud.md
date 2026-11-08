---
title: Google Cloud and multi-cloud
summary: Google Cloud's resource hierarchy and IAM, service account risk, default logging gaps, and a working translation table for staying secure across three providers.
level: intermediate
side: defence
minutes: 40
attack: T1078.004, T1530
needs: 0063-cloud-foundations-and-iam, 10-02-azure-security
pair: 10-02-azure-security
source: Google Cloud Architecture Framework, Security | https://cloud.google.com/architecture/framework/security
words: service account, organisation policy, VPC Service Controls
---
Most concepts carry across clouds, and the differences are where mistakes hide. Google Cloud's model is cleaner in places and has traps of its own, especially around service accounts. This module covers GCP properly, then builds a translation table, so that one security mindset works across all three providers.

@term organisation policy = A Google Cloud rule that limits what can be configured across a hierarchy.
@term VPC Service Controls = A Google Cloud feature that draws a security perimeter around services, to reduce data exfiltration.

## Concept

### Fundamentals: the hierarchy

@flow Organisation > Folders > Projects > Resources

IAM is additive, and it's inherited downward. A grant at the organisation level applies to every project below it. You can't normally take it away lower down, so high-level grants deserve great care. IAM deny policies do exist, for setting hard limits.

**Roles** come in three kinds.

| Kind | Example | Advice |
|---|---|---|
| Basic | Owner, Editor, Viewer | Avoid: far too broad |
| Predefined | `roles/storage.objectViewer` | Default choice |
| Custom | Your own | When predefined is too wide |

### Service accounts

A service account is both an identity and a resource that other identities can act on. Three risks stand out.

**Default service accounts.** Compute Engine's default service account has historically received the Editor role, so an instance could do far more than it needs. Google now lets you [stop that automatic grant](https://cloud.google.com/resource-manager/docs/organization-policy/restricting-service-accounts) with an organisation policy.

**Keys.** A downloaded JSON key is a long-lived secret, and it doesn't expire by default. Disable creation by policy, and use [Workload Identity Federation](/modules/11-05-hybrid-and-workload-identity/).

**Impersonation.** `roles/iam.serviceAccountTokenCreator` lets someone act as a service account. Like AWS's `PassRole`, it can quietly equal high privilege.

### Logging

| Audit log | Default |
|---|---|
| Admin Activity | Always on |
| System Event | Always on |
| Policy Denied | On by default |
| Data Access | **Off for most services** |

So reads of data may not be recorded, unless you enable that. Export logs to a separate project using sinks, with retention locks.

### Guardrails

**Organisation policies** set limits such as "no external IPs", "no service account keys", or "only these domains in IAM". **VPC Service Controls** add a perimeter around APIs, so that a stolen credential can't copy data out to a project outside. **Security Command Center** reports posture and threats.

### Advanced: thinking across clouds

| Concept | AWS | Azure | Google Cloud |
|---|---|---|---|
| Top-level control | Organizations | Management groups | Organisation, folders |
| Isolation unit | Account | Subscription | Project |
| Identity | IAM users, roles | Entra ID | Cloud Identity, IAM |
| Workload identity | Roles | Managed identities | Service accounts |
| Guardrail | SCP | Azure Policy | Organisation policy |
| Control-plane log | CloudTrail | Activity Log | Admin Activity logs |
| Threat detection | GuardDuty | Defender for Cloud | Security Command Center |
| Keys | KMS | Key Vault | Cloud KMS |
| Storage | S3 | Blob Storage | Cloud Storage |

**Multi-cloud has a cost.** Each extra provider means more skills, tooling and ways to go wrong. The attack surface is the union, while your expertise gets divided. Use a CNAPP, or a tool such as Prowler, for a shared view, and keep your identity provider central. Do it for a business reason, not as a security feature.

?? Which Google Cloud logs are off by default for most services?
+ Data Access audit logs
- Admin Activity audit logs
- System Event audit logs
- Policy Denied audit logs
=> Reads of data aren't recorded by default, so you need to enable them before an incident.

## Threat model

Attackers use stolen service account keys, over-broad basic roles, and metadata endpoints on instances, abusing [cloud accounts](https://attack.mitre.org/techniques/T1078/004/) and [storage](https://attack.mitre.org/techniques/T1530/). Compute metadata can give a token for the attached service account, so an application flaw may become cloud access, the same risk as in [AWS](/modules/10-01-aws-attack-paths/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Security Command Center | Posture and threats | The default |
| Policy Analyzer | Answers who can do what | Reviewing IAM |
| IAM Recommender | Trims unused permissions | Least privilege |
| Prowler, ScoutSuite | Multi-cloud audits | A shared view |
| `gcloud` | Everything | Scripting |
| Forseti-style config checks, Config Validator | Policy as code | Guardrails |

## Defence

- **Avoid basic roles.** Use predefined or custom ones.
- **Disable service account key creation,** and default Editor grants, by policy.
- **Use Workload Identity Federation.**
- **Grant at the lowest level** that works.
- **Enable Data Access logs** on sensitive services.
- **Export logs** to a locked project.
- **Use VPC Service Controls** for sensitive data.
- **Require MFA** through your identity provider.

## Pitfalls

- **Assuming AWS habits carry over.** Inheritance and additive IAM behave differently.
- **`allUsers` and `allAuthenticatedUsers`.** The second means anyone with a Google account.
- **Treating service accounts as ordinary resources.** They're identities to protect.
- **Multi-cloud for "resilience" without testing a failover.**
- **Assuming that one benchmark fits all.** Use the CIS guide for each provider.

?? Why avoid downloaded service account keys in Google Cloud?
+ They're long-lived secrets that can easily leak
- They only work inside one Google region
- They expire after sixty minutes of use
- They can't authenticate to any Google API
=> They don't expire by default, and they work from anywhere, so a leaked key is a lasting breach.

## Exercise

::: law Lab only
Use your own free-tier project, with budget alerts on. Delete it when you've finished.
:::

1. Create a project and a custom service account. Grant it one predefined role only.
2. Set the organisation policy that disables key creation, if you have an organisation. Otherwise, write it down.
3. Enable Data Access logs on Cloud Storage. Read an object, then find that log entry.
4. Use Policy Analyzer to answer "who can read this bucket?"
5. Translate one AWS guardrail you've written into Azure Policy and a Google organisation policy.

?! Your company runs mostly on AWS, and a new team wants GCP for its AI services. List your conditions for saying yes.

## Further reading

- [Google Cloud security foundations](https://cloud.google.com/architecture/security-foundations).
- [Cloud Audit Logs](https://cloud.google.com/logging/docs/audit).
- [Best practices for service accounts](https://cloud.google.com/iam/docs/best-practices-service-accounts).
- [VPC Service Controls](https://cloud.google.com/vpc-service-controls/docs/overview).
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks).
