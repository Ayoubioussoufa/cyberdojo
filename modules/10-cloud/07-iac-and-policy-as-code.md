---
title: Infrastructure as code and policy as code
summary: When infrastructure is code, a pull request can open a database to the world. Protecting state, detecting drift, reviewing plans, and enforcing rules automatically with OPA.
level: intermediate
side: defence
minutes: 45
attack: T1578, T1552.001
needs: 0063-cloud-foundations-and-iam, 13-02-cicd-attacks
pair: 10-06-kubernetes-attack-paths
source: Open Policy Agent documentation | https://www.openpolicyagent.org/docs/
words: Terraform state, drift, policy as code
---
Defining infrastructure in code is one of the best things to happen to security: every change is reviewed, versioned and repeatable. It also means that a single bad merge can expose production, and that your pipeline holds the keys to the kingdom. Project P10 built this. This module covers what could go wrong, and how to make good configuration automatic.

@term drift = When real infrastructure no longer matches its code.
@term policy as code = Writing rules in a language that machines can check automatically.

## Concept

### Fundamentals: where the risk sits

| Asset | Risk |
|---|---|
| Source | Insecure defaults, and secrets in code |
| Modules | Third-party modules run with your rights |
| State file | Holds all resource attributes, including some secrets |
| Plan and apply | Runs with broad cloud credentials |
| Providers | Plugins are a [supply chain](/modules/13-01-dependency-attacks/) risk |

### State

Terraform's state maps code to real resources, and it can hold plaintext values: database passwords and generated keys. So a readable state file is a credential dump, and a writable one can trick Terraform into changing things. Store it in an encrypted remote backend, with strict access, locking and versioning. Never commit `terraform.tfstate` to Git. Mark sensitive outputs, knowing that this hides them from logs, rather than from state. Newer Terraform and OpenTofu features let some values stay out of state, using ephemeral resources, and OpenTofu can encrypt state.

### Plan and apply

A `plan` shows what will change, and reviewers should read it, not just the code. Pipeline design matters:

- **Plan on pull requests,** with read-only credentials.
- **Apply only from a protected branch,** after review.
- **Use [OIDC](/modules/11-05-hybrid-and-workload-identity/),** not stored keys.
- **Note that `plan` can run code.** A malicious provider or external data source can run during planning, so don't plan untrusted pull requests with real credentials.

### Drift

Someone fixes an outage by hand in the console at 2 a.m., and now reality differs from the code. That's **drift**. Next apply may undo the fix, and security reviews of code no longer reflect what's real. Detect drift on a schedule, then either fix the code, or revert the change. Attackers cause drift too, so an unexplained change deserves a look.

### Advanced: policy as code

Scanners such as Checkov and Trivy test for known problems, whereas **policy as code** lets you express your own rules.

```rego
package terraform.s3

deny contains msg if {
  r := input.resource_changes[_]
  r.type == "aws_s3_bucket_public_access_block"
  r.change.after.block_public_acls == false
  msg := sprintf("%s must block public ACLs", [r.address])
}
```

That's **Rego**, the language of [Open Policy Agent](https://www.openpolicyagent.org/), in the syntax that OPA 1.0 made the default: older tutorials leave out `contains` and `if`. You run it against a `terraform show -json` plan, using Conftest in CI.

Apply policy at several points:

| Stage | Tool | Catches |
|---|---|---|
| Editor | Linters | Mistakes, early |
| Pull request | Checkov, Conftest | Before merge |
| Admission | Kyverno, Gatekeeper | Before running on a cluster |
| Cloud | SCPs, Azure Policy | Anything that bypassed the rest |
| Runtime | CSPM | Whatever got through |

The cloud-level guardrail is the most important one: pipelines can be skipped, but an SCP can't. So combine early feedback for developers with a hard stop at the end.

**Policies are code as well.** Test them, review them, and version them. Rules with no tests rot, and rules that nobody can explain get bypassed.

?? Why must Terraform state be protected?
+ It can hold secrets in plain text
- It runs as root on each server
- It's published to the public Terraform registry
- It contains the cloud provider's own passwords
=> State records resource attributes, including generated passwords, so reading it can reveal real credentials.

## Threat model

Attackers target the pipeline's credentials, a [readable state file or secrets in code](https://attack.mitre.org/techniques/T1552/001/), and malicious modules. Once inside a cloud, they might [change compute](https://attack.mitre.org/techniques/T1578/). A hostile pull request can look harmless, yet hide a change that opens a security group. Review plans, not just diffs.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Terraform, OpenTofu | Provision infrastructure | IaC |
| Checkov, Trivy, KICS | Scan IaC | CI |
| Open Policy Agent, Conftest | Custom policy | Your own rules |
| Sentinel | HashiCorp policy engine | Terraform Cloud |
| Kyverno | Kubernetes-native policy | Clusters |
| driftctl-style checks, `terraform plan` | Detect drift | Scheduled jobs |

## Defence

- **Remote, encrypted, access-controlled state,** with versioning.
- **No secrets in code,** with secret scanning on every commit.
- **Pin providers and modules,** and review third-party modules.
- **Separate credentials** for plan and apply.
- **Require review** for changes to IAM, network and encryption.
- **Add policy checks** that block merges.
- **Keep cloud guardrails** independent of the pipeline.
- **Check for drift daily,** and alert.

## Pitfalls

- **State in Git.** Search your history.
- **`sensitive = true` meaning "safe".** It only hides output.
- **One all-powerful CI role.** Split by environment.
- **Allow-listing findings forever.** Each exception needs an owner and an expiry.
- **Clicking in the console during incidents,** then not putting it back in code.

?? What's drift?
+ Real infrastructure no longer matching the code
- A slow leak of storage over time
- A change in the cloud provider's prices
- A branch that's behind the main branch
=> Manual or malicious changes make reality differ from what was reviewed, and that undermines the whole model.

## Exercise

::: law Lab only
Use your own cloud account or a local provider such as LocalStack, with budget alerts. Delete resources afterwards.
:::

1. Write Terraform for an S3 bucket and a database. Inspect `terraform.tfstate`, and find anything sensitive.
2. Move state to a remote backend with encryption and locking.
3. Run `checkov -d .`, and fix the findings.
4. Write a Rego policy that denies security groups open to `0.0.0.0/0` on port 22. Test it with Conftest against a plan.
5. Change a resource by hand in the console, and detect the drift with `terraform plan`.

?! A teammate wants to skip the IaC pipeline "just this once" during an outage. Write your break-glass process, covering how it's approved and how it gets back into code.

## Further reading

- [Terraform security overview](https://developer.hashicorp.com/terraform/language/manage-sensitive-data).
- [Open Policy Agent](https://www.openpolicyagent.org/docs/).
- [Conftest](https://www.conftest.dev/).
- [Checkov](https://www.checkov.io/).
- [OpenTofu state encryption](https://opentofu.org/docs/language/state/encryption/).
