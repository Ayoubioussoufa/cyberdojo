---
title: Threat modeling and secure code
summary: The four questions, data-flow diagrams and STRIDE, ASVS requirements, secure code review, and building security into development.
month: 17
minutes: 80
builds: a threat model traced to ASVS requirements
source: Threat Modeling Manifesto | https://www.threatmodelingmanifesto.org/
words: threat model, trust boundary, STRIDE
---
Finding bugs one at a time never ends. Threat modeling and secure development prevent whole classes of them, before a line is shipped. Changing a design on a whiteboard costs minutes. Changing it after launch can cost months.

@term threat model = A structured analysis of what could go wrong with a system and what to do about it.
@term data-flow diagram (DFD) = A diagram showing how data moves through a system.
@term trust boundary = A line where data passes between different levels of trust.
@term STRIDE = A checklist of threat types: spoofing, tampering, repudiation, information disclosure, denial of service, elevation of privilege.
@term ASVS = OWASP's Application Security Verification Standard: a list of security requirements.
@term SAST = Static application security testing: scanning source code for flaws.
@term DAST = Dynamic application security testing: testing a running application.
@term SCA = Software composition analysis: checking dependencies for known flaws.
@term Semgrep = A code-scanning tool with rules you can write yourself.
@term secure SDLC = Building security into every stage of developing software.
@term sink = A place in code where input can cause harm, such as a database query.

## Four questions

The [Threat Modeling Manifesto](https://www.threatmodelingmanifesto.org/) boils it down:

1. What are we working on?
2. What can go wrong?
3. What are we going to do about it?
4. Did we do a good enough job?

No tool is needed. A whiteboard and four people in a room will do. It belongs early in the **secure SDLC**, while changing course is still cheap.

?? When does threat modeling give the most value?
+ During design, before the expensive code exists
- After a breach has already been reported
- Only in the final week before launch
- Once a year, whatever gets built next
=> Design flaws are cheap to fix on paper and costly in production. It's an activity, not a yearly form to fill in.

## STRIDE on a diagram

Draw how data flows, mark where it crosses **trust boundaries**, then walk through STRIDE at each crossing. Here's a login, as a **data-flow diagram**:

```
 Browser  ──credentials──▶ │ Web app ──query──▶ │ Database
 (untrusted)               │ (trusted)          │ (more trusted)
                     boundary 1           boundary 2
```

A browser is controlled by the user, so nothing from it can be trusted. Now take boundary 1 and ask each STRIDE question:

| Threat | At this crossing | Mitigation |
|---|---|---|
| **S**poofing | Someone logs in as another person | MFA, rate limiting |
| **T**ampering | Request changed in transit | TLS |
| **R**epudiation | "I never logged in" | Login audit log |
| **I**nformation disclosure | Error reveals that an account exists | Generic errors |
| **D**enial of service | Password floods exhaust the server | Rate limiting |
| **E**levation of privilege | A normal user reaches admin functions | Check the role on the server |

Not every threat applies to every element. **STRIDE per element**, from Adam Shostack's work at Microsoft, says which letters to ask about for each kind of box or arrow on the diagram:

| Element | Drawn as | Threats to ask about |
|---|---|---|
| External entity, such as a user or partner | A rectangle | S, R |
| Process, such as the web app | A circle | S, T, R, I, D, E |
| Data store, such as the database | Two parallel lines | T, I, D, and R when it stores logs |
| Data flow | An arrow | T, I, D |

A data store can't spoof anyone, and an arrow can't elevate its privileges, so skipping those questions isn't laziness. It leaves time for the ones that matter. A log store gets R because a log that can be altered can't settle an argument about who did what.

@code stride-per-element

The boundaries can be found mechanically too. Give each element a trust level, and every flow between two different levels crosses a boundary. Flows from a lower level into a higher one are where input must be checked.

@code boundary-crossings

@drill stride

Write each threat as a sentence someone could act on: who, doing what, by what means, leading to which harm.

> An attacker on the internet could log in as a customer by trying leaked passwords against the login form, leading to their orders and address being exposed.

"Hackers could attack the login" can't be tested or fixed. The sentence above names the mitigation by itself: rate limiting, MFA and a check against known breached passwords. Then rank the threats with likelihood and impact, as in lesson 60, so the team fixes the worst first.

?? Where do you focus first on a data-flow diagram?
+ Where data crosses a trust boundary
- The box with the most features
- The components with the newest code
- The part with the nicest diagram
=> Data crossing from less trusted to more trusted is where validation and checks belong.

## Requirements, not opinions

[ASVS 5.0](https://asvs.owasp.org/), released in May 2025, turns "be secure" into testable requirements. Trace each mitigation to one. That way, "is this secure?" becomes "does this meet these listed requirements?", which an engineer can test and a reviewer can check.

?? Why trace a mitigation to an ASVS requirement?
+ It turns an opinion into something testable
- ASVS requirements make the application run faster
- It removes any need for further reviews
- Law requires ASVS for all web applications
=> A named, testable requirement can be verified by anyone, and it ends arguments based on taste.

## Secure code review

Don't read code from top to bottom. Follow the danger:

- **Entry points:** where does outside input arrive?
- **Sinks:** where could input cause harm, like a query, a shell command, or a page?
- **Authentication:** is every route protected?
- **Authorization:** is it checked for **each object**, not just each page?
- **Secrets:** are any in the code?
- **Errors:** do they reveal internals, or fail open?

The classic pair to recognise:

```python
# Unsafe: the input becomes part of the query's text
cur.execute(f"SELECT * FROM items WHERE name = '{value}'")

# Safe: the query and the value travel separately
cur.execute("SELECT * FROM items WHERE name = %s", (value,))
```

A scanner can find the first kind of flaw by its shape. A query built from an f-string, a `%` or a `+` looks the same in every file:

@code sql-string-builds

The second kind, authorisation, has no shape. Each route that takes an object's ID needs its own check that this user may see that object:

```python
@app.get("/invoices/<int:invoice_id>")
@login_required
def get_invoice(invoice_id):
    invoice = Invoice.query.get_or_404(invoice_id)
    if invoice.owner_id != current_user.id:
        abort(404)
    return render_invoice(invoice)
```

`@login_required` answers "who are you?". The `if` answers "is this invoice yours?". Without it, any logged-in customer can read every invoice by changing the number in the address. Returning 404 rather than 403 also avoids confirming that the invoice exists. A review lists every route and asks both questions of each.

@code route-audit

Turn repeated findings into [Semgrep rules](https://semgrep.dev/docs/writing-rules/overview), so that a person only has to find each kind once:

```yaml
rules:
  - id: python-fstring-sql
    pattern: $CUR.execute(f"...")
    message: Pass values as parameters, not inside the query text.
    languages: [python]
    severity: ERROR
```

Running the rule takes one command, and the same command goes in CI:

```
semgrep scan --config python-fstring-sql.yaml src/
```

It prints each match with its file and line, and exits with an error code when something matches, which is what lets a pipeline fail the pull request.

@range appsec

?? Which kind of flaw is a human reviewer most likely to catch before a scanner does?
+ A missing permission check on one route
- A hard-coded key in a known format
- A library that has a published CVE
- An obvious call to a banned function
=> Scanners match patterns that exist. A missing check has no pattern, so knowing what the code should do is a human skill.

## The pipeline of checks

| Check | Finds | When |
|---|---|---|
| Secret scanning | Keys in code | Before commit |
| SAST | Risky code patterns | On each commit |
| SCA | Known-vulnerable dependencies | On each commit |
| IaC scanning | Unsafe cloud and container settings | On each commit |
| DAST | Issues in the running app | Before release |

No single tool is enough. The roadmap's [code-review duel](/guides/d3-using-ai-well/) makes that visible: you versus a scanner versus an LLM.

@drill pipeline-check

?? A team asks which tool would flag a vulnerable version of a library. What's the answer?
+ SCA, which compares dependencies with known flaws
- DAST, which reads your own source code
- SAST, which only scans the production database
- A code formatter, fixing the library's style
=> SCA is built for known-vulnerable components. SAST looks at your code, and DAST tests the running application.

## Review a threat model

A team sends you their threat model for a new invoice portal. Three lines stand out.

```
Scope:      the customer web app (the admin API is internal, so out of scope)
Threat 4:   hackers could attack the portal
Mitigation: an AI system will detect and block attacks
```

?? What's the problem with the scope?
+ Internal services are still reachable by attackers
- Admin APIs are never worth threat modeling
- The scope should list every developer's name
- Threat models should cover a single page
=> "Internal" isn't a trust level. An attacker who reaches any internal machine, or tricks the web app into calling the admin API, is on the inside. Draw it, with its boundary.

?? How should threat 4 be rewritten?
+ Name the actor, the method and the harm
- Make it shorter, so it fits one slide
- Add the word critical, so it gets fixed
- Remove it, since every system has hackers anyway
=> "An attacker could read other customers' invoices by changing the invoice number in the address" can be tested, fixed and checked off. "Hackers could attack" can't.

?? Why push back on the mitigation?
+ It can't be traced to a testable requirement
- AI systems are banned from all security work
- Detection is never really a part of security
- Mitigations must always be written in actual code
=> A mitigation answers one named threat and can be checked. Here, the object check on each route is the real fix, and detection is a backup.

?! Draw a login feature as a data flow. Mark one trust boundary, and give one STRIDE threat for it.
