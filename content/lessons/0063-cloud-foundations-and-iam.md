---
title: Cloud foundations and IAM
summary: What the cloud really is, the shared responsibility model, a safe account baseline, how AWS decides whether a request is allowed, and the failures behind most cloud breaches.
month: 13
minutes: 60
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
+ The customer, who controls that bucket's access configuration
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

## Infrastructure as code

**Terraform** describes your environment in files, so it's reviewable and repeatable. `terraform plan` shows changes and `terraform destroy` removes everything, which keeps lab costs near zero. A bonus for security: a bad setting becomes a line in a pull request that someone can catch. When you're ready to put this all together, try the [Switchboard machine](/machines/switchboard/).

?! Why do people say identity is the new perimeter in the cloud? Explain it to a friend in three sentences.
