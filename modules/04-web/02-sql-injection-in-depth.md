---
title: SQL injection in depth
summary: Why injection still appears, its classes as seen in code review and in logs, why ORMs and WAFs aren't complete answers, and how to build database access that can't be injected.
level: intermediate
side: defence
minutes: 45
attack: T1190
needs: 0037-databases-and-sql, 0047-keeping-input-out-of-the-code
pair: 04-03-injection-beyond-sql
source: OWASP SQL Injection Prevention Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html
words: second-order injection, blind injection, query builder
---
SQL injection has been understood since the late 1990s, and it still sits near the top of the CWE Top 25. Lessons 37 and 47 taught the fix: parameters. This module is for the code reviewer and the defender. It explains the variants, so that you recognise them in code and logs, and where well-meant protections fall short. To practise attacking it, use PortSwigger's free labs.

@term second-order injection = Injection in which stored data is later built into a query unsafely.
@term blind injection = Injection where the application shows no query results, so information leaks only through behaviour.
@term query builder = A library that composes SQL through an API, usually with bound parameters.

## Concept

### Fundamentals: one root cause

The database receives one string, and it parses it. If user data is concatenated into that string, then the parser can't tell data from instructions. **Parameterised queries** send them separately, so the data can never become code.

| Unsafe | Safe |
|---|---|
| String building with `+` or f-strings | Bound parameters |
| Escaping by hand | Driver-level binding |
| Dynamic table names from input | An allow-list mapping |

### Classes, as a reviewer sees them

| Class | What's special | Why it matters to defenders |
|---|---|---|
| In-band | Results appear in the page | Easiest to find, and loudest |
| Error-based | Database errors leak data | Generic error pages reduce it |
| Blind | Only true or false behaviour | Thousands of similar requests |
| Time-based | Only response delay differs | Timing anomalies in logs |
| Out-of-band | The database contacts outside | Egress from database servers |
| **Second-order** | Stored, then used later | Input filtering doesn't help |

**Second-order** deserves a note. A value is stored safely with parameters, and months later, a report builds a query by concatenating it. The input route was clean, and the vulnerable line sits elsewhere. So the rule must be **parameterise everywhere**, including data read from your own database. It isn't "trusted" just because it came from inside.

### Where the fix doesn't reach

**ORMs** parameterise by default, yet they offer raw query methods. Search for `raw()`, `execute()` with f-strings, or `Sequelize.literal`.

**Stored procedures** are safe only if they don't build dynamic SQL inside.

**Identifiers.** Parameters can't bind table or column names, or `ORDER BY` direction. Sort options from a query string are a classic gap. Use an allow-list that maps input to fixed values.

**LIKE and IN clauses.** Developers often fall back on concatenation for variable-length lists. Generate placeholders instead.

### Advanced: containing the damage

Assume that one query will be wrong one day.

| Control | Effect |
|---|---|
| Least-privilege DB user | Can't drop tables or read others |
| Separate accounts per service | Limits blast radius |
| No `FILE`, `xp_cmdshell` or similar | Stops escape to the OS |
| Egress block on database servers | Stops out-of-band leaks |
| Column encryption | Limits what a dump gives |

A web app's database user should never own the schema. Migrations should run under a separate account.

**WAFs** match patterns, so they buy time for a known flaw, yet they can't understand your application. Treat them as a patch-delay tool, and never as the fix. See [lesson 50](/courses/0050-spotting-attacks-and-writing-findings/).

?? What makes second-order injection harder to find?
+ The stored value runs later, somewhere else
- The database encrypts each query by default
- The attacker must hold a valid certificate
- The payload disappears after the first login
=> The input path looks clean, while the unsafe query is in another feature, reading stored data.

## Threat model

Injection is a classic route for [exploiting a public-facing application](https://attack.mitre.org/techniques/T1190/). The usual goals are reading data, bypassing login, or reaching the host through database features. Automated scanning means that a new flaw on the Internet is found quickly. Tools such as sqlmap are widely known, so assume that attackers have automation.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Semgrep, CodeQL | Find unsafe query building | Code review, CI |
| ORM query logging | Shows real SQL | Checking what's sent |
| Database audit logs | Record queries and errors | Detection |
| sqlmap | Automated testing | Authorised tests, or labs |
| [Web Security Academy](https://portswigger.net/web-security/sql-injection) | Free labs | Legal hands-on practice |

## Defence

- **Parameterise every query,** with no exceptions.
- **Add a lint rule** that blocks string-built SQL.
- **Allow-list identifiers** such as sort columns.
- **Use a least-privilege database account.**
- **Return generic errors,** and log details server-side.
- **Block database egress.**

**Detection.** Look for bursts of database errors, repeated requests differing by small changes, unusual response times on one endpoint, and queries touching `information_schema` from an application account.

## Pitfalls

- **"We use an ORM."** Check for raw queries.
- **Escaping as the fix.** It's fragile, and it depends on context and encoding.
- **Validating input instead of binding.** It's a helpful extra layer, not the fix.
- **Trusting data from your own database.**
- **Thinking that blind injection is minor.** Automation extracts everything, one bit at a time.

?? Why can't a WAF replace parameterised queries?
+ It filters patterns, and doesn't fix code
- It only inspects traffic on port 25
- It slows each request by several minutes
- It can't read any HTTPS request headers
=> The flaw stays in the application, and any request form that the filter misses still reaches it.

## Exercise

::: law Lab only
Practise on PortSwigger's Web Security Academy, or on code you wrote and run locally. Testing for injection on a real site without written permission is illegal in most countries.
:::

1. Write a small Flask login using string concatenation, and another using parameters. Show with unit tests that odd input changes the first query's meaning, but not the second.
2. Add Semgrep to your project, and confirm that it flags the first version.
3. Add a "sort by" parameter safely, using an allow-list.
4. Create a read-only database role for the app, and confirm that it can't drop a table.
5. Complete three SQL injection labs on Web Security Academy.
6. Write a detection from your lab's database logs for a burst of syntax errors.

?! A code review finds `f"SELECT * FROM users ORDER BY {sort}"`. Write the finding, a realistic impact, and the exact fix.

## Further reading

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html).
- [CWE-89](https://cwe.mitre.org/data/definitions/89.html).
- [Web Security Academy on SQL injection](https://portswigger.net/web-security/sql-injection).
- [OWASP Database Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html).
