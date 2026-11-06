---
title: Threat modeling and secure code
summary: The four questions, data-flow diagrams and STRIDE, ASVS requirements, secure code review, and building security into development.
month: 17
minutes: 55
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

@drill stride

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

Turn repeated findings into [Semgrep rules](https://semgrep.dev/docs/writing-rules/overview), so that a person only has to find each kind once:

```yaml
rules:
  - id: python-fstring-sql
    pattern: $CUR.execute(f"...")
    message: Pass values as parameters, not inside the query text.
    languages: [python]
    severity: ERROR
```

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

?! Draw a login feature as a data flow. Mark one trust boundary, and give one STRIDE threat for it.
