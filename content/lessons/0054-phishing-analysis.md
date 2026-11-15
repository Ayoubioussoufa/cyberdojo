---
title: Analysing a phishing email
summary: How email travels, reading headers, SPF, DKIM and DMARC, checking links and attachments safely, and building a playbook.
month: 9
minutes: 75
builds: analyse a reported email safely and extract its IOCs
source: Cloudflare, What are DMARC, DKIM and SPF? | https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/
words: SPF, DKIM, DMARC
---
Reported phishing lands in every SOC's queue, every day. **Phishing** means tricking someone through a message into giving up a password, opening a file, or sending money. A careful analysis takes minutes and protects the whole company.

@term SPF = An email record listing which servers may send mail for a domain.
@term DKIM = A digital signature on an email, proving that the domain signed it and it wasn't altered.
@term DMARC = A policy telling receivers what to do when SPF and DKIM checks fail.
@term email header = Metadata recording how a message was routed and checked.
@term sandbox = An isolated environment for safely opening suspicious files or links.
@term BEC (business email compromise) = Fraud using a hijacked or spoofed business email account, often to redirect payments.
@term alignment = The DMARC rule that the domain passing SPF or DKIM must match the domain in the visible From address.
@term defanging = Rewriting a link so it can't be clicked by accident, such as example[.]com.
@term lookalike domain = A domain registered to resemble a real one, like paypa1-secure.example.

## Safety first

::: law Handle it like evidence
Never click a link or open an attachment on your own machine. Work on a copy in an isolated VM, and use a sandbox or reputation lookup. Search by hash before uploading anything, because uploads to public services can be seen by others.
:::

An `.eml` file is plain text. Reading it with `cat` or `grep` runs nothing. The danger starts when an email program renders it, or when a person clicks.

?? A colleague forwards a suspicious attachment. What's the safest first step?
+ Look up the file's hash without opening it
- Open it quickly to see what it does
- Upload it at once to a public scanner
- Forward it to everyone so they stay alert
=> A hash lookup tells you whether it's known and reveals nothing. Uploading can expose private data, and opening it can infect you.

## How email really travels

Email was designed in an era of trust. The envelope, which servers use for delivery, is separate from the letter inside, which you read. So the `From` line you see is just text that the sender typed. Nothing in the original design checks it. SPF, DKIM and DMARC were added later to close that gap.

| Header | Tells you |
|---|---|
| `From` | Who it claims to be from, and it's easily forged |
| `Return-Path` | Where bounces go |
| `Reply-To` | Where your reply would go. A mismatch is suspicious |
| `Received` | The servers it passed through. Read from the bottom up, because each server adds its line on top |
| `Authentication-Results` | The SPF, DKIM and DMARC outcomes |

Get a real message in front of you. In most mail programs, a menu item called **Show original** or **View source** displays the raw text, and **Download** saves it as an `.eml` file. Take one of your own, a newsletter for instance, into your Linux VM and pull out the lines that matter:

```
grep -iE '^(from|reply-to|return-path|subject|date):' message.eml
grep -ic '^received:' message.eml          how many servers handled it?
```

Each `Received` line was written by one server as the message arrived there:

```
Received: from mailer-77.example (mailer-77.example [203.0.113.25])
        by mx.corp.example with ESMTPS id a1b2c3
        for <ana@corp.example>; Sun, 15 Nov 2026 09:14:02 +0000
```

Read it as "received **from** that machine, **by** this one, **for** this person, at this time". The address in square brackets was recorded by the receiving server itself, so on a line written by your own mail server it's the most reliable fact in the whole message.

Python reads the same file with its standard `email` module, which is how you'd process a mailbox of reports:

```python
from email import message_from_string
from email.utils import parseaddr

msg = message_from_string(open("message.eml").read())
print(parseaddr(msg["From"]))          # ('IT Support', 'it-support@corp-helpdesk.example')
print(msg["Reply-To"], len(msg.get_all("Received")))
```

A reply address on a different domain from the sender is one of the cheapest checks there is, and one of the most telling.

@code reply-mismatch

?? Why do you read `Received` headers from the bottom up?
+ Each server adds its line above the last
- The bottom lines are the most recent ones
- Email programs reverse them to confuse any attackers
- The top lines are always forged by senders
=> The oldest hop is at the bottom. Remember that only the lines your own servers added are fully trustworthy.

## The three checks

| Check | Question | Published in |
|---|---|---|
| **SPF** | Was this server allowed to send for the envelope domain? | DNS TXT |
| **DKIM** | Is the signature valid, and whose is it? | DNS TXT |
| **DMARC** | Does either pass **align** with the visible `From` domain, and what's the policy? | DNS TXT |

All three live in DNS as text records, so you can read any domain's settings with the `dig` you learned in Month 2:

```
$ dig +short TXT example.com
"v=spf1 include:_spf.mailhost.example -all"
$ dig +short TXT _dmarc.example.com
"v=DMARC1; p=reject; rua=mailto:dmarc@example.com"
```

| Part | Meaning |
|---|---|
| `v=spf1` | This record is an SPF policy |
| `include:…` | The servers listed by that other domain may send for us |
| `-all` | Everyone else fails. `~all` means "probably not", a softer setting |
| `p=reject` | Our DMARC policy: refuse mail that fails |
| `rua=mailto:…` | Where receivers send reports about what they saw |

Look up your own organisation and your bank. A domain with no DMARC record, or with `p=none`, can be imitated in the `From` line far more easily than one with `p=reject`.

The `Authentication-Results` header is a small language of its own: results separated by semicolons, each a `check=outcome` pair followed by details. Pull the three outcomes out of it.

@code auth-results

Here's the trap that catches everyone. SPF and DKIM can pass for a domain you never see. **DMARC** is the check that ties them to the `From` line.

```
From: payroll@oasis-payroll.example
Authentication-Results: spf=pass smtp.mailfrom=mailer-77.example;
                        dkim=pass header.d=mailer-77.example;
                        dmarc=fail header.from=oasis-payroll.example
```

Both passed, but for `mailer-77.example`. That isn't the domain shown to the reader, so DMARC fails. A DMARC policy of `p=none` only reports, `quarantine` sends the mail to spam, and `reject` refuses it.

Alignment is the comparison at the heart of that example, and it's simple enough to write. In the usual "relaxed" mode, the authenticated domain must be the `From` domain or one of its subdomains.

@code dmarc-aligned

A pass doesn't mean it's safe: attackers authenticate their own lookalike domains too, and a hijacked real account passes everything.

@drill phish-auth

Lookalike domains work on the eye, not on the computer. `paypa1` uses a digit one for the letter l, `rnicrosoft` uses r and n for an m, and a real name with `-secure` or `-login` added is a different domain entirely. A program isn't fooled by shapes, so a rough detector only has to undo the common swaps and look for a brand name inside a domain that isn't the brand's own.

@code lookalike-domain

?? An email passes SPF, DKIM and DMARC for `paypa1-secure.example`. What does that prove?
+ That domain sent it, not that it's honest
- PayPal itself has verified and sent the message
- The links inside are all safe to click
- The attachment has been scanned for any malware
=> Authentication proves who sent it. Anyone can set these up on a lookalike domain.

## Workflow

@flow Preserve the original > Check headers > Inspect links and attachments safely > Who else got it? > Extract IOCs > Block and tell people > Document

Extract URLs without clicking, and check them with [URLScan](https://urlscan.io/) or hash lookups. When you write them down, **defang** them so nobody clicks: `hxxps://example[.]com`. The step people forget is **scope**: search mail logs for everyone who received it, and who clicked.

The link text a person sees and the address it goes to are two separate things. In the raw message, a link is written `<a href="ADDRESS">TEXT</a>`, and only the `href` matters. List every address without opening anything:

```
grep -oE 'https?://[^" <>]+' message.eml | sort -u
sha256sum invoice.pdf
```

The second command gives the hash to look up for an attachment you've saved to your isolated VM.

@code defang-url

Then act: remove the message from all mailboxes, block the sender and domain, and if anyone entered a password, reset it and check their sign-ins. Tell the person who reported it what you found, because a thank-you is what keeps people reporting.

::: tip Business email compromise
Some of the most costly fraud has no link or malware: just a plausible request to change bank details. Look for urgency, a changed payment process and a new reply-to address. Confirm through a separate channel.
:::

?? You've confirmed a phishing email. What's easy to forget, and very important?
+ Finding everyone else who received the email
- Replying to the sender to warn them
- Forwarding it to all staff as training
- Deleting it before you've recorded the evidence
=> One report usually means many recipients. Scoping tells you who's at risk.

## AI changed the bait

Bad grammar used to be a giveaway. Attackers now use language models to write fluent, personal messages in any language, so spelling proves nothing. Judge the **request** rather than the writing: is it unusual, urgent, or asking for money or credentials? Deepfake voices follow the same logic, and the [AI guide](/guides/d1-ai-what-changed/) covers them. The defence stays the same: verify through a second channel.

?? A perfectly written email from the "CEO" asks finance to urgently pay a new supplier. What's the best check?
+ Phone the CEO on a known number
- Check the email for any spelling mistakes
- Reply to the email asking for confirmation
- Pay a small amount to test it
=> Replying goes straight to the attacker. A separate, trusted channel defeats a convincing message.

## Read one message

This arrives in the reporting mailbox. Your company's real domain is `corp.example`.

```
From: "IT Support" <it-support@corp-helpdesk.example>
Reply-To: it.support.team@freemail.example
Subject: Your password expires today
Authentication-Results: spf=pass smtp.mailfrom=corp-helpdesk.example;
                        dkim=pass header.d=corp-helpdesk.example;
                        dmarc=pass header.from=corp-helpdesk.example
```

?? Every check passes. What still marks this message as suspicious?
+ A lookalike domain, and replies going elsewhere
- A subject line that mentions a password
- A display name written inside quotation marks
- A header that lists three separate results
=> `corp-helpdesk.example` isn't `corp.example`: whoever registered it set up SPF, DKIM and DMARC correctly for their own domain. The reply address on a free mail service confirms that IT didn't send it.

?? The body links to `https://corp-helpdesk.example/reset`. How do you write that in the ticket?
+ `hxxps://corp-helpdesk[.]example/reset`
- `https://corp-helpdesk.example/reset`
- `corp-helpdesk.example/reset`
- `HTTPS://CORP-HELPDESK.EXAMPLE/RESET`
=> Defanged, nobody can click it by accident and no chat tool will fetch a preview of it. The second and third forms are still live links in most programs.

?? Mail logs show that 40 people received it, and one of them typed their password into the page. What comes first?
+ Reset that password and end their sessions
- Email all forty people a long report
- Wait to see whether the account misbehaves
- Ask the user to be more careful
=> The password is in someone else's hands now. Close that door, then check the account's recent sign-ins, then remove the message from the other 39 mailboxes.

## Practise

Work through a real-looking report, from reading the headers to scoping.

@range phish

?! Write a short phishing triage playbook: six steps another analyst could follow.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [RFC 7208: SPF](https://www.rfc-editor.org/rfc/rfc7208)
- [RFC 6376: DKIM signatures](https://www.rfc-editor.org/rfc/rfc6376)
- [RFC 7489: DMARC](https://www.rfc-editor.org/rfc/rfc7489)
