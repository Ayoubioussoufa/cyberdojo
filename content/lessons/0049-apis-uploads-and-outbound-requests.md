---
title: APIs, uploads and outbound requests
summary: Protecting the rest of a modern application: the OWASP API Top 10, rate limiting, safe file uploads, server-side request forgery, and untrusted data formats.
month: 8
minutes: 75
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

An API is easy to inspect, because its answers are plain JSON. Any API you're allowed to use will do for practice, and `jq` formats the reply and picks fields out of it:

```
curl -s https://api.github.com/users/octocat | jq .
curl -s https://api.github.com/users/octocat | jq '{login, name, public_repos}'
```

The first command shows everything the server chose to send. That's the reviewer's habit for API3: never judge an API by what the app displays. Look at the raw response and ask whether every field in it needs to leave the server. The fix on the server is the allow-list again, applied on the way out: build the reply from named fields, and never by dumping the whole database row.

```python
def public_user(row):
    return {"id": row["id"], "name": row["name"], "bio": row["bio"]}
```

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

The usual mechanism is a **token bucket**. Picture a bucket that holds, say, five tokens. Each request takes one, and an empty bucket means the request is refused. Tokens drip back in at a steady rate, so a person clicking normally never runs out, and a script sending hundreds of requests is refused almost at once and then held to the drip rate. A well-behaved API tells the client how long to wait, in a `Retry-After` header beside the `429`.

@code token-bucket

Page sizes need the same treatment. A request for `?limit=1000000` should never make the server build a million rows. The server decides the maximum, and anything strange falls back to a sensible default.

@code clamp-limit

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

"Check by content" has a concrete meaning. Most file formats begin with a few fixed bytes, called **magic bytes**, and a renamed file keeps the ones it was born with:

| Format | First bytes | As text |
|---|---|---|
| PNG | `89 50 4E 47 0D 0A 1A 0A` | `.PNG....` |
| JPEG | `FF D8 FF` | |
| GIF | `47 49 46 38` | `GIF8` |
| PDF | `25 50 44 46 2D` | `%PDF-` |

The `file` command reads them for you, and it's the quickest way to see whether a name is telling the truth:

```
$ file holiday.png
holiday.png: PNG image data, 800 x 600, 8-bit/color RGB
$ file avatar.png
avatar.png: PHP script, ASCII text
```

Magic bytes are a first filter, not proof: they show that a file starts like an image. That's why the other rules in the table still apply. For the name, don't clean up what the user sent. Throw it away and make your own, such as `uuid.uuid4().hex + ".png"`.

@code file-kind

In the [triage mission](/courses/0051-how-a-soc-works/) you saw a `.php` file in an uploads folder with commands in its URL. That's what happens when these rules are ignored.

?? A server checks that an upload's name ends in `.png`. Why isn't that enough?
+ The name and type come from the client
- PNG files are never allowed on web servers
- The check should really look for `.jpg` instead
- File names can't contain any dots at all
=> Whatever the client sends is untrusted. Check the content, rename it, and store it where it can't run.

## Requests your server makes

Many apps fetch a URL on the user's behalf: a link preview, a webhook, an image from an address. If the user picks the address, your server becomes their messenger. Your server can reach things that they can't, such as internal admin panels and the cloud metadata service you met in Month 13. That's **SSRF**, which OWASP now counts under broken access control.

@flow Someone supplies a URL > Your server fetches it > From inside your network > It reaches what they couldn't

| Defence | Why |
|---|---|
| Allow-list destinations | Only known hosts can be reached |
| Resolve the name, then refuse private and link-local addresses | Stops names that point inside |
| Don't follow redirects blindly | A safe URL can redirect to an unsafe one |
| Require IMDSv2 | Blocks many paths to cloud credentials |
| **Egress filtering** | Even if code fails, the network refuses |

The second row of that table is worth seeing in code. A name tells you nothing about where a request will go, because whoever owns a domain decides which address it points at. So the check is made on the address the name resolves to, and Python's `ipaddress` module knows which ranges are internal:

| Range | What it is |
|---|---|
| `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` | Private networks |
| `127.0.0.0/8` and `::1` | The server itself |
| `169.254.0.0/16` | Link-local, which includes the cloud metadata address `169.254.169.254` |

```python
import ipaddress
ip = ipaddress.ip_address("169.254.169.254")
ip.is_private, ip.is_loopback, ip.is_link_local      # the three properties to test
```

One detail keeps the check honest: connect to the address you checked, not to the name again, or the name can be made to resolve differently the second time.

@code public-address

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

"Validate its shape" means the server states exactly what a correct message looks like and refuses everything else: the right keys, the right types, the right ranges, and no extras. Libraries such as pydantic do this from a class definition. Writing one check by hand shows what they're doing for you.

@code parse-order

?? Why is `pickle.loads` dangerous on data from a user?
+ Loading it can run code during the deserialization
- It always makes the stored data much bigger
- It only works with files on Windows servers
- JSON is older and so it's better supported
=> Python's own documentation warns about this. Use a plain data format for anything untrusted.

## Harden one endpoint

Two things arrive at an application you look after. Decide what to do with each before you read the choices.

```
$ file avatar.png
avatar.png: PHP script, ASCII text
```

?? A user uploaded that file as their profile picture. What should the upload code have done?
+ Refused it, because the content isn't an image
- Accepted it, because the name ends in `.png`
- Renamed it to `avatar.php` to match its content
- Emailed it to the user to confirm it
=> The name was chosen by the sender. The content says it's a script, and a profile picture has no reason to be one.

?? A customer sets their webhook address to a name that resolves to `169.254.169.254`. What should the server do?
+ Refuse, since that address is link-local
- Fetch it, as the customer chose
- Fetch it, but only over HTTPS
- Refuse, since webhooks must use ports
=> That's the cloud metadata address, reachable only from inside your own infrastructure. A customer has no legitimate reason to point your server at it.

?! Write a ten-line hardening checklist for an API you might build.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)
- [OWASP Server-Side Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
