---
title: AWS privilege paths and hardening
summary: How identity decides everything in AWS. Why a few IAM permissions amount to admin, how metadata and storage exposures happen, and the guardrails and detections that stop them.
level: intermediate
side: defence
minutes: 50
attack: T1078.004, T1530, T1552.005
needs: 0063-cloud-foundations-and-iam, 0064-cloud-detection-and-posture
pair: 10-04-serverless-and-secrets, 08-08-network-and-cloud-forensics, 04-07-ssrf-in-depth
source: AWS Well-Architected Security Pillar | https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html
words: privilege escalation path, service control policy, IMDSv2
---
In AWS, identity is the perimeter. Most serious cloud incidents involve no exploit at all: someone holds a credential, and the permissions behind it reach further than anyone intended. Lesson 63 taught how AWS evaluates policies. This module shows how permissions combine into something bigger, so that you can find those paths first, in your own accounts.

@term privilege escalation path = A set of permissions that together let an identity gain more rights than it was given.
@term service control policy = An AWS Organizations rule that sets the maximum permissions available in an account.
@term permissions boundary = A limit on the maximum permissions an IAM identity can have.

## Concept

### Fundamentals: permissions that equal admin

An IAM policy can look harmless, and still amount to full control. The test is: **can this identity change who it is, or what it can do?**

| Permission family | Why it's sensitive |
|---|---|
| `iam:Attach*Policy`, `iam:Put*Policy` | Can grant itself more |
| `iam:CreateAccessKey` on others | Can act as someone else |
| `iam:UpdateAssumeRolePolicy` | Can change who may assume a role |
| `iam:PassRole` with a compute service | Can run code as a stronger role |
| `sts:AssumeRole` with a wide resource | Can move across accounts |
| `lambda:UpdateFunctionCode` | Can change what a privileged function does |

**`iam:PassRole`** deserves attention. It lets a person hand a role to a service. If someone can create a function or instance, and pass it a powerful role, then whatever runs there holds that power. So scope `PassRole` to specific roles, and name the service with the `iam:PassedToService` condition.

The maintainers of [Rhino Security Labs' research](https://rhinosecuritylabs.com/aws/aws-privilege-escalation-methods-mitigation/) catalogued many of these combinations, and [pathfinding.cloud](https://pathfinding.cloud/) tracks more.

### Exposures that come from defaults

**Storage.** Most S3 exposure comes from policy mistakes. Block Public Access exists to prevent this at the account level, and new buckets block public access by default since 2023.

**Instance metadata.** Each instance can reach `169.254.169.254` for its role credentials. If an application has a server-side request flaw, attackers may be able to reach this through the app, which was a central factor in the [2019 Capital One breach](https://www.justice.gov/usao-wdwa/pr/former-seattle-tech-worker-sentenced-wire-fraud-and-computer-intrusions). **IMDSv2** requires a session token from a `PUT` request, with a hop limit, which blocks the simple form of that pattern.

**Long-lived keys.** Access keys committed to Git are found by bots within minutes. Replace them with roles and [workload identity](/modules/11-05-hybrid-and-workload-identity/).

### Advanced: guardrails at scale

Individual policies can't keep up, so use layers.

| Layer | Scope | Example |
|---|---|---|
| Service control policy | Whole account | Deny disabling CloudTrail |
| Resource control policy | Resources across an organisation | Restrict access from outside your org |
| Permissions boundary | One identity | Developers can't exceed a set |
| IAM policy | One identity | Normal grants |
| Session policy | One session | Temporary reduction |

**Separate accounts** are the strongest boundary that AWS offers. Keep production, development, security tooling and logs apart, with a landing zone. A compromise of a dev account then stays there, and logs in a separate account survive.

**IAM Access Analyzer** uses automated reasoning to find external access, unused permissions and policy errors, and it can suggest least-privilege policies from CloudTrail activity.

?? Why is `iam:PassRole` considered sensitive?
+ It hands a stronger role to services
- It resets passwords for every IAM user
- It disables CloudTrail across the whole account
- It makes all S3 buckets public instantly
=> Code running in that service inherits the role, so the caller gains its power indirectly.

## Threat model

| Stage | Technique | ATT&CK |
|---|---|---|
| Entry | Stolen keys | [T1078.004](https://attack.mitre.org/techniques/T1078/004/) |
| Credential access | Metadata API | [T1552.005](https://attack.mitre.org/techniques/T1552/005/) |
| Collection | Cloud storage | [T1530](https://attack.mitre.org/techniques/T1530/) |

Attackers usually first ask "who am I, and what can I do?" Those discovery calls show up in CloudTrail.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| IAM Access Analyzer | Finds exposure and unused access | The first stop |
| Prowler, ScoutSuite | Audit configuration | Regular reviews |
| Cloudsplaining, PMapper | Analyse IAM risk paths | Finding escalation in your account |
| GuardDuty | Threat detection | Always on |
| CloudGoat | Deliberately vulnerable AWS lab | Legal practice |
| Stratus Red Team | Emulates techniques | [Testing detections](/modules/08-03-purple-teaming/) |

## Defence

- **Use an organisation with separate accounts,** and SCPs that protect logging and block unused regions.
- **Use roles and federation.** Remove long-lived keys.
- **Require MFA,** and lock away the root user.
- **Enforce IMDSv2,** and set the hop limit to 1 unless containers need 2.
- **Turn on Block Public Access** at the account level.
- **Scope `iam:PassRole`** and any `iam:*` permission tightly.
- **Prune unused permissions** with Access Analyzer.

**Detection.** Alert on `StopLogging`, `DeleteTrail`, `CreateAccessKey`, `AttachUserPolicy`, root logins, and role use from an unexpected network. GuardDuty flags instance credentials used outside AWS.

## Pitfalls

- **`Action: *` "for now".** Temporary rights tend to stay.
- **Trusting a role name.** `ReadOnly` means nothing if the policy says otherwise.
- **Forgetting resource policies.** A bucket or KMS key can grant access by itself.
- **Assuming logs are complete.** Data events need enabling.
- **Single-account everything.** One mistake reaches all of it.

?? What does IMDSv2 add to the metadata service?
+ A session token obtained with a PUT
- A password for each EC2 instance user
- An encrypted disk for each new instance
- A firewall rule for all outbound traffic
=> The token handshake blocks simple request-forgery routes that could read credentials with a plain GET.

## Exercise

::: law Lab only
Work in your own AWS account with billing alerts on, or use CloudGoat. Don't test any account you don't own, and delete everything afterwards.
:::

1. Run `aws sts get-caller-identity`, then IAM Access Analyzer. Read the findings.
2. Deploy one [CloudGoat](https://github.com/RhinoSecurityLabs/cloudgoat) scenario in your account, and follow it. Destroy it when you're finished.
3. Find what CloudTrail recorded during the scenario. Write a detection for one event.
4. Enforce IMDSv2 on a test instance, and show the difference with `curl`, from inside.
5. Write an SCP that blocks `cloudtrail:StopLogging`, and test it.

?! A developer needs to deploy Lambda functions. Write the IAM permissions you'd grant, and how you'd limit `PassRole`.

## Further reading

- [AWS Security Pillar](https://docs.aws.amazon.com/wellarchitected/latest/security-pillar/welcome.html).
- [IAM Access Analyzer](https://docs.aws.amazon.com/IAM/latest/UserGuide/what-is-access-analyzer.html).
- [Rhino Security Labs on IAM escalation](https://rhinosecuritylabs.com/aws/aws-privilege-escalation-methods-mitigation/).
- [AWS Security Reference Architecture](https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/welcome.html).
- [ATT&CK Cloud Matrix](https://attack.mitre.org/matrices/enterprise/cloud/).
