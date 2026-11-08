---
title: Network and cloud forensics
summary: Investigating what crossed the wire, and what happened on servers you can't touch. Reconstructing sessions from captures and flows, plus evidence in AWS, Azure and GCP.
level: advanced
side: defence
minutes: 50
attack: T1530, T1578, T1048
needs: 01-06-packet-analysis-in-depth, 0064-cloud-detection-and-posture
pair: 01-06-packet-analysis-in-depth, 10-01-aws-attack-paths
source: NIST SP 800-201, Cloud Computing Forensic Reference Architecture | https://csrc.nist.gov/pubs/sp/800/201/final
words: network forensics, cloud forensics, snapshot
---
Hosts can lie, because an attacker with root controls what a host reports. A network capture records what the attacker couldn't edit. In the cloud, the opposite problem appears: there may be no hardware to seize, and the machine you want may have ceased to exist an hour ago. These two disciplines have one thing in common: you depend on what you chose to record beforehand.

@term network forensics = Capturing and analysing network traffic to reconstruct events and support an investigation.
@term cloud forensics = Investigating incidents in cloud services, using provider logs, snapshots and APIs.

## Concept

### Fundamentals: three depths of network evidence

| Evidence | Answers | Retention |
|---|---|---|
| Full packets | Exactly what was sent | Days |
| Protocol logs, such as Zeek | Who, what, how, in structure | Weeks |
| Flow records | Who talked to whom, how much | Months to a year |

An investigation usually starts wide, on flows, then narrows down to packets. This is the same design logic that [packet analysis](/modules/01-06-packet-analysis-in-depth/) discussed, seen from the far end of an incident: you only get the depth that you stored.

### Working a capture

A typical sequence:

1. **Hash and record** the capture. Work on a copy.
2. **Summarise.** `capinfos`, protocol hierarchy and top talkers.
3. **Pivot on an indicator:** an IP, a domain or a time window.
4. **Reconstruct sessions.** Follow streams, then rebuild files.
5. **Extract objects.** Wireshark and NetworkMiner can pull transferred files, and Zeek can write them out.
6. **Corroborate** with host logs.

Encrypted traffic limits what you can read, so work from metadata: SNI, certificates, JA4, volumes, timing. If a host's key material was captured, or a TLS proxy existed, you may decrypt.

A sudden shift in upload volume is usually the best first sign of exfiltration, since few workstations upload gigabytes.

### Why cloud is different

| Traditional | Cloud |
|---|---|
| Seize the disk | Snapshot through an API |
| Physical chain of custody | Provider logs and access controls |
| You own the logs | Logs may be off by default, or limited by licence |
| Stable hosts | Autoscaled, gone in minutes |
| One jurisdiction | Data may span regions |

### The evidence in each cloud

| Need | AWS | Azure | Google Cloud |
|---|---|---|---|
| Control plane | CloudTrail | Activity Log, Entra logs | Cloud Audit Logs |
| Network | VPC Flow Logs | VNet Flow Logs | VPC Flow Logs |
| Storage access | S3 data events | Storage logs | Data Access logs |
| Disk capture | EBS snapshot | Disk snapshot | Disk snapshot |

The trap is **data events**. CloudTrail records management calls by default, but not each S3 object read. If those were off, you may never prove what was stolen. Lessons 63 and 64 covered the basics.

### Advanced: responding in the cloud

**Isolate, don't delete.** Change the security group to deny all, and keep the instance running. Snapshot the disk. Tag everything.

**Use a forensic account.** Copy snapshots to a separate, locked-down account that's prepared ahead of time, with its own KMS keys. Share encrypted snapshots with care.

**Capture memory** with an agent such as AVML, by Systems Manager or SSH, before stopping. Stopping loses RAM.

**Don't tip off.** Attackers watch cloud logs and may delete resources when they see a response. Keep logs in a separate account, with object lock.

**Serverless and containers.** A Lambda function or a Kubernetes pod may hold no state of its own. Evidence comes from runtime logs, invocation logs, and the image registry. So [runtime detection](/modules/02-05-linux-persistence-and-audit/) must already be in place.

**SaaS.** For Microsoft 365 and Google Workspace, the evidence is the audit log, with retention tied to your licence.

**Law and contracts.** Providers hold the underlying hardware, and you can't image it. Data may be held in another country, raising legal issues. [NIST SP 800-201](https://csrc.nist.gov/pubs/sp/800/201/final) describes these challenges.

?? What's different about acquiring a cloud VM's disk?
+ You snapshot it through the provider's API
- You must visit the provider's data centre
- You can only read it while running
- You need the hypervisor's physical root password
=> There's no drive to remove. The API creates a copy, and that action is logged, which supports your evidence trail.

## Threat model

| Technique | ATT&CK |
|---|---|
| Data from cloud storage | [T1530](https://attack.mitre.org/techniques/T1530/) |
| Modifying cloud compute | [T1578](https://attack.mitre.org/techniques/T1578/) |
| Exfiltration over alternative protocols | [T1048](https://attack.mitre.org/techniques/T1048/) |

Attackers know that default logging leaves gaps, and they may turn logging off to create more. A `StopLogging` or `DeleteTrail` event is an emergency in its own right.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Wireshark, `tshark` | Reads captures | Close analysis |
| Zeek | Turns traffic into logs | Large captures |
| NetworkMiner | Extracts files and hosts | Quick reconstruction |
| Arkime | Stores and searches packets | Going back in time |
| Prowler, ScoutSuite | Find logging gaps | Readiness |
| AWS Athena, Azure Log Analytics | Query logs at scale | Investigating |
| Cloud-forensics-utils (`libcloudforensics`) | Automates snapshots | Repeatable response |

## Defence

Readiness is everything here.

- **Turn on logs before you need them:** data events for sensitive buckets, flow logs, DNS logs.
- **Centralise** into a separate log archive account, with write-once storage.
- **Build the forensic account** and automation in advance. Test by running a practice.
- **Tag and inventory** assets, so that you know what an instance was.
- **Alert on tampering:** disabling logs, changing retention.
- **Know your licence.** Check what your SaaS plan gives you in logs, and for how long.

## Pitfalls

- **"The cloud logs everything."** Not by default.
- **Terminating the instance first.** You lose memory and maybe the disk.
- **Investigating from a compromised account.** Use a separate one.
- **Ignoring time zones.** Cloud logs use UTC, while your application may not.
- **Assuming packet capture exists.** In many clouds, it takes specific setup.
- **Reading log delivery as real time.** CloudTrail can lag by minutes.

?? Which evidence is most likely to answer "what left the network" a year later?
+ Flow records, since they're cheap to keep
- Full packet captures kept from every link
- Browser caches held on each employee laptop
- Antivirus alerts from the company's mail gateway
=> Few can store a year of packets. Flow records are small enough to keep, and they still show volumes and destinations.

## Exercise

::: law Lab only
Use your own captures and your own cloud account, with billing alerts on. Delete what you create. Never inspect traffic or cloud accounts that you aren't authorised to access.
:::

1. Download a practice capture from [Malware-Traffic-Analysis.net](https://www.malware-traffic-analysis.net/) in an isolated VM. Use `tshark` to list the top talkers and contacted domains.
2. Run Zeek over it, and answer: which internal host talked longest, and to what?
3. Extract one transferred object with Wireshark, then hash it.
4. In a free-tier AWS account, enable CloudTrail. Read an S3 object, then search for it. Now enable S3 data events, and repeat. What changed?
5. Make an EBS snapshot, share it to a second account, and write down each logged action.

?! A customer reports data for sale, and S3 data events were off. Write what you can and can't prove, what you'd check next, and how you'd word that for the legal team.

## Further reading

- [NIST SP 800-201](https://csrc.nist.gov/pubs/sp/800/201/final).
- Davidoff and Ham, *Network Forensics*.
- [AWS Security Incident Response Guide](https://docs.aws.amazon.com/security-ir/latest/userguide/introduction.html).
- [Azure incident response overview](https://learn.microsoft.com/en-us/security/operations/incident-response-overview).
- [Google Cloud's data incident response process](https://cloud.google.com/docs/security/incident-response).
