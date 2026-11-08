---
title: Spotting web attacks and writing findings
summary: How web attacks look in logs, what a WAF can and can't do, scoring with CVSS 4.0, and writing a finding a developer can act on.
month: 8
minutes: 50
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

?! Write a finding for a flaw you've studied this month, using the structure above.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP Logging Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
