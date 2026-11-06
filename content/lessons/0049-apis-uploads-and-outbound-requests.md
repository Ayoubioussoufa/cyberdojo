---
title: APIs, uploads and outbound requests
summary: Protecting the rest of a modern application: the OWASP API Top 10, rate limiting, safe file uploads, server-side request forgery, and untrusted data formats.
month: 8
minutes: 50
builds: a hardening checklist for an API
source: OWASP API Security Top 10 2023 | https://owasp.org/API-Security/editions/2023/en/0x11-t10/
words: rate limiting, SSRF, deserialization
---
Modern applications are mostly APIs: a browser or a phone app talking to a server through structured requests. An API has no pages to hide behind, which makes every flaw from the last two lessons easier to reach.

@term rate limiting = Limiting how many requests a client can make in a period of time.
@term SSRF (server-side request forgery) = Making a server send a request on the attacker's behalf, often to internal systems.
@term deserialization = Turning stored data back into live objects in a program.
@term egress filtering = Controlling which outbound connections a system may make.
@term MIME type = A label saying what kind of content a file claims to be.

## The API Top 10

[OWASP's API list (2023)](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) has its own vocabulary. Here are the ones you'll hear most.

| Risk | Meaning | Fix |
|---|---|---|
| API1 Broken Object Level Authorization | Reading someone else's record | Check ownership on every object |
| API2 Broken Authentication | Weak logins and tokens | Tested libraries, MFA, short lifetimes |
| API3 Broken Object Property Level Authorization | Reading or setting fields you shouldn't | Allow-list the response and request fields |
| API4 Unrestricted Resource Consumption | No limits on use | Rate limits, quotas and timeouts |
| API5 Broken Function Level Authorization | Calling admin actions | Check the role on every route |

Notice how API1 and API5 are the access control problems from lesson 48, under new names.

?? An API returns a user's whole record, including their password hash, and the app shows only the name. What's wrong?
+ The API sends more than the client needs
- The app should display the hash as well
- JSON cannot carry sensitive fields of that kind
- The server should compress its responses much more
=> Filtering in the app protects nothing, because anyone can read the raw response. Return only the fields that are needed.

## Limits

Without limits, anyone can try a million passwords, scrape your data, or run up your bill. **Rate limiting** caps requests per user and per IP, returning status `429` when they go over.

| Where | Example limit |
|---|---|
| Login | 5 attempts per account per minute |
| Password reset | 3 per hour |
| Expensive search | 30 per minute |
| File upload | A size cap, and a quota |

Also set timeouts and maximum page sizes, so that one request can't tie up the server. For anything calling an LLM, limits protect your money too, as you'll see in Month 18.

?? Where's a rate limit most valuable?
+ On login and password reset routes
- On the static header logo image
- On the site's public favicon file
- On the terms and conditions page
=> Those endpoints are what attackers automate against. A limit there blocks guessing while real users barely notice.

## File uploads

An upload lets a stranger put a file on your system, so treat it as dangerous.

| Rule | Why |
|---|---|
| Check by content, not by the name or the claimed type | Both the name and the `MIME type` come from the client |
| Generate your own file name | User-chosen names enable path tricks |
| Store outside the web root | So it can never be run as code |
| Serve from a separate domain | A malicious file can't reach your site's cookies |
| Set a size limit, and scan the file | Stops exhausting disks, and catches known malware |

In the [triage mission](/courses/0051-how-a-soc-works/) you saw a `.php` file in an uploads folder with commands in its URL. That's what happens when these rules are ignored.

?? A server checks that an upload's name ends in `.png`. Why isn't that enough?
+ The name and type come from the client
- PNG files are never allowed on web servers
- The check should really look for `.jpg` instead
- File names can't contain any dots at all
=> Whatever the client sends is untrusted. Check the content, rename it, and store it where it can't run.

## Requests your server makes

Many apps fetch a URL on the user's behalf: a link preview, a webhook, an image from an address. If the user picks the address, your server becomes their messenger. Your server can reach things that they can't, such as internal admin panels and the cloud metadata service you met in Month 13. That's **SSRF**, which OWASP now counts under broken access control.

| Defence | Why |
|---|---|
| Allow-list destinations | Only known hosts can be reached |
| Resolve the name, then refuse private and link-local addresses | Stops names that point inside |
| Don't follow redirects blindly | A safe URL can redirect to an unsafe one |
| Require IMDSv2 | Blocks many paths to cloud credentials |
| **Egress filtering** | Even if code fails, the network refuses |

?? A preview feature fetches any URL a user gives it. Which control helps even if the code check fails?
+ Network egress rules limiting where servers can connect
- A longer error message for invalid web addresses
- A better font for the preview's text box
- Hiding the URL field for mobile users only
=> Layers matter. If the server can't physically reach internal addresses, a bypass of the code gains nothing.

## Data that can run

Some formats do more than store data. Unsafe **deserialization** can build arbitrary objects, and in some languages that runs code. So never unpickle untrusted data in Python, and prefer plain formats such as JSON, with a schema. For XML, disable external entities, which many modern parsers now do by default.

The rule is the same one you started with. Data from outside stays data.

```python
# Unsafe for anything from outside
obj = pickle.loads(body)

# Safe: plain data, then validate its shape
obj = Order(**json.loads(body))
```

?? Why is `pickle.loads` dangerous on data from a user?
+ Loading it can run code during the deserialization
- It always makes the stored data much bigger
- It only works with files on Windows servers
- JSON is older and so it's better supported
=> Python's own documentation warns about this. Use a plain data format for anything untrusted.

?! Write a ten-line hardening checklist for an API you might build.
