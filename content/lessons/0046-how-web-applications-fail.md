---
title: How web applications fail
summary: The defender's map of web security: why applications break, the OWASP Top 10:2025, and how to read a web request as evidence.
month: 8
minutes: 50
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

?! In your own words, explain why "never trust the client" matters, using one example from an app you use.
