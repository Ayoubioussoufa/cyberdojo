---
title: Spotting web attacks and writing findings
summary: How web attacks look in logs, what a WAF can and can't do, scoring with CVSS 4.0, and writing a finding a developer can act on.
month: 8
minutes: 75
builds: five professional findings, each with a regression test
source: OWASP Web Security Testing Guide | https://owasp.org/www-project-web-security-testing-guide/
words: WAF, CVSS, regression test
---
Finding a flaw is half the job. The other half is seeing it in your logs and writing it so that someone fixes it. A finding nobody understands is a finding that stays open.

@term CVSS = The Common Vulnerability Scoring System, a standard way to rate a flaw's technical severity.
@term regression test = A test that stops a fixed bug from quietly coming back.
@term finding = A written report of one security problem, with evidence and a fix.

## What attacks look like in logs

Logs rarely say "attack". They show patterns, and context makes them meaningful.

| Pattern in the access log | May mean |
|---|---|
| Many `404`s for paths that don't exist | A tool guessing at content |
| One IP walking through sequential IDs | Testing for IDOR, or scraping |
| Odd characters in query strings, then a `500` | Probing for injection |
| Hundreds of `POST /login`, one `200` | Password guessing that worked |
| A new `.php` file, then requests with parameters | A web shell |
| A sudden burst of `429`s | Your rate limit doing its job |

You don't need a SIEM to see these patterns. In the access-log format from lesson 35, the address is the first field of each line, the path is the seventh and the status is the ninth, so the pipeline from Month 1 answers most first questions:

```
awk '{print $9}' access.log | sort | uniq -c | sort -rn                      how many of each status?
awk '$9 == 404 {print $1}' access.log | sort | uniq -c | sort -rn | head     who causes the most 404s?
grep 'POST /login' access.log | awk '{print $1, $9}' | sort | uniq -c        logins per address and result
awk '$9 == 500 {print $7}' access.log | sort | uniq -c | sort -rn | head     which paths make the server fail?
```

Run the first one on any real log and you'll see a shape: mostly `200`, some `304` and `404`. That shape is your baseline, and an investigation usually starts with the hour when it changed.

Requests arrive percent-encoded, and you can't judge what you can't read. Decode before you decide:

```
python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1]))" '/search?q=%27%20OR%201%3D1--'
```

The same counting works in Python, where it's easier to keep and to test.

@code status-by-ip

The fourth row of the table, failures and then one success, is the pattern most worth automating, because it's the one where the attacker won.

@code guessed-logins

Status codes matter. A pile of `404`s and `403`s mostly shows a failed attempt. A `200` or `500` in the same pattern deserves a much closer look.

Application logs matter too. Record logins, failures, permission refusals and admin actions, with a user ID. OWASP's A09 exists because many breaches went unnoticed for months.

?? An IP sends 300 requests for pages that don't exist, all returning 404. How urgent is that?
+ Low: automated scanning, unless something later on succeeds
- Critical: the server has certainly been fully compromised
- Critical: you should call the police right now
- None: 404 errors can't ever appear in logs
=> Scanning is constant background noise on the internet. Watch for what changes the picture: a success.

## What a WAF can and can't do

A **WAF** sits in front of an application and blocks requests matching known patterns. It's useful for buying time, for instance while a patch for a new flaw is rolled out. It's no substitute for a fix, though. It can't know that invoice 1044 isn't yours, and attackers rewrite requests to slip past patterns.

| Good for | Not good for |
|---|---|
| Blocking common automated scans | Access control flaws |
| Virtual patching for a short time | Business logic problems |
| Giving you a signal to monitor | Replacing secure code |

A WAF also gets things wrong in the other direction. A customer called O'Brien, or a forum post that quotes some SQL, can match a pattern and be blocked. That's why teams switch a new rule on in **detection mode** first: the rule logs what it would have blocked, somebody reads a week of those logs, and only then does it start refusing requests. It's the same idea as report-only mode for Conditional Access, and for the same reason.

?? Your team wants to skip fixing SQL injection because a WAF is deployed. What do you say?
+ It's a temporary layer, so fix the code
- That's fine, since WAFs block every possible attack
- Remove the WAF, because it makes attacks worse
- Move the database to a different cloud region
=> A WAF reduces exposure and doesn't remove the flaw. The fix belongs in the code.

## Severity: CVSS 4.0

[CVSS](https://www.first.org/cvss/v4.0/specification-document) gives a score from 0 to 10. Version 4.0 has four metric groups: Base, Threat, Environmental and Supplemental.

| Rating | Score |
|---|---|
| None | 0.0 |
| Low | 0.1–3.9 |
| Medium | 4.0–6.9 |
| High | 7.0–8.9 |
| Critical | 9.0–10.0 |

The name tells you what went in: `CVSS-B` is Base only, and `CVSS-BTE` includes Threat and Environmental metrics. A published CVE usually gives a Base score, which knows nothing about your environment. A severity tells you how bad a flaw could be, not how urgent it is for you. [Lesson 55](/courses/0055-vulnerability-management/) covers that difference.

Beside every score there's a **vector**, a compact record of the answers that produced it. Learn to read one, because the vector tells you why:

```
CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N
```

| Part | Question | Here |
|---|---|---|
| `AV` | Attack vector: from where? | `N`, over the network |
| `AC` | Attack complexity | `L`, low |
| `AT` | Attack requirements: any special conditions? | `N`, none |
| `PR` | Privileges required | `L`, an ordinary account |
| `UI` | User interaction: must a victim do something? | `N`, no |
| `VC`, `VI`, `VA` | Impact on the vulnerable system's confidentiality, integrity, availability | High, none, none |
| `SC`, `SI`, `SA` | The same three for other systems reached through it | None |

Read as a sentence: anyone with an ordinary account can, over the network and with no special conditions, read data they shouldn't, without changing or stopping anything. That's the invoice flaw from lesson 48. FIRST publishes a [calculator](https://www.first.org/cvss/calculator/4.0) that turns the answers into a score.

@code cvss-rating

@drill cvss-band

?? A CVE lists `CVSS-B 9.1`. What does that score not tell you?
+ Whether it's being exploited, or matters to you
- How severe the flaw is in technical terms
- That it falls in the Critical rating band
- That a numerical score was calculated at all
=> Base scores describe the flaw itself, and they stay constant. Threat and environment are separate questions.

## Writing a finding

Use a fixed structure. Developers should be able to read it, reproduce it and fix it without asking you anything.

```
Title:     Any customer can read other customers' invoices
Severity:  High (CVSS-B 7.1). Exposes billing data of all customers.
Impact:    A logged-in customer can read every invoice in the system.
Steps:     1. Log in as test user A.
           2. Request /invoices/1044, which belongs to test user B.
           3. The server returns B's invoice with status 200.
Evidence:  Request and response attached, with test accounts only.
Fix:       Limit the lookup to the current user:
           Invoice.get(id=invoice_id, owner_id=current_user.id)
Retest:    Added test_customer_cannot_read_other_invoice.
```

Lead with the business impact. "Any customer can read every invoice" gets fixed. "IDOR on /invoices" waits in a queue.

Compare with the version that most first findings look like:

```
Title:     IDOR
Severity:  Critical!!
Details:   The invoices endpoint is vulnerable. Fix ASAP.
```

A developer reading that doesn't know which request, which account, what "vulnerable" means here, or how they'd know when it's fixed. Every part of the structure above exists to answer a question that somebody would otherwise have to come and ask you. A finding is finished when it needs no meeting.

A checklist can't judge whether a finding is well written, and it can at least catch one that's incomplete before it's sent.

@code finding-gaps

?? Which title will get a finding fixed fastest?
+ Any customer can read every customer's invoice
- Improper object reference in the invoices route
- Possible authorization weakness detected by automated tool
- Security issue number 14 in the report
=> Say what can happen, in plain words. Severity comes from the impact, so state the impact first.

## Prove the fix stays fixed

A fix without a test can come back in a later change. A **regression test** fails on the broken code and passes on the fixed code.

```python
def test_customer_cannot_read_other_invoice(client, user_a, user_b):
    invoice = make_invoice(owner=user_b)
    client.login(user_a)
    assert client.get(f"/invoices/{invoice.id}").status_code in (403, 404)
```

Run it before the fix, and watch it fail. Then fix the code, and watch it pass. That order proves that the test really tests the bug.

?? Why should you see a regression test fail before you fix the bug?
+ It proves the test detects the real bug
- Failing tests make the final code run faster
- Test frameworks refuse any test that passes first
- It gives the attacker a chance to stop
=> A test that passes on broken code proves nothing. Red, then green, shows that it works.

::: try Your Month 8 gate
Solve the PortSwigger labs at their pace, with notes per flaw in your own words. Write five findings in the format above. Add three flaws to your Month 6 app on a branch, fix each one, and leave a regression test behind. See the [Month 8 plan](/roadmap/8/).
:::

## Triage one night's log

It's Monday morning. This is part of last night's access log for the customer portal. The two middle lines stand for 212 more like the first.

```
198.51.100.23 - - [15/Nov/2026:02:11:04 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:11:05 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:14:50 +0000] "POST /login HTTP/1.1" 401 512
198.51.100.23 - - [15/Nov/2026:02:14:51 +0000] "POST /login HTTP/1.1" 200 1840
198.51.100.23 - - [15/Nov/2026:02:15:03 +0000] "GET /account/export HTTP/1.1" 200 48211
```

?? What does that sequence show?
+ A password was guessed, then data was exported
- A customer forgot their password, then gave up
- A scanner was blocked by the rate limit
- A server error caused the logins to fail
=> Hundreds of refusals, one success, then a large download from the same address twelve seconds later. The `200` on the login is the moment the attack succeeded.

?? What do you do first?
+ Lock that account and end its sessions
- Block all logins for every single customer
- Wait a week to see it recur
- Delete the log lines to save space
=> Stop the access that's still open, then investigate. The session created at 02:14:51 may still be valid, so changing the password alone isn't enough.

?? Which number tells you roughly how much data left?
+ The 48211 at the end of that export
- The 512 at the end of failed logins
- The 200 shown in the status code column
- The 23 at the end of the address
=> The last field is the size of the response in bytes. About 48 KB went out, which is what you compare with the size of a normal export when you write the impact.

?! Write a finding for a flaw you've studied this month, using the structure above.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
