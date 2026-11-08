---
title: Access control that holds
summary: The most common serious web flaw: checking who owns each object, protecting functions, stopping cross-site requests, and validating tokens properly.
month: 8
minutes: 50
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

?? Which test catches an IDOR?
+ User A requests a record that B owns
- An admin requests their own personal profile page
- An anonymous visitor loads the public home page
- A user logs in with their correct password
=> Access control bugs only appear across two identities. Testing with one account proves nothing.

?! Explain IDOR to a developer in two minutes: what it is, why scanners miss it, and how to fix it.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [OWASP Insecure Direct Object Reference Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Insecure_Direct_Object_Reference_Prevention_Cheat_Sheet.html)
- [OWASP Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
