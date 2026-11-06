---
title: Keeping input out of the code
summary: Why injection happens, and the fixes that end it: parameterised queries, output encoding, Content Security Policy, and safe handling of files and commands.
month: 8
minutes: 55
builds: fix the injection family, and explain each fix to a developer
source: OWASP Cheat Sheet Series | https://cheatsheetseries.owasp.org/
words: injection, parameterised query, output encoding
---
Injection is one idea wearing many costumes: **data gets treated as code**. Learn the idea once, and each flaw in this family, and each fix, makes sense.

@term injection = A flaw where input is treated as part of a command or code.
@term output encoding = Converting characters so that a browser treats them as text, not code.
@term CSP (Content Security Policy) = A browser header limiting where a page may load and run code from.
@term command injection = Input becoming part of an operating system command.
@term path traversal = Input reaching files outside the intended folder.
@term allow-list = A list of what's permitted, with everything else refused.

## One root cause

Think of a form letter: "Dear ___, your balance is ___." If someone writes a whole new sentence in the blank, and the printer treats it as part of the template, the letter says something you never wrote.

Software does this whenever it glues text from a user into something that's then interpreted: a query, a web page, a shell command.

| What gets interpreted | The flaw | The fix |
|---|---|---|
| A SQL query | SQL injection | Parameterised queries |
| A web page | Cross-site scripting | Output encoding |
| A shell command | Command injection | Avoid the shell, and pass arguments separately |
| A file path | Path traversal | Allow-list, then check the resolved path |

Every fix does the same thing: it keeps data in a separate lane from code.

?? What do SQL injection, XSS and command injection all have in common?
+ Input is mixed into something that gets interpreted
- They only ever affect old versions of Windows
- They all need an attacker with a password
- All three are fixed by hiding error messages
=> Different targets, same mistake. That's why the fix is always about separating code and data.

## SQL: parameters

In Month 6, you saw how queries work. Here's the mistake and the fix.

```python
# Unsafe: the value becomes part of the SQL text
cur.execute(f"SELECT * FROM users WHERE email = '{email}'")

# Safe: the SQL is fixed, and the value travels separately
cur.execute("SELECT * FROM users WHERE email = %s", (email,))
```

In the safe version, the database receives the query's structure first, and the value afterwards as plain data. Whatever the user typed, it can only ever be a value. It can't change the structure. An **ORM** usually does this for you, unless someone builds raw SQL by hand. Give the application's database account only the rights it needs too, so that a flaw that slips through can do less.

?? A developer says "I removed all quote characters, so the query is safe". What's your reply?
+ Filtering is fragile, so use parameters instead here
- That's correct, and quotes are the only risk
- Add a second filter to remove all spaces
- Only the login form needs that protection now
=> Filters try to guess every dangerous input, and history shows they miss some. Parameters remove the problem by design.

## XSS: encoding on output

XSS is injection into a page. If a comment is stored and shown to others without care, a browser may treat it as code, running with the victim's session.

The fix happens **on output**, in the context where the data lands.

```html
<!-- Encoded by the template, so the browser shows it as text -->
<p>{{ comment }}</p>
```

Modern templates such as Jinja2, and frameworks such as React, encode by default. Danger returns when someone turns that off, with features like `|safe` or `dangerouslySetInnerHTML`. Those are the first things to search for in a review.

As a second layer, a **CSP** header tells the browser which scripts may run. Mark session cookies `HttpOnly`, so scripts can't read them. If you must accept rich text, use a tested sanitiser such as DOMPurify, never your own regular expression.

@drill web-fix

?? Why is output encoding done at display time, rather than only when input arrives?
+ The safe form depends on where it lands
- Encoding on arrival makes the database much slower
- Browsers refuse any data that's been encoded twice
- It needs to run only on login pages
=> HTML, attributes, URLs and JavaScript each need different handling. Only the output step knows the context.

## Commands and files

**Command injection** comes from passing user input to a shell. Prefer a library over a shell command. If you must run a program, pass arguments as a list, so that no shell ever parses them.

```python
# Unsafe: the shell parses the whole string
os.system(f"convert {name} out.png")

# Safe: no shell, and each argument stays one argument
subprocess.run(["convert", "--", name, "out.png"], check=True)
```

**Path traversal** happens when input reaches a file path. Don't use input as a path at all if you can avoid it: use an ID, and look the file up. Otherwise, resolve the full path, and check that it's still inside the folder you meant.

```python
base = Path("/srv/uploads").resolve()
target = (base / name).resolve()
if not target.is_relative_to(base):
    abort(404)
```

Validate with an **allow-list**, saying what's allowed, rather than a deny-list that tries to name everything that's bad.

?? Why is an allow-list safer than a deny-list?
+ Anything you didn't think of stays safely refused
- It makes the application use much less memory
- Deny-lists are not allowed under any web standards
- Attackers aren't able to read an allow-list file
=> A deny-list fails open on whatever it forgot. An allow-list fails closed.

## Find it in code

Search for sinks, then trace backwards to where the input comes from.

| Search for | Risk |
|---|---|
| `execute(f`, string concatenation near SQL | SQL injection |
| `\|safe`, `dangerouslySetInnerHTML`, `innerHTML` | XSS |
| `os.system`, `shell=True`, `eval` | Command or code injection |
| `open(` with request data | Path traversal |

@range appsec

::: try Fix your own code
Use your Month 6 application. Add a vulnerable query on a branch, write a test that shows the problem, fix it with parameters, and watch the test pass. A test that stays in the suite means that this bug can't quietly return. That's the gate for this month.
:::

?! Explain to a developer, in three sentences, why parameters stop SQL injection when filtering doesn't.
