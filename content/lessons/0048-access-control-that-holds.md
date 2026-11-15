---
title: Access control that holds
summary: The most common serious web flaw: checking who owns each object, protecting functions, stopping cross-site requests, and validating tokens properly.
month: 8
minutes: 70
builds: design authorization checks that a tester can't get around
source: OWASP Authorization Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html
words: IDOR, CSRF, mass assignment
---
Broken access control sits at number one on the OWASP list. It's hard for scanners to find, because a tool can't know that invoice 1044 isn't yours. It takes a person who understands what the application should do.

@term IDOR (insecure direct object reference) = Reaching another user's data by changing an ID, because the server doesn't check ownership.
@term BOLA (broken object level authorization) = The API name for IDOR.
@term BFLA (broken function level authorization) = Reaching an action that your role shouldn't allow.
@term SameSite = A cookie setting that limits whether a browser sends it on requests from other sites.
@term mass assignment = A flaw where an API saves fields that the client shouldn't be able to set.

## Who, and to what

**Authentication** asks who you are. **Authorization** asks whether you may do this, to this thing, now. Login handles the first, and it's the second that fails.

Two levels have to be checked on every request.

| Level | Question | Failure | Example |
|---|---|---|---|
| Function | May this role use this action? | BFLA | A customer calls the admin export |
| Object | May this user touch this record? | IDOR, or BOLA | A customer reads another's invoice |

Hiding the admin button is not a check. Anyone can call the URL directly.

The strongest designs put both questions in one function that every route must call, and that function starts from "no". A request is allowed only when a rule says so, which means a route somebody forgot to think about is refused, not open. The answer is one of three status codes you already know:

| Answer | Meaning |
|---|---|
| `401` | Nobody is logged in. Log in first |
| `403` | You're logged in, and this isn't yours to do |
| `200` | Allowed |

Write that function for the shop in this lesson. It's a dozen lines, and it's the centre of the whole application's security.

@code authorize-request

?? The admin page's link is hidden from normal users, but the URL has no check. What's the flaw?
+ Hiding a link doesn't enforce any real permission
- The link should be a different colour instead
- Normal users cannot type a URL by hand
- The page needs a longer and stranger address
=> Interface tricks aren't controls. The server has to check the role on each request.

## The object-level fix

Here's the most frequent serious bug in web applications, and its fix.

@seq Browser | App | Database
Browser > App: Ana asks for note 42
App > Database: Who owns note 42?
Database > App: Sam does
App > Browser: 403: Ana isn't Sam

```python
# Unsafe: it finds the invoice, but never asks whose it is
invoice = Invoice.get(id=invoice_id)

# Safe: the query itself is limited to this user
invoice = Invoice.get(id=invoice_id, owner_id=current_user.id)
```

The safe version makes the ownership check part of the lookup, so forgetting it is harder. Random IDs help a little, but they aren't a control: an ID can leak, and then nothing stops the reader. Always check.

In a real route the pattern is a small helper that every handler uses, so the unsafe lookup is never written at all:

```python
def owned_invoice(invoice_id):
    invoice = Invoice.get(id=invoice_id, owner_id=current_user.id)
    if invoice is None:
        abort(404)
    return invoice
```

Notice the 404. To the person asking, "this invoice doesn't exist" and "this invoice isn't yours" look the same, and that's deliberate: a 403 would confirm that number 1044 is a real invoice belonging to someone.

Good designs **deny by default** and put the check in one central place, rather than scattering it across handlers. Write a test for it: log in as user A, ask for user B's record, and expect a refusal.

@drill web-class

?? A team switches invoice IDs from numbers to long random strings. Is the IDOR fixed?
+ No, the ownership check is still missing
- Yes, nobody can guess long random strings
- Yes, because random strings are always encrypted
- No, because IDs must remain small numbers
=> Random IDs make guessing harder, and they leak through links, logs and emails. Authorization is still needed.

## Cross-site requests

Browsers attach your cookies to any request sent to a site, even one started by another website. So a malicious page could make your browser send a request to your bank while you're logged in. That's **CSRF**.

Three defences work together:

| Defence | How it helps |
|---|---|
| `SameSite=Lax` or `Strict` cookies | The browser stops sending the cookie on most cross-site requests |
| Anti-CSRF tokens | A form must include a secret value that other sites can't read |
| Using POST for changes | A plain link can't trigger the action |

An anti-CSRF token is less mysterious than it sounds. When the session starts, the server makes a random value with `secrets.token_urlsafe(32)`, keeps it in the session, and writes it into every form as a hidden field. When a form comes back, the server compares the field with the session's copy. The other site can make your browser send the form, and it can't read your pages, so it never learns the value to put in.

@code csrf-check

?? Why doesn't CSRF affect an API that uses a header token rather than a cookie?
+ Browsers don't add that header on their own
- Headers are always encrypted by every single browser
- APIs can't ever receive requests from web browsers
- Header tokens only work on mobile phone apps
=> CSRF abuses cookies being sent automatically. A token that JavaScript must add on purpose isn't sent by another site's page.

## Saving what you shouldn't

**Mass assignment** happens when a framework copies every submitted field into a database record. If a user adds `"role": "admin"` to a profile update, a careless server saves it.

```python
# Unsafe: every field the client sends gets saved
user.update(**request.json)

# Safe: only these fields can ever change
data = ProfileUpdate(**request.json)   # a schema naming name and bio
user.update(name=data.name, bio=data.bio)
```

The safe version is a filter you can write in one line, and the idea is the allow-list again: the server names the fields a client may change, and nothing else gets through, however the request was built.

@code allowed-fields

?? What's the best defence against mass assignment?
+ An explicit list of fields clients may set
- Hiding the role field from the web page
- Renaming the database column to something very unusual
- Asking users not to send any extra fields
=> Name what's allowed. Anything else gets dropped, however the request is crafted.

## Tokens

A **JWT** has three parts: a header, some claims and a signature. The claims are only encoded, so anyone can read them. Don't put secrets inside. What makes a JWT trustworthy is the signature, so:

- Verify the signature on every request, with a fixed algorithm, using a tested library.
- Never accept the algorithm named by the token itself.
- Check the expiry, the issuer and the audience.
- Keep lifetimes short.

With the PyJWT library, all four rules are one call. Every argument after the key is a check that you'd otherwise have to remember:

```python
claims = jwt.decode(
    token,
    key,
    algorithms=["HS256"],          # fixed by you, never read from the token
    audience="notes-app",
    issuer="https://idp.example",
)
```

Expiry is checked automatically. If any check fails, the call raises an exception and you never see the claims, which is failing closed.

?? A JWT's payload says `"admin": true`. Why may a server trust it?
+ Only if its signature has been properly verified
- Because JWTs are encrypted by default for everyone
- Because the browser has already checked the value
- Because it arrived over an HTTPS connection here
=> Anyone can edit the readable claims. Only a valid signature proves that your system issued them.

## Test the rule, not the page

Authorization needs tests, because nothing crashes when a check is missing. Make a small table of who may do what, then automate it:

| Action | Anonymous | Customer | Other customer | Admin |
|---|---|---|---|---|
| Read invoice 1043 | 401 | 200 | **403 or 404** | 200 |
| Export all | 401 | 403 | 403 | 200 |

Each cell of that table is one short test. This is the one for the bold cell:

```python
def test_customer_cannot_read_another_customers_invoice(client):
    login(client, "ana")
    response = client.get("/invoices/1044")      # this invoice belongs to sam
    assert response.status_code in (403, 404)
```

Once the tests exist, comparing the table you intended with what the application really answers is mechanical, and a program can list the cells that differ.

@code access-failures

?? Which test catches an IDOR?
+ User A requests a record that B owns
- An admin requests their own personal profile page
- An anonymous visitor loads the public home page
- A user logs in with their correct password
=> Access control bugs only appear across two identities. Testing with one account proves nothing.

## When the rules meet real life

Access control is never finished, because people's needs change and because someone is always trying the doors. Two situations you'll meet in your first month on a team:

```
203.0.113.9  ana  GET /admin/export  403
203.0.113.9  ana  GET /admin/users   403
203.0.113.9  ana  GET /admin/config  403
203.0.113.9  ana  GET /admin/backup  403
```

?? Those four lines arrive within ten seconds, from a customer account. What's the sensible reading?
+ Someone is probing for unprotected admin routes
- A lost customer needs much better menus
- The server is broken and refusing everything
- An admin has forgotten their own password
=> A customer has no link to any of these pages. Four refused requests for admin paths in a row is somebody working through a list, and the controls held. It's worth an alert, because the fifth path might not hold.

?? The support team now needs to read any customer's invoice to answer tickets. What's the right change?
+ Add a support role to the central policy
- Remove the ownership check from the invoice route
- Give every support agent the shared admin password
- Tell support to ask customers for some screenshots
=> A new need is a new rule, written in the one place where rules live, with the smallest permission that does the job: read, and not update or export.

?! Explain IDOR to a developer in two minutes: what it is, why scanners miss it, and how to fix it.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
