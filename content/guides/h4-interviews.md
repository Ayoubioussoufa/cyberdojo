---
title: Interview preparation
summary: The six interview stages and the 25 question bank, each answered aloud, then checked by your AI tutor.
group: Career
minutes: 45
source: The roadmap's question bank. Answer aloud first, then in writing below | https://attack.mitre.org/
---
Interviewing is a separate skill from doing the work. Deliberate practice here is worth more per hour than another lab machine.

## The stages

| Stage | What it tests | How to prepare |
|---|---|---|
| Recruiter screen | Motivation, communication, salary range, availability | A 60-second story: who you are, what you build, what you want next. Know your range |
| Technical Q&A | Fundamentals and depth behind CV claims | The questions below, aloud, without notes, twice |
| Practical / take-home | Real ability: a lab, a capture, a code review, a report | Timed practice. Finished and documented beats perfect and late |
| Portfolio walkthrough | Ownership and judgment | A 5–7 minute story per flagship project: problem → approach → evidence → result → what you'd change |
| Scenario / case | Reasoning under uncertainty | Think aloud, state assumptions, ask clarifying questions, say what you'd verify |
| Behavioural | Teamwork, honesty, resilience | Six STAR stories: a failure, a conflict, a deadline, learning fast, helping someone, a decision you reversed |

@term STAR = A way to tell a work story: Situation, Task, Action, Result.

## When you don't know

- Say so plainly, then reason: "I haven't worked with that. Based on how X works, I'd expect… and I'd verify by…"
- Never bluff with fluent vocabulary. Interviewers listen for it, and it's now the classic signature of unverified AI use.
- Follow up afterwards: a short email with the correct answer you looked up shows exactly the behaviour they want.

?? You're asked about a tool you've never used. What's the best opening?
+ Say so, then reason from what you know already
- Describe it confidently using all the words you recognise
- Change the subject to a tool you know better
- Say the question isn't really relevant to this role
=> Honest reasoning is what they want to see on the job. Fluent bluffing is easy to spot.

## The 25 questions

Answer each one aloud first, then in writing. When you've done a block, use the copy button at the end: your AI tutor gets every answer and grades it against what a strong answer contains. Most of these won't make full sense until you reach the matching month, so return to them. By Month 23 you should answer all of them without notes.

### Fundamentals

?! What happens, step by step, when you type a URL and press Enter? (A strong answer covers DNS resolution, the TCP handshake, the TLS handshake and certificate validation, the HTTP request and response, rendering, and where security controls sit.)
?! TCP vs UDP: what's the difference, and why does it matter to a defender? (Reliability and handshake vs speed; what each looks like in logs; why UDP services are used for amplification and exfiltration.)
?! How does Kerberos authentication work? (AS-REQ/AS-REP, TGT, TGS for a service SPN, presenting the service ticket; where Kerberoasting and AS-REP roasting fit; events 4768/4769/4771.)
?! Hashing vs encryption vs encoding: what's the difference, and how should passwords be stored? (Purpose of each; Argon2id or bcrypt with a per-user salt and tuned work factor; never SHA-256 alone; why encoding isn't security.)
?! Explain TLS and what a certificate actually proves. (Key exchange, authentication through the chain of trust, encryption; it proves control of a name, not that the operator is trustworthy.)

### SOC

?! Walk me through triaging an alert for suspicious PowerShell. (Validate, gather context, form a hypothesis, check related activity, reach a verdict with evidence, escalate or tune, document.)
?! How do you analyse a reported phishing email? (Headers and SPF/DKIM/DMARC, sender infrastructure, URL and attachment analysis in a sandbox, who else received it, IOCs, block and communicate.)
?! What is a false positive, and how do you reduce them without going blind? (Definition, tuning by context rather than disabling rules, measuring precision, documenting exclusions with expiry dates.)
?! How would you detect lateral movement? (Authentication patterns, remote service creation, WMI/WinRM/PsExec artifacts, Kerberos anomalies, network flows, and the telemetry needed.)

### Incident response

?! Ransomware is detected on three servers. What do you do first? (Confirm, contain while preserving evidence, find scope and patient zero, identify credentials and persistence, communicate, recover from validated backups, don't wipe before collecting.)
?! How do you decide between isolating a machine at once and watching the attacker? (Business impact, legal duties, evidence quality, risk of tipping off the actor, who has authority: it's a documented management decision.)

### Pentest

?! What's your methodology for an internal engagement? (Scope and authorization, discovery, enumeration, exploitation, post-exploitation with least impact, cleanup, reporting and retest, with note discipline throughout.)
?! Explain an IDOR to a developer and how to fix it properly. (Missing object-level authorization; enforce ownership server-side on every request, don't just obscure identifiers.)
?! How do you escalate privileges on a Linux host? (Enumerate kernel, services, SUID, sudo rules, cron, capabilities, writable paths; explain one path you've actually used.)
?! How do you write a finding for a non-technical reader? (Business impact first, what an attacker can do, evidence, then a specific fix and effort estimate, no jargon in the summary.)

### Cloud

?! How does AWS evaluate an IAM request? (Explicit deny wins; SCPs/RCPs, identity policies, resource policies, permission boundaries and session policies must all allow it.)
?! An access key has leaked on GitHub. Walk me through the response. (Deactivate, review CloudTrail, scope what it could reach, rotate dependent systems, check for persistence, fix the leak path, then prevent with OIDC, short-lived credentials and secret scanning.)
?! What is IMDSv2 and why does it matter? (Session-oriented instance metadata that defeats simple SSRF credential theft; enforce it, checking for v1 usage first.)

### AppSec

?! Threat model this feature: file upload with preview. (Assets, entry points, trust boundaries; STRIDE; content validation, storage isolation, rendering, access control, rate limits; what you'd test.)
?! How do you prevent XSS in a modern application? (Context-aware output encoding by the framework, avoiding dangerous sinks, CSP as defence in depth, input validation as a complement, and how you verify it.)

### GRC

?! How would you run a risk assessment for a 200-person company? (Scope, asset and data inventory, threats, likelihood and impact with defined scales, register with owners and treatments, a prioritised plan, review cadence.)
?! ISO 27001 vs NIST CSF: what's the difference? (A certifiable management system with requirements and a Statement of Applicability, versus a voluntary framework of outcomes. They're complementary.)

### AI

?! What is prompt injection, and how do you defend against it? (Instructions and data share one channel; defences are architectural: least-privilege tools, authorization outside the model, isolating untrusted content, output encoding, egress control, approval gates.)
?! How would you secure an agent that can read email and call APIs? (Break the lethal trifecta; per-user scoped tools; human approval for outbound actions; full logging; evaluations in CI; anomaly monitoring.)

### Behavioural

?! Tell me about something you built, and what went wrong. (A specific project, the decision you got wrong, how you found out, what you changed, what you now do differently: concrete, no blaming.)

## Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Grace Nolan's security engineering interview notes](https://github.com/gracenolan/Notes)
