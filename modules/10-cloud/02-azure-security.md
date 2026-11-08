---
title: Azure security
summary: Azure has two permission systems, and mixing them up causes real exposure. Tenants, subscriptions, RBAC, managed identities, storage tokens, and the logs that matter.
level: intermediate
side: defence
minutes: 45
attack: T1078.004, T1098.003
needs: 0064-cloud-detection-and-posture, 11-05-hybrid-and-workload-identity
pair: 10-03-gcp-and-multi-cloud
source: Microsoft Cloud Security Benchmark | https://learn.microsoft.com/en-us/security/benchmark/azure/overview
words: Entra role, Azure RBAC, managed identity
---
If you know AWS, then Azure looks familiar until the moment it doesn't. Its identity sits in a separate service, Entra ID, which also runs Microsoft 365. So one tenant holds your email, your documents and your cloud. A mistake in identity can therefore reach everything.

@term subscription = A billing and resource container in Azure.
@term management group = A level above subscriptions, used to apply policy across many of them.
@term shared access signature = A signed URL that grants limited access to Azure Storage.

## Concept

### Fundamentals: the hierarchy

@flow Tenant > Management groups > Subscriptions > Resource groups > Resources

Policies and role assignments inherit downward, so a role at a high level reaches everything beneath. That's the main thing to get right.

### Two permission systems

| | Entra roles | Azure RBAC |
|---|---|---|
| Controls | Identity: users, groups, apps | Resources: VMs, storage, networks |
| Example | Global Administrator | Owner, Contributor, Reader |
| Scope | Tenant | Management group down to resource |

They're separate, yet linked. A **Global Administrator** can [elevate access](https://learn.microsoft.com/en-us/azure/role-based-access-control/elevate-access-global-admin) to all subscriptions, so that role must be rare. Microsoft recommends fewer than five. **Owner** can grant roles, whereas **Contributor** can do nearly everything but that, which is still a great deal, including running commands on VMs.

**Privileged Identity Management** makes roles eligible rather than permanent: an admin activates a role when needed, with approval, MFA, and a time limit.

### Identities for software

A **service principal** is an app's identity. If it uses a client secret or certificate, then that's a credential to protect. A **managed identity** has no credential to handle: Azure issues tokens to the workload itself, through a local metadata endpoint. Prefer that wherever you can.

Risk stays with what the identity may do. If a VM's managed identity holds Contributor on a subscription, then anyone who gets code execution on that VM holds it as well.

### Storage and secrets

**Shared access signatures** are signed URLs that give access to storage. A long-lived SAS with broad rights is effectively a password in a URL. In 2023, Microsoft AI researchers [accidentally exposed](https://msrc.microsoft.com/blog/2023/09/microsoft-mitigated-exposure-of-internal-information-in-a-storage-account-due-to-overly-permissive-sas-token/) 38 TB of internal data through one overly permissive SAS token on GitHub. Prefer user delegation SAS, backed by Entra, with short lifetimes.

**Key Vault** stores secrets, keys and certificates. Enable soft delete and purge protection.

### Advanced: logging and posture

| Log | Records |
|---|---|
| Entra sign-in logs | Logins |
| Entra audit logs | Directory changes |
| Azure Activity Log | Control-plane actions |
| Resource logs | Data-plane actions, off by default |
| Microsoft 365 audit | Email and document activity |

Send them all to a Log Analytics workspace, in a separate subscription, and to [Sentinel](/modules/08-01-siem-query-languages/). **Defender for Cloud** rates posture, and **Azure Policy** enforces it, such as "no storage accounts with public access". Cross-tenant mistakes are worth a look, too: the 2021 [ChaosDB](https://www.wiz.io/blog/chaosdb-how-we-hacked-thousands-of-azure-customers-databases) research, on Cosmos DB, showed that providers themselves have multi-tenant flaws.

?? What's the difference between Entra roles and Azure RBAC?
+ Entra governs identity, and RBAC governs resources
- Entra governs networks, and RBAC governs email
- Entra is for Linux, and RBAC Windows
- Entra is paid, and RBAC always free
=> Entra roles control the directory, whereas Azure RBAC controls resources in subscriptions. Each needs its own review.

## Threat model

Attackers target identity first, through phishing or stolen tokens. Once in, they add [roles](https://attack.mitre.org/techniques/T1098/003/), abuse [cloud accounts](https://attack.mitre.org/techniques/T1078/004/), and look for automation accounts, Key Vaults and managed identities. Attacks often jump from Microsoft 365 to Azure or the other way, so treat them as one surface. Run commands on a VM, and you've turned a cloud role into code execution.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Defender for Cloud | Posture and alerts | The default |
| Azure Policy | Enforces rules | Guardrails |
| PIM | Just-in-time roles | Privileged access |
| ScoutSuite, Prowler | Independent audits | Second opinion |
| AzureHound with BloodHound | Maps Entra paths | Authorised reviews |
| Azure CLI, KQL | Query logs | Investigation |

## Defence

- **Keep Global Admins few,** cloud-only and phishing-resistant.
- **Use PIM** for all privileged roles.
- **Apply policy at the management group level.**
- **Use managed identities,** with least privilege.
- **Avoid long-lived SAS tokens.** Disable shared key access where you can.
- **Restrict public network access** on storage, Key Vault and databases, with private endpoints.
- **Collect logs centrally,** and protect them.

**Detection.** Alert on new Global Admin assignments, elevate-access events, new credentials on apps, disabled diagnostics, and high-risk sign-ins.

## Pitfalls

- **Confusing the two role systems.** A review of one misses the other.
- **Owner at the top management group.**
- **Assuming diagnostic logs are on.** Resource logs need enabling.
- **Reusing admin accounts for email.** Keep them separate.
- **Forgetting guest users.** Check external identities in the tenant.

?? Why is a managed identity better than a stored client secret?
+ The platform handles credentials, so nothing leaks
- The identity works from any public network
- The application gets every permission by default
- The secret is stored in source code
=> There's no static secret to find in code or config, and the platform rotates tokens automatically.

## Exercise

::: law Lab only
Use your own free Azure account, with a budget alert. Don't test other tenants, and delete resources when you've finished.
:::

1. Create a resource group, then assign a test user Reader, then Contributor. Note what changes.
2. Give a VM a system-assigned managed identity. Get a token from the local endpoint, and read a Key Vault secret.
3. Create a SAS with a short lifetime. Test it, wait for expiry, and test again.
4. Send Activity Log to Log Analytics. Write a KQL query that shows role assignment changes.
5. Run the Defender for Cloud recommendations, and fix three.

?! Compare how you'd give an app access to storage in Azure and in AWS. Which mistakes are easier to make in each?

## Further reading

- [Microsoft Cloud Security Benchmark](https://learn.microsoft.com/en-us/security/benchmark/azure/overview).
- [Azure RBAC overview](https://learn.microsoft.com/en-us/azure/role-based-access-control/overview).
- [Managed identities](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/overview).
- [Microsoft Entra Privileged Identity Management](https://learn.microsoft.com/en-us/entra/id-governance/privileged-identity-management/pim-configure).
- [CIS Microsoft Azure Foundations Benchmark](https://www.cisecurity.org/benchmark/azure).
