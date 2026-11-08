---
title: Serverless and secrets management
summary: With no servers to patch, what's left to secure? Function permissions, event input and logging, plus how to store, rotate and retire secrets in a modern platform.
level: intermediate
side: defence
minutes: 45
attack: T1648, T1555.006
needs: 10-01-aws-attack-paths, 03-11-key-management
pair: 10-01-aws-attack-paths, 03-11-key-management
source: OWASP Serverless Top 10 | https://owasp.org/www-project-serverless-top-10/
words: execution role, dynamic secrets, cold start
---
Serverless moves the OS, patching and scaling to the provider. It's a real security gain. But it doesn't remove your responsibility for code, permissions and data. In practice, one permissive role and one unsanitised event can do as much harm as a compromised server. Secrets are the other half of that story.

@term execution role = The identity that a serverless function runs as.
@term dynamic secret = A credential created on demand with a short lifetime, unique to each client.
@term event injection = Attacker-controlled data in a trigger event that reaches a dangerous function.

## Concept

### Fundamentals: what the provider handles

| Responsibility | VM | Serverless |
|---|---|---|
| OS patches | You | Provider |
| Runtime | You | Provider, until it's deprecated |
| Code and dependencies | You | You |
| Permissions | You | You |
| Input validation | You | You |
| Logging | You | You configure it |
| Secrets | You | You |

### New shapes of old problems

**Over-permission.** This is the top risk. A function often gets a shared role with wide rights, and now any flaw in it can use them. Each function should have its own minimal **execution role**.

**Event injection.** Functions aren't triggered only by HTTP. An S3 filename, a queue message or an email subject are all input. Developers often treat these as trusted, since no web form is involved. So [the rule from lesson 47](/courses/0047-keeping-input-out-of-the-code/) holds: data from outside stays data.

**Dependency sprawl.** Each function ships its own libraries, so one flaw can appear in hundreds of deployments. See [Dependency risk](/modules/13-01-dependency-attacks/).

**Observability.** There's no host for an agent. If you didn't log it, it didn't happen. Function URLs and misconfigured triggers can expose code to the Internet too.

**Denial of wallet.** Autoscaling turns a flood into a bill, so set concurrency limits and budgets. **Execution environments** can be reused between invocations, so data in `/tmp` may persist between requests.

### Secrets: the problem

Secrets end up in the same places every time: source code, environment variables, CI logs, container images and chat. Environment variables are especially common in serverless, and they're visible to anyone who can read the configuration.

| Approach | Rotation | Exposure |
|---|---|---|
| Hardcoded | Requires redeploy | Severe |
| Environment variable | Requires redeploy | Readable in config |
| Secrets manager | Automatic, fetched at runtime | IAM controlled, audited |
| Dynamic secrets | Created per client | Very low |
| No secret: workload identity | Not needed | None |

Work your way down this table.

### Advanced: Vault and dynamic secrets

[HashiCorp Vault](https://developer.hashicorp.com/vault/docs), and its open-source fork OpenBao, go beyond storage. With **dynamic secrets**, an application asks Vault for a database login, and Vault creates one on the spot with a short lease, then revokes it. Each client has its own, so a leak is traceable and short-lived. Vault can also provide encryption as a service.

Vault itself becomes a Tier 0 system, needing careful unsealing, audit logging and backup. [Key management](/modules/03-11-key-management/) covers the principles.

**Rotation in practice** needs a plan: two valid secrets during the changeover, or a client outage follows. AWS Secrets Manager and Azure Key Vault automate this for common services. Test it.

**Response.** Assume that any secret touched by an attacker is burned. Rotation, not deletion, is the fix, because Git history remembers. The [CircleCI incident](https://circleci.com/blog/jan-4-2023-incident-report/) in 2023 forced customers to rotate every stored secret, a good test of how ready you are.

?? What's the biggest security risk in most serverless functions?
+ Excess permissions on the function's execution role
- Physical theft of the provider's own servers
- Slow cold starts during the first request
- Missing antivirus on the function's operating system
=> A flaw in code can only do what the role permits, so a wide role turns a small bug into a big breach.

## Threat model

| Technique | ATT&CK |
|---|---|
| Serverless execution | [T1648](https://attack.mitre.org/techniques/T1648/) |
| Cloud secrets management stores | [T1555.006](https://attack.mitre.org/techniques/T1555/006/) |

Attackers with cloud access may create or change functions to run code, or persist through triggers. They also read secret stores directly, if their role lets them, so access to a secret manager must itself be tightly scoped.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| AWS Secrets Manager, Azure Key Vault, Secret Manager | Store and rotate | Default choice |
| HashiCorp Vault, OpenBao | Dynamic secrets | Multi-platform |
| `sops` | Encrypted config in Git | GitOps |
| TruffleHog, gitleaks | Find leaks | Prevention |
| CloudWatch, Lambda logs | Function evidence | Investigation |
| Serverless-focused CSPM checks | Find wide roles | Reviews |

## Defence

- **One role per function,** least privilege.
- **Validate every event source,** with schemas.
- **Pin dependencies** and scan them.
- **Set concurrency limits and budget alerts.**
- **Put secrets in a manager,** and fetch at runtime.
- **Prefer workload identity** to any stored secret.
- **Rotate automatically,** and test the changeover.
- **Scan** for secrets in commits, images and logs.

**Detection.** Alert on new or changed functions, on new triggers, on secret reads by an unusual identity, and on spikes in invocations.

## Pitfalls

- **"No servers, no security work."**
- **One role for all functions.**
- **Trusting internal events.** A queue message may start from a user.
- **Logging secrets by accident,** by dumping the whole event.
- **Treating "deleted from code" as gone.** Rotate instead.

?? What do dynamic secrets give you?
+ Short-lived credentials created for each single client
- One shared password for the whole company
- A longer password than ordinary database accounts
- A permanent key stored in the repository
=> Each client gets its own short lease, so a leaked credential expires quickly and can be traced.

## Exercise

::: law Lab only
Use your own cloud account with a budget alert, and delete resources afterwards.
:::

1. Deploy a small function with a broad role. Read what that role allows, then reduce it to the minimum.
2. Make a function that processes S3 filenames. Show how a strange filename reaches a log, and add validation.
3. Move a database password from an environment variable to Secrets Manager.
4. Run Vault in dev mode with Docker. Enable the database engine, and get a dynamic credential.
5. Scan a repo with `gitleaks`, and rotate anything you find.

?! You learn that a database password was committed to a public repo two years ago, then removed. Write what you'd do, and in what order.

## Further reading

- [OWASP Serverless Top 10](https://owasp.org/www-project-serverless-top-10/).
- [AWS Lambda security overview](https://docs.aws.amazon.com/lambda/latest/dg/lambda-security.html).
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html).
- [Vault documentation](https://developer.hashicorp.com/vault/docs).
- [CircleCI incident report](https://circleci.com/blog/jan-4-2023-incident-report/).
