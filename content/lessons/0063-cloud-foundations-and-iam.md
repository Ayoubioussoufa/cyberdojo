---
title: Cloud foundations and IAM
summary: What the cloud really is, the shared responsibility model, a safe account baseline, how AWS decides whether a request is allowed, and the failures behind most cloud breaches.
month: 13
minutes: 85
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
@term ARN (Amazon Resource Name) = The unique name of an AWS resource.
@term trust policy = The part of a role saying who is allowed to assume it.
@term metadata service (IMDS) = A local address where a cloud server can read its own settings and temporary credentials.
@term VPC (virtual private cloud) = Your own private network inside a cloud provider.

## What the cloud actually is

The cloud is other people's computers, rented by the minute and controlled through an **API**. Nobody racks a server. You send a request, "create a machine", and one exists a minute later. That's the source of the security problem: anyone holding valid credentials can do in one call what used to take a data-centre visit.

So in the cloud, a firewall matters less than the answer to one question: who can call which API? That's what **IAM**, identity and access management, decides.

?? Why do people say that identity is the perimeter in the cloud?
+ Valid credentials can reach everything through the API
- Cloud providers forbid the use of any firewalls
- Every employee logs in to the data centre
- Passwords are stored in the cloud provider's firewall
=> The control plane is reachable from anywhere. If a request carries valid credentials and the policy allows it, no network barrier stops it.

## Shared responsibility

The provider secures the cloud itself: buildings, hardware, the hypervisor. **You** secure what you put in it: identities, data, configuration. See [AWS's model](https://aws.amazon.com/compliance/shared-responsibility-model/). The line moves depending on what you rent.

| You rent | Provider handles | You handle |
|---|---|---|
| A virtual machine (IaaS) | Hardware, hypervisor | Operating system, patches, apps, data, access |
| A managed database (PaaS) | The above, plus OS and patching | Data, access, configuration |
| An email service (SaaS) | Nearly everything | Users, access, data |

Whatever you rent, **data and access stay yours**.

?? A public S3 bucket leaks customer files. Under the model, who's responsible?
+ The customer, who controls that bucket's own settings
- The provider, because it owns the storage hardware
- Nobody, because cloud storage is public by nature
- The hardware manufacturer that built the disk drives
=> The provider keeps S3 running. Who may read your data is your configuration.

## Your safe account baseline

::: try Before you deploy anything
1. Turn on MFA for the root user, and create no root access keys.
2. Create a separate admin identity for daily work.
3. Set a **budget alarm** first: a forgotten lab can cost real money.
4. Enable CloudTrail and GuardDuty.
:::

The **root user** owns the account and can't be restricted by normal policies, so you lock it away. The gate: this checklist complete, and spend under $10.

?? Why set a budget alarm before anything else?
+ A leaked key or forgotten lab costs money
- AWS won't let you continue without having one
- Alarms make all your other services run faster
- A budget alarm encrypts the account's stored data
=> Cost is a security signal as well. Stolen keys are often used to run expensive machines, and an alarm is your early warning.

## Temporary is better

There are two kinds of credentials. Long-lived **access keys** work until someone removes them, so they get leaked in code and stay dangerous. An **IAM role** has no permanent key: a person or service assumes it and **STS** issues credentials that expire. Prefer roles wherever you can.

A role has two policies. Its **trust policy** says who may assume it. Its permissions policy says what it can do. Both matter, as you'll see in the missions.

A trust policy is written like any other policy, with one extra field, the `Principal`:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ec2.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}
```

It says that EC2 servers may assume this role. What they get back has three parts, an access key ID, a secret key and a **session token**, plus an expiry time. The key ID tells you which kind you're looking at: temporary ones start with `ASIA`, and long-lived ones start with `AKIA`. In a leaked file, that prefix tells you how worried to be.

?? A developer asks to put an access key in a server's config file. What's a better design?
+ Give the server a role instead
- Encode the key in base64 first
- Rename the key file something boring
- Rotate the key every five years
=> A role gives short-lived credentials automatically, so there's no permanent secret to leak.

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

Who may do what, on which resource. `Effect` is allow or deny, `Action` is the API call, and `Resource` is an **ARN**, the object's full name. `2012-10-17` is the version of the policy language, not a date you should change. Watch out for `"Action": "*"` and `"Resource": "*"`: that's the most common failure, including in AI-written policies.

An ARN reads from left to right, with colons between its parts:

```
arn:aws:iam::123456789012:role/app-server
arn:aws:s3:::reports-bucket/*
```

| Part | First example | Second example |
|---|---|---|
| Partition | `aws` | `aws` |
| Service | `iam` | `s3` |
| Region | Empty, because IAM is global | Empty |
| Account | `123456789012` | Empty, because bucket names are unique worldwide |
| Resource | `role/app-server` | `reports-bucket/*`, every object in the bucket |

An empty part still keeps its colon, which is why S3 ARNs have three in a row.

@code parse-arn

A statement can also carry a `Condition`, which narrows when it applies. This one refuses any request to the bucket that doesn't arrive over TLS:

```json
{
  "Effect": "Deny",
  "Principal": "*",
  "Action": "s3:*",
  "Resource": ["arn:aws:s3:::reports-bucket", "arn:aws:s3:::reports-bucket/*"],
  "Condition": {"Bool": {"aws:SecureTransport": "false"}}
}
```

It has a `Principal` because it's a **resource policy**, attached to the bucket, so it has to say who it's talking about. An identity policy has none, because it's attached to the identity itself.

`Action` and `Resource` can each be one string or a list, so a program that reads policies has to handle both. Once it does, the wildcards are easy to find.

@code policy-wildcards

?? What does `"Action": "s3:*", "Resource": "*"` allow?
+ Every S3 action on every bucket here
- Reading one object in a single bucket
- Listing buckets but never reading their contents
- Nothing until a human approves it first
=> The wildcards mean all S3 actions, including deleting, on all resources. Least privilege names exactly what's needed.

## How AWS decides

The order, in simple form. The [official logic](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_evaluationlogic.html) has more detail:

@flow Default: deny > Any explicit Deny? then denied > Guardrails (SCP, RCP) must allow > Identity or resource policy must allow

::: key Two rules cover most cases
Everything is denied unless something allows it. And **an explicit deny always wins**.
:::

You can write the core of that in a few lines. Collect the statements that match the request. If any of them is a Deny, the answer is deny. Otherwise, if any is an Allow, the answer is allow. And if nothing matched at all, it's an **implicit deny**, which is what "default: deny" means.

@code policy-decision

A guardrail adds one more condition. An SCP never grants anything. It only limits. So a request goes through when the identity policy allows it *and* the SCP allows it, and a deny in either one ends it.

@code scp-ceiling

Don't guess what a real policy does. Ask AWS:

```
aws sts get-caller-identity
aws iam simulate-principal-policy \
  --policy-source-arn arn:aws:iam::123456789012:role/app-server \
  --action-names s3:GetObject s3:DeleteObject \
  --resource-arns arn:aws:s3:::reports-bucket/q3.pdf
```

The first command tells you which identity your terminal is using, and it's worth running before anything else. The second evaluates the role's policies and prints `allowed`, `implicitDeny` or `explicitDeny` for each action.

@drill iam-eval

?? An identity policy allows `s3:*`, and an SCP denies `s3:DeleteBucket`. Can the user delete a bucket?
+ No, the explicit deny in the SCP wins
- Yes, the wildcard allow overrides everything else here
- Yes, because SCPs only apply to the root
- It depends on who created the bucket first
=> An explicit deny can't be overridden, and an SCP sets the ceiling for the whole account.

## The failures behind most breaches

| Failure | What goes wrong | The fix |
|---|---|---|
| Public storage | Anyone can read the bucket | Block Public Access at account level |
| Leaked keys | A key lands in a public repository | Use roles, and scan for secrets |
| Exposed metadata | A flaw in a web app makes the server request its own [metadata service](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html), revealing temporary credentials | Require IMDSv2, and give the role few rights |
| Too much power | A small service holds admin rights | Least privilege, and review regularly |
| Logging off | No trail of what happened | Protect CloudTrail, and alert on changes |

::: law Your own account only
Practise on your own lab account, or on platforms built for it, such as [flAWS](http://flaws.cloud/) and CloudGoat. Testing someone else's cloud without permission is illegal, whatever the bucket's settings.
:::

?? Why does requiring IMDSv2 help protect a cloud server?
+ It needs a token that simple forged requests lack
- It deletes the server's credentials every few short minutes
- It hides the server from the public internet entirely
- It stops all outbound traffic from the virtual machine
=> IMDSv2 requires a token obtained with a PUT request first, which blocks many request-forgery paths. Still keep the role's rights small.

## Read real permissions

@range iam

## Review a role

A colleague asks you to approve a new role for a reporting job. These are its two statements.

```json
{ "Effect": "Allow", "Principal": {"AWS": "*"}, "Action": "sts:AssumeRole" }
```

```json
{ "Effect": "Allow", "Action": "*", "Resource": "*" }
```

?? The first is the trust policy. Who can assume this role?
+ Any identity in any AWS account assumes it
- Only the root user of this one account
- Only EC2 servers running in this same account
- Nobody, because a star matches no real principal
=> A star as the principal means everyone, including accounts that aren't yours. A trust policy should name the one service or role that needs it.

?? The organisation has an SCP that denies `iam:*`. Can this role create a new user?
+ No, an explicit deny beats every single allow
- Yes, the role's own star outranks the guardrail
- Yes, because an SCP never applies to roles
- No, because a role can never call IAM
=> The role's policy allows everything, and it still can't. That's what a guardrail is for: it holds even when a policy below it is badly written.

?? A key ID starting with `AKIA` turns up in a public repository. What's the first move?
+ Deactivate it, then check what it did
- Delete the repository and tell nobody else
- Wait for it to expire by itself
- Rename the file so scanners miss it
=> `AKIA` marks a long-lived key, so it never expires. Deactivate it at once, then read CloudTrail for what it was used for. Removing the commit doesn't help, because the key has already been copied.

## Infrastructure as code

**Terraform** describes your environment in files, so it's reviewable and repeatable. `terraform plan` shows changes and `terraform destroy` removes everything, which keeps lab costs near zero. A bonus for security: a bad setting becomes a line in a pull request that someone can catch. When you're ready to put this all together, try the [Switchboard machine](/machines/switchboard/).

?! Why do people say identity is the new perimeter in the cloud? Explain it to a friend in three sentences.
