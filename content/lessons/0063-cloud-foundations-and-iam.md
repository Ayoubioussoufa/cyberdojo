---
title: Cloud foundations and IAM
summary: The shared responsibility model, a safe account baseline, and how AWS decides whether a request is allowed.
month: 13
minutes: 40
builds: a hardened AWS account, and policies you can reason about
source: AWS, Policy evaluation logic | https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluationlogic.html
words: shared responsibility, IAM policy, least privilege
---
In the cloud, the network perimeter fades and **identity becomes the perimeter**. One wrong policy can expose everything, and most cloud incidents come from configuration and credentials rather than clever exploits.

@term shared responsibility model = The split of security duties between a cloud provider and its customer.
@term IAM policy = A JSON document listing what actions are allowed or denied on which resources.
@term IAM role = An identity with permissions that people or services assume temporarily.
@term SCP (service control policy) = An AWS Organizations guardrail setting the maximum permissions for accounts.
@term RCP (resource control policy) = An AWS Organizations guardrail setting the maximum permissions on resources.
@term STS = AWS Security Token Service, which issues temporary credentials.
@term S3 = Amazon's object storage service.
@term CloudTrail = The AWS service that records API calls.
@term GuardDuty = The AWS threat detection service.
@term Terraform = A tool for defining infrastructure as code.
@term infrastructure as code (IaC) = Defining infrastructure in version-controlled files rather than by hand.

## Shared responsibility

The provider secures the cloud itself: buildings, hardware, the hypervisor. **You** secure what you put in it: identities, data, configuration. See [AWS's model](https://aws.amazon.com/compliance/shared-responsibility-model/).

## Your safe account baseline

::: try Before you deploy anything
1. Turn on MFA for the root user, and create no root access keys.
2. Create a separate admin identity for daily work.
3. Set a **budget alarm** first: a forgotten lab can cost real money.
4. Enable CloudTrail and GuardDuty.
:::

The gate: this checklist complete, and spend under $10.

## Reading a policy

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject"],
    "Resource": "arn:aws:s3:::reports-bucket/*"
  }]
}
```

Who may do what, on which resource. Watch out for `"Action": "*"` and `"Resource": "*"`: that's the most common failure, including in AI-written policies.

## How AWS decides

The order, in simple form. The [official logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluationlogic.html) has more detail:

@flow Default: deny > Any explicit Deny? then denied > Guardrails (SCP, RCP) must allow > Identity or resource policy must allow

::: key Two rules cover most cases
Everything is denied unless something allows it. And **an explicit deny always wins**.
:::

@drill iam-eval

?? An identity policy allows `s3:*`, and an SCP denies `s3:DeleteBucket`. Can the user delete a bucket?
+ No, the explicit deny in the SCP wins
- Yes, the wildcard allow overrides everything else here
- Yes, because SCPs only apply to the root
- It depends on who created the bucket first
=> An explicit deny can't be overridden, and an SCP sets the ceiling for the whole account.

## Temporary is better

Long-lived access keys get leaked. Roles issue short-lived credentials through STS. Prefer roles wherever you can.

## Infrastructure as code

**Terraform** describes your environment in files, so it's reviewable and repeatable. `terraform plan` shows changes and `terraform destroy` removes everything, which keeps lab costs near zero.

?! Why do people say identity is the new perimeter in the cloud?
