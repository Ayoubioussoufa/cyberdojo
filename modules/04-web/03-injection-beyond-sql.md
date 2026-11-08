---
title: Injection beyond SQL
summary: One root cause in many languages. OS commands, code evaluation, NoSQL, LDAP, XPath, templates and XML, with the safe API for each and how to spot the risky ones in review.
level: intermediate
side: defence
minutes: 45
attack: T1190, T1059
needs: 04-02-sql-injection-in-depth
pair: 04-02-sql-injection-in-depth, 04-09-deserialization, 04-08-files-traversal-and-uploads
source: OWASP A05:2025 Injection | https://top10.owasp.org/2025/A05_2025-Injection/
words: template injection, XXE, command injection
---
SQL gets the attention, but every interpreter has the same weakness. Whenever a program builds a string for another language to parse, and part of that string comes from outside, the boundary between data and code can blur. Learn the pattern once, and you can review any of them.

@term template injection = User input being interpreted as template code on the server.
@term XXE (XML external entity) = An XML parser feature that can be abused to read files or make requests.

## Concept

### Fundamentals: find the interpreter

Ask two questions of any code. **Is another parser involved? Does outside data reach its instructions?**

| Interpreter | Dangerous pattern | Safe alternative |
|---|---|---|
| OS shell | `os.system`, `shell=True` | Argument arrays, with no shell |
| Language eval | `eval`, `exec`, `Function()` | Don't. Use data formats |
| Template engine | Rendering user-supplied templates | Render fixed templates with data |
| NoSQL | Passing request JSON as a query | Validate types, use typed queries |
| LDAP | Filters built from strings | Escape per RFC 4515, or use bound APIs |
| XPath | Concatenated expressions | Parameterised XPath |
| XML parser | External entities on | Disable DTDs and entities |

### Commands

Command injection (CWE-78) is high in the CWE Top 25, since it usually leads straight to code running on the server. Shells treat many characters as syntax. So the fix isn't to filter those: it's to **avoid the shell altogether**. Pass the program and its arguments separately, as lesson 47 showed.

```python
subprocess.run(["convert", in_file, out_file], check=True)   # no shell parses this
```

Argument injection remains a risk: a filename starting with `-` may be read as an option. Add `--` where tools support it, and validate against an allow-list.

### Code evaluation

`eval` on input hands out your interpreter. It often hides in convenience features: calculators, "custom formula" fields, config loaders. CWE-94 covers this class. If you need a small language, use a sandboxed, purpose-built one.

### NoSQL

Document databases accept queries as objects. If a framework parses `user[$ne]=x` into a nested object and you pass that straight to a query, an operator arrives where a string was expected. So check **types**: a username must be a string. Schema validators such as Zod or Pydantic solve this neatly.

### Templates

Server-side template engines are powerful languages. Rendering `{{ name }}` with data is safe. Building the **template itself** from user input is not, as the engine evaluates whatever it receives, and that can reach code execution. It tends to appear in features such as customisable emails. Keep templates fixed, or use a logic-less engine or a sandbox.

### Advanced: XML

XML's DTD feature lets a document define entities, including external ones that point to files or URLs. An unsafe parser may then read local files, make [server-side requests](/modules/04-07-ssrf-in-depth/), or exhaust memory by expanding entities, known as the billion laughs attack. Modern parsers often disable this, but not all, and not in every configuration. The [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html) gives settings per language. File formats built on XML, such as DOCX and SVG, carry the same risk.

**Reviewing at scale.** Static analysis does this well: taint tracking follows data from a *source* to a dangerous *sink*. Semgrep and CodeQL both model these.

?? What's the best fix for OS command injection?
+ Avoid the shell, and pass argument arrays
- Block the semicolon in the input field
- Run the application behind a load balancer
- Encode each parameter using Base64 before use
=> With no shell, nothing interprets special characters, so the input stays a plain argument.

## Threat model

These are routes to [exploiting public-facing applications](https://attack.mitre.org/techniques/T1190/) and [running commands](https://attack.mitre.org/techniques/T1059/). Impact is often worse than SQL injection, as it reaches the host. From there, an attacker may read cloud credentials or pivot. Containing the process matters as much as fixing the bug.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Semgrep, CodeQL | Track taint | Review and CI |
| Pydantic, Zod | Validate types | At every boundary |
| Bandit, ESLint security plugins | Language-specific lint | Early feedback |
| Falco | Catches shells from web apps | Runtime detection |
| [Web Security Academy](https://portswigger.net/web-security/os-command-injection) | Free labs | Legal practice |

## Defence

- **Use APIs that separate data from code.**
- **Prefer a library** to calling a command at all.
- **Validate types and allow-lists** at the boundary.
- **Keep templates fixed.**
- **Disable DTDs** and external entities in every XML parser.
- **Run with low privilege,** in a [confined](/modules/02-03-linux-confinement/) process, with restricted egress.

**Detection.** A web process spawning `sh`, `cmd.exe` or `powershell.exe` is a very strong signal, and it's cheap to detect. Template errors in logs, and XML parser errors, can show probing.

## Pitfalls

- **Filtering special characters.** Blocklists always miss one.
- **"It's only an admin feature."** Admins get phished, and accounts get stolen.
- **Validating on the client.** It's a convenience, and not a control.
- **Forgetting file formats.** SVG and DOCX are XML.
- **Assuming that a framework protects raw calls.** Escape hatches exist.

?? How do you stop XXE?
+ Disable external entities in the XML parser
- Compress every XML document before parsing it
- Serve the XML from a private bucket
- Increase the parser's available memory size limit
=> The dangerous feature lives in the parser, so turning it off removes the whole class.

## Exercise

::: law Lab only
Use code you wrote, and legal labs. Don't test real websites.
:::

1. Write a small "ping this host" endpoint, the unsafe way, in a local VM. Show with a unit test what string the shell receives. Then rewrite it using an argument list.
2. Add Pydantic to a JSON endpoint, and show that an object is rejected where a string is required.
3. Render a Jinja2 template with data. Explain what changes if the template string itself comes from a user.
4. Parse an XML file in Python using `defusedxml`, and compare it with the default parser's settings.
5. Write a Semgrep rule that finds `shell=True`.
6. Complete two labs on Web Security Academy.

?! List every place in a project of yours where a string goes to another interpreter, such as SQL, shell, HTML or templates. Mark how each is protected.

## Further reading

- [OWASP A05:2025 Injection](https://top10.owasp.org/2025/A05_2025-Injection/).
- [OWASP OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html).
- [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html).
- [CWE-78](https://cwe.mitre.org/data/definitions/78.html) and [CWE-94](https://cwe.mitre.org/data/definitions/94.html).
- [OWASP Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Injection_Prevention_Cheat_Sheet.html).
