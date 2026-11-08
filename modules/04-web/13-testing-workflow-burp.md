---
title: The web testing workflow
summary: How an authorised assessment runs from scope to report. Using Burp and ZAP properly, content discovery, automated scanners and their limits, and writing findings that get fixed.
level: intermediate
side: both
minutes: 45
attack: T1595.003
needs: 0035-how-the-web-works, 0056-how-a-pentest-works
pair: 12-02-disclosure-and-ethics, 04-14-owasp-2025-gaps
source: OWASP Web Security Testing Guide | https://owasp.org/www-project-web-security-testing-guide/
words: intercepting proxy, target scope, content discovery
---
Web testing isn't about running a tool and reading its output. It's a method for understanding an application, then testing specific assumptions, with evidence. This module gives you that workflow, using the same tools that professionals use, on targets built for practice. Lesson 56 explained how an engagement works from the defender's side.

@term intercepting proxy = A tool sitting between browser and server, which lets you view and change traffic.
@term content discovery = Finding pages and endpoints that aren't linked, by testing likely names.

## Concept

### Fundamentals: the method

@flow Scope and rules > Map the application > Analyse > Test each hypothesis > Verify > Report and retest

**Scope** comes first, in writing. Set it in your tools as well, so that they can't wander. See [Computer crime law](/modules/12-01-computer-crime-law/).

**Mapping** means using the app as a real user, with the proxy recording: each role, each feature. Then ask: what does this do, who's it for, and what does it assume?

### Burp Suite

| Tool | Use |
|---|---|
| Proxy | See all traffic |
| Target, Scope | Stay inside your authorisation |
| Repeater | Resend one request by hand, with changes |
| Intruder | Run many variations (throttled in the free edition) |
| Logger | A full history |
| Decoder, Comparer | Handle encodings, compare responses |
| Collaborator (Pro) | Detect out-of-band interactions |

**Repeater is where testing really happens.** You change one thing, and read how the response differs. A skilled tester thinks in small experiments: what does the server do with a different ID, a missing field, a second role's cookie? The [Autorize](https://portswigger.net/bappstore/f9bbac8c4acf4aefa4d7dc92a991af2f) extension replays requests as another user, which is a very efficient way to find access control flaws.

**OWASP ZAP** is the free, open-source alternative, and it's good for automation in CI, as in project P14. [Burp's docs](https://portswigger.net/burp/documentation/desktop) show the proxy setup.

### Discovery tools

| Tool | Use |
|---|---|
| ffuf, gobuster, dirsearch | Find unlinked paths with wordlists |
| SecLists | Common wordlists |
| Nikto | Known server misconfigurations, noisy |
| WPScan | WordPress checks |
| Nuclei | Template-based known-issue checks |

These generate a lot of traffic, and that shows up in logs. Throttle them, and keep them within scope.

### What automation can't do

Automated scanners are good at known patterns, such as outdated components, missing headers or reflected values. They're weak on [authorisation](/modules/04-12-api-security-graphql-grpc/) and [logic](/modules/04-11-logic-flaws-and-races/), the very things behind most serious findings. So use them for coverage, and use your own judgement for depth.

### Advanced: quality of findings

**Verify everything.** A scanner's report isn't a finding until you've confirmed it. False positives destroy trust.

**Prove the minimum.** Show access with your own test accounts, and stop, as [Disclosure and ethics](/modules/12-02-disclosure-and-ethics/) says.

**Write for the fixer.** A good finding has a title, severity with reasoning, the affected location, steps to reproduce, impact in business terms, and a specific fix. Lesson 50 practised this.

**Retest.** Confirm the fix, and look for variants. A good test ends with regression tests in the client's pipeline.

**Know the alternatives.** Code review finds more per hour than black-box testing, when you have the code. Mix both where you can.

?? What's Burp Repeater mainly for?
+ Resending one changed request by hand
- Encrypting a session's traffic for clients
- Hosting a copy of the website
- Storing each tester's saved passwords safely
=> It lets you run small experiments on a single request, and compare the responses.

## Threat model

Attackers use the same tools, with [wordlist scanning](https://attack.mitre.org/techniques/T1595/003/) among the loudest. For defenders, the patterns are visible: many 404s from one source, or a tool's default user agent. Testers themselves carry risk: a mistaken test can delete data, or lock accounts, so agree on limits for destructive actions.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Burp Suite Community | Proxy and manual testing | Most learning |
| OWASP ZAP | Open-source proxy and scanner | CI automation |
| ffuf | Fast content discovery | Finding hidden paths |
| Nuclei | Template checks | Known issues |
| Browser developer tools | See client behaviour | Always |
| [Web Security Academy](https://portswigger.net/web-security) | Free labs | The best legal practice |

## Defence

From the defender's side:

- **Use these tools on your own apps,** and add ZAP to CI.
- **Rate limit,** and watch for bursts of 404s.
- **Include testers early,** with test accounts and a staging environment.
- **Remove what shouldn't be reachable:** backups, `.git`, admin panels.
- **Track retests** to closure.
- **Test with roles.** Keep test users at each privilege level.

## Pitfalls

- **Running a scanner on production without agreement.** It can fill databases and send emails.
- **Reporting raw scanner output.**
- **Testing only as one user.** Access control needs two.
- **Ignoring the mobile or API layer.**
- **Going out of scope** because a link led there.

?? Why set a target scope first?
+ It keeps the tools inside your authorisation
- It makes the target's server respond faster
- It hides your traffic from any logs
- It removes the need for written permission
=> Tools follow links and redirects, so scope stops them from touching systems you're not allowed to test.

## Exercise

::: law Lab only
Use OWASP Juice Shop in Docker, DVWA, or PortSwigger's labs. Never point these tools at a site without written permission.
:::

1. Run Juice Shop in Docker. Set Burp's scope to `localhost`.
2. Map the app using the proxy, with two user accounts.
3. In Repeater, take one authenticated request, and change an ID. Compare.
4. Run `ffuf` with a small wordlist against your local instance, and read what's unlinked.
5. Run ZAP's baseline scan. Verify two findings by hand, and label each as true or false.
6. Write one complete finding, then fix it in a local copy.

?! Write a one-page test plan for a small online shop: scope, roles, what you'd test first, and what you won't do.

## Further reading

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/).
- [Burp Suite documentation](https://portswigger.net/burp/documentation/desktop).
- [ZAP documentation](https://www.zaproxy.org/docs/).
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/).
- [Web Security Academy](https://portswigger.net/web-security).
