---
title: Keeping input out of the code
summary: Why injection happens, and the fixes that end it: parameterised queries, output encoding, Content Security Policy, and safe handling of files and commands.
month: 8
minutes: 75
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

@flow Your code + user input > One string > Interpreter runs it all as code

The fix keeps the two apart, whatever the input contains:

@flow Your code > Input sent separately > Interpreter treats input as data

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

You ran this difference yourself in the SQL lesson: the same odd input returned every row from the first form and nothing from the second. Two details catch people who already know that much.

**Parameters carry values, not names.** A placeholder can stand for `'ana@corp.example'` or `42`. It can't stand for a table or a column, so "sort by whichever column the user clicked" can't be parameterised. The safe pattern is to translate the input through a fixed list that you wrote, so that the text reaching the query always comes from your code:

```python
SORT_COLUMNS = {"name": "name", "newest": "created_at", "total": "total"}

column = SORT_COLUMNS.get(request.args.get("sort"), "name")
cur.execute(f"SELECT name, total FROM orders ORDER BY {column}")
```

Whatever arrives, the query can only ever contain one of three strings you chose. Anything unexpected quietly becomes the default.

**Stored data is still input.** A value that was saved safely last week is not safe to paste into a new query today. Use parameters every time a value meets SQL, wherever the value came from.

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

"Encoding" sounds abstract until you see how little it is. Five characters mean something to an HTML parser, and each has a harmless written form:

| Character | Encoded as | Why it matters |
|---|---|---|
| `&` | `&amp;` | Starts an encoded character |
| `<` | `&lt;` | Starts a tag |
| `>` | `&gt;` | Ends a tag |
| `"` | `&quot;` | Ends an attribute value |
| `'` | `&#x27;` | Ends an attribute value |

A comment of `I <b>love</b> this` is sent to the browser as `I &lt;b&gt;love&lt;/b&gt; this`. The browser draws the angle brackets on the screen as characters, and nothing in the comment can become a tag. Write the function once to see that there's no magic in it, then use your framework's version, or `html.escape` in Python, for real work.

@code escape-html

As a second layer, a **CSP** header tells the browser which scripts may run. Mark session cookies `HttpOnly`, so scripts can't read them. If you must accept rich text, use a tested sanitiser such as DOMPurify, never your own regular expression.

A policy is a list of rules, each naming a kind of content and where it may come from:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; img-src 'self' https://images.example
```

Read it as: by default, load things only from this site itself; scripts only from this site; images from this site or one named host. A script written into the page by an attacker isn't a file from this site, so the browser refuses to run it. CSP doesn't fix the flaw. It makes a missed one much harder to use.

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

The reason is that a shell reads its command line as a small program. Characters such as `;`, `|`, `&` and `$( )` are instructions to it, so input that contains them changes what gets run. With a list of arguments there's no shell and no program to change: each item reaches the tool exactly as written. The `--` in the list is a convention most tools follow, meaning "everything after this is a name, not an option", so that a file called `-delete` can't be read as one.

An allow-list for names is short to write and worth having in front of any code that touches files:

@code safe-filename

**Path traversal** happens when input reaches a file path. Don't use input as a path at all if you can avoid it: use an ID, and look the file up. Otherwise, resolve the full path, and check that it's still inside the folder you meant.

```python
base = Path("/srv/uploads").resolve()
target = (base / name).resolve()
if not target.is_relative_to(base):
    abort(404)
```

There's one trap in that check. Comparing text with "does the path start with the folder's name?" is not the same as "is the path inside the folder?", because `/srv/uploads-private` also starts with `/srv/uploads`. `is_relative_to` gets this right. If you compare strings yourself, compare against the folder plus a trailing slash.

@code safe-path

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

## Review a pull request

A colleague asks you to review this new route. Read each line and ask the one question from the top of the lesson: is anything from the user being glued into something that will be interpreted?

```python
@app.get("/export")
def export():
    sort = request.args["sort"]
    rows = db.execute(f"SELECT name, total FROM orders ORDER BY {sort}").fetchall()
    heading = "<h1>Export: " + request.args["title"] + "</h1>"
    return render_template_string(heading + TABLE_TEMPLATE, rows=rows)
```

?? The query puts `sort` straight into the SQL. Why can't the fix be a `%s` placeholder?
+ Placeholders hold values, and never column names
- Placeholders only work in `INSERT` statements anyway
- Placeholders make every query run too slowly
- Placeholders are refused by most databases today
=> A parameter is always treated as a value, so the database would sort by a fixed piece of text. Map the input through an allow-list of real column names.

?? The `title` parameter is joined to the template text. What's the right fix?
+ Pass it as a variable, encoded automatically
- Remove the angle brackets with a regex
- Limit the title to twenty characters long
- Convert the title to upper case first
=> Text joined to a template becomes part of the template. Passed as a variable and written `{{ title }}`, it's data, and the template engine encodes it on output.

?! Explain to a developer, in three sentences, why parameters stop SQL injection when filtering doesn't.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP Cross Site Scripting Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)
- [OWASP OS Command Injection Defense Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/OS_Command_Injection_Defense_Cheat_Sheet.html)
