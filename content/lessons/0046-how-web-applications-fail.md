---
title: How web applications fail
summary: The defender's map of web security: why applications break, the OWASP Top 10:2025, and how to read a web request as evidence.
month: 8
minutes: 70
builds: explain the main classes of web flaw and read them in logs
source: OWASP Top 10:2025 | https://owasp.org/Top10/
words: trust boundary, OWASP Top 10, broken access control
---
Most of what companies put on the internet is a web application, so that's where most attacks land. This month you'll learn how those applications fail, and above all how to build and fix them so that they don't.

This course teaches the defender's side: the cause of each flaw, the fix, and how to spot it. To practise attacking on purpose, use [PortSwigger's free Web Security Academy](https://portswigger.net/web-security), which is built for it and legal.

@term OWASP = A non-profit community that publishes free guidance on application security.
@term OWASP Top 10 = OWASP's list of the most critical web application security risks.
@term broken access control = When a user can reach data or actions that they shouldn't.
@term client = The program making a request, usually a browser.
@term server-side = Running on the server, where the user can't change it.

## The one idea behind nearly everything

A web application is two programs. One runs in the user's browser, and you don't control it. The other runs on your server, and you do. Everything that crosses from one to the other, whether a form, a URL, a cookie or a header, comes from the user's side.

So here's the rule: **never trust anything that came from the client.** A dropdown limiting a price to three values means nothing, because a person can send any request they like with a simple tool. JavaScript checks in the browser help the user, and only checks on the server protect you.

@flow Browser (untrusted) > Web server (your rules run here) > Database (your data)

Nearly every flaw this month is that rule, broken in a different place.

See the boundary for yourself, on any page with a form. Open DevTools, pick the **Elements** tab, right-click a field and choose **Edit as HTML**. You can change a `maxlength`, add an option to a dropdown, or make a hidden field visible, and the page accepts it, because the page is running on your machine and belongs to you. Then submit, and watch the **Network** tab: the request carries whatever you put there. The developer's form was a suggestion.

The fix is always the same shape: the server keeps its own copy of the facts and uses the client's message only as a request. For a shop, the client may say which item and how many. It may not say what the item costs.

@code server-side-price

The second half of the rule is **validation**: before the server uses a value, it checks that the value is the kind of thing it expects. Good validation is an allow-list. It describes what is acceptable and refuses everything else, which is far safer than trying to list everything bad. A quantity is a whole number from 1 to 99, and nothing more needs saying.

@code valid-quantity

?? A shopping form sets the price in a hidden field, and the server uses that value. What's the flaw?
+ The server trusts a value from the client
- Hidden fields are too slow for checkout pages
- The form should have used a dropdown instead
- Prices must always be stored in a cookie
=> The user controls everything sent from the browser, hidden fields included. The server must look up the price itself.

## The map: OWASP Top 10:2025

The [OWASP Top 10](https://owasp.org/Top10/) is the industry's shared list. Learn the names, because job adverts and reports use them.

| Rank | Risk | In plain words |
|---|---|---|
| A01 | Broken Access Control | Users reach what they shouldn't, now including server-side request forgery |
| A02 | Security Misconfiguration | Unsafe settings, debug pages, default passwords |
| A03 | Software Supply Chain Failures | Risky dependencies and build systems |
| A04 | Cryptographic Failures | Data poorly protected |
| A05 | Injection | Input treated as code |
| A06 | Insecure Design | The plan itself is flawed |
| A07 | Authentication Failures | Logins that can be bypassed or guessed |
| A08 | Software or Data Integrity Failures | Trusting updates or data without checking them |
| A09 | Logging and Alerting Failures | Attacks go unnoticed |
| A10 | Mishandling of Exceptional Conditions | Errors handled unsafely, such as failing open |

Notice that only some of these are coding mistakes. Design, configuration and logging are on the list too, so a team needs more than careful programmers.

A name is easier to keep once it has a face. Here is each one as something that really happens, with the default that prevents it:

| Risk | An everyday example | What prevents it |
|---|---|---|
| A01 | Changing `/orders/15` to `/orders/16` shows a stranger's order | An ownership check on every route |
| A02 | An admin panel still has the password it shipped with | A hardened baseline, reviewed on a schedule |
| A03 | A library pulled in by the build was taken over | Pinned versions and dependency scanning |
| A04 | Passwords stored with a fast, unsalted hash | Argon2id, and TLS everywhere |
| A05 | A search box whose text becomes part of a SQL query | Parameterised queries |
| A06 | "Forgot password" asks for your mother's maiden name | Threat modelling before building |
| A07 | No limit on login attempts | Rate limiting and MFA |
| A08 | An update is installed without checking its signature | Signed updates, verified before use |
| A09 | An attack ran for a month and nobody saw it | Logs that someone actually reads, with alerts |
| A10 | A permissions check crashes, and the request goes through | Failing closed |

?? Which of these is a design flaw rather than a coding mistake?
+ A password reset that relies on guessable answers
- A typo that skips one small validation function
- A missing closing bracket in an HTML page
- A variable name that was misspelt in code
=> The code can work perfectly and still be unsafe, because the idea is flawed. That's A06, Insecure Design.

## Reading a request

Everything you investigate this month starts here. This is a line from a web server's access log:

```
203.0.113.7 - - [27/Oct/2026:22:14:21 +0000] "GET /invoices/1043 HTTP/1.1" 200 1893
```

| Part | Meaning |
|---|---|
| `203.0.113.7` | Who asked |
| `GET` | The method: reading |
| `/invoices/1043` | What they asked for |
| `200` | The server said yes |
| `1893` | How many bytes were sent |

Now imagine that user requesting `/invoices/1044`, `/invoices/1045` and so on, and always getting `200`. Nothing looks like an error. Without a check that invoice 1044 belongs to them, the log shows a data theft that looks like normal browsing.

That pattern is something a program can look for. One request for an invoice is ordinary. A long run of neighbouring numbers from one user is a person walking down a corridor and trying every door.

@code sequential-ids

?? A log shows one user fetching invoices 1000 to 1400 in order, all with status 200. What should worry you?
+ They may well be reading other customers' invoices
- The server is returning far too few errors
- Their browser probably has a broken cache setting
- Invoices aren't supposed to use the GET method
=> Sequential IDs with successes are the classic trace of a missing ownership check. Lesson 48 is about fixing this.

## Prevention beats patching

Testing finds flaws one at a time. Good defaults remove whole classes of them. A template engine that escapes by default stops most cross-site scripting. A query library with parameters stops most SQL injection. A framework that checks permissions on every route stops forgotten checks. As you read the next lessons, keep asking: what could make this mistake impossible?

@drill web-class

?? A team fixes the same flaw for the fifth time. What's the strongest next step?
+ Change the default, so it can't ever recur
- Run one more training session on the topic
- Ask developers to be more careful from now
- Add a line about it to the wiki
=> Secure defaults beat reminders. Make the safe way the easy way, and the whole class of flaw disappears.

## Failing closed

Sooner or later a check will break: the database is slow, a service is down, a value is missing. What the code does at that moment is a security decision that somebody made, often without noticing. Read this function slowly:

```python
def can_view(user, invoice_id):
    try:
        owner = lookup_owner(invoice_id)
        return owner == user.id
    except Exception:
        return True      # WRONG: an error opens the door
```

Whoever wrote the last line wanted the page to keep working during an outage. The effect is that anyone who can cause an error, with an odd ID or simply by asking at a busy moment, sees every invoice. That's **failing open**. The safe version **fails closed**: when the check can't be completed, the answer is no, and the error goes to the log where someone will see it.

```python
    except Exception:
        log.exception("ownership check failed for invoice %s", invoice_id)
        return False
```

?? A payment site's fraud-check service stops answering. What should the site do with new orders?
+ Hold them, and alert the team quickly
- Accept them, since the check can't refuse
- Accept them, but only for returning customers
- Delete them, without telling the customers anything
=> When a control can't run, the safe default is to stop and say so. Letting everything through turns an outage into a way around the control.

## A first look from outside

Some weaknesses can be read without logging in, because the server announces them. Ask any site for its response headers only:

```
curl -I https://example.com
```

```
HTTP/2 200
server: Apache/2.4.49 (Unix)
x-powered-by: PHP/7.2.1
content-type: text/html
```

| What you see | What it tells a reviewer |
|---|---|
| `server` and `x-powered-by` with version numbers | The site tells every visitor exactly which software to look up |
| No `strict-transport-security` | Browsers aren't told to insist on HTTPS |
| No `content-security-policy` | The browser gets no rules about which scripts may run |
| No `x-content-type-options: nosniff` | Browsers may guess a file's type, and guess wrong |

None of these is a break-in. Each one is a setting left at its default, and together they tell you how carefully the rest was configured. Run it against your own lab server and against a large well-known site, and compare the two lists.

?? A site's headers read `server: Apache/2.4.49` and `x-powered-by: PHP/7.2.1`. Which Top 10 risk is that?
+ Security Misconfiguration: it advertises its exact versions
- Injection: the headers contain some hidden code
- Broken Access Control: anyone can read headers
- Cryptographic Failures: the headers are not encrypted
=> Headers are meant to be read. The fault is the setting that prints version numbers, which saves an attacker the work of finding out what's running.

?! In your own words, explain why "never trust the client" matters, using one example from an app you use.
