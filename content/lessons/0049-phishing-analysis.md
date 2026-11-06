---
title: Analysing a phishing email
summary: Reading headers, SPF, DKIM and DMARC, checking links and attachments safely, and building a playbook.
month: 9
minutes: 35
builds: analyse a reported email safely and extract its IOCs
source: Cloudflare, What are DMARC, DKIM and SPF? | https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/
words: SPF, DKIM, DMARC
---
Reported phishing lands in every SOC's queue, every day. A careful analysis takes minutes and protects the whole company.

@term SPF = An email record listing which servers may send mail for a domain.
@term DKIM = A digital signature on an email, proving that the domain signed it and it wasn't altered.
@term DMARC = A policy telling receivers what to do when SPF and DKIM checks fail.
@term email header = Metadata recording how a message was routed and checked.
@term sandbox = An isolated environment for safely opening suspicious files or links.
@term BEC (business email compromise) = Fraud using a hijacked or spoofed business email account, often to redirect payments.

## Safety first

::: law Handle it like evidence
Never click a link or open an attachment on your own machine. Work on a copy in an isolated VM, and use a sandbox or reputation lookup. Search by hash before uploading anything, because uploads to public services can be seen by others.
:::

## Read the headers

| Header | Tells you |
|---|---|
| `From` | Who it claims to be from, and it's easily forged |
| `Return-Path` | Where bounces go |
| `Reply-To` | Where your reply would go. A mismatch is suspicious |
| `Received` | The servers it passed through. Read from the bottom up |
| `Authentication-Results` | The SPF, DKIM and DMARC outcomes |

## The three checks

| Check | Question | Published in |
|---|---|---|
| **SPF** | Was the sending server allowed? | DNS TXT |
| **DKIM** | Is the signature valid? | DNS TXT |
| **DMARC** | Do they align with the `From` domain, and what's the policy? | DNS TXT |

A pass doesn't mean it's safe: attackers authenticate their own lookalike domains too, and a hijacked real account passes everything.

?? An email passes SPF, DKIM and DMARC for `paypa1-secure.example`. What does that prove?
+ That domain sent it, not that it's honest
- PayPal itself has verified and sent the message
- The links inside are all safe to click
- The attachment has been scanned for any malware
=> Authentication proves who sent it. Anyone can set these up on a lookalike domain.

## Workflow

@flow Preserve the original > Check headers > Inspect links and attachments safely > Who else got it? > Extract IOCs > Block and tell people > Document

Extract URLs without clicking, and check them with [URLScan](https://urlscan.io/) or hash lookups. The step people forget is **scope**: search mail logs for everyone who received it, and who clicked.

::: tip Business email compromise
Some of the most costly fraud has no link or malware: just a plausible request to change bank details. Look for urgency, a changed payment process and a new reply-to address. Confirm through a separate channel.
:::

?? You've confirmed a phishing email. What's easy to forget, and very important?
+ Finding everyone else who received the email
- Replying to the sender to warn them
- Forwarding it to all staff as training
- Deleting it before you've recorded the evidence
=> One report usually means many recipients. Scoping tells you who's at risk.

?! Write a short phishing triage playbook: six steps another analyst could follow.
