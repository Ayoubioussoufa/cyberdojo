---
title: Storing passwords and building the app
summary: Salts, slow hashes and Argon2id, then a small login app built correctly, and an AI-written one audited.
month: 6
minutes: 80
builds: the P05 baseline app, with verified secure login
source: OWASP Password Storage Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
words: salt, Argon2id, credential stuffing
---
Databases get stolen. When yours does, what's in the password column decides whether it's a bad day or a disaster. This lesson closes Phase 1: you'll build the app you test and fix in Month 8.

@term salt = Random data added to each password before hashing, so identical passwords hash differently.
@term Argon2id = The recommended password hashing algorithm: deliberately slow and memory-hard.
@term bcrypt = An older, still acceptable, deliberately slow password hash.
@term work factor = A setting that makes a password hash slower to compute.
@term rainbow table = A precomputed lookup table of hashes used to reverse them.
@term credential stuffing = Trying stolen username and password pairs from one site on other sites.
@term password spraying = Trying a few common passwords across many accounts.

## Why plain hashing fails

From lesson 38: a hash can't be reversed, but it can be guessed. A graphics card computes billions of SHA-256 hashes a second. Most human passwords fall quickly.

Two defences:

**Salt.** Add a random value per user before hashing. Two people with the same password get different hashes, and precomputed **rainbow tables** become useless. The salt isn't secret: it's stored beside the hash.

**Slowness.** Use a function designed to be expensive. If each guess costs 100 ms and lots of memory, an attacker's billions per second becomes a handful.

@flow Password > Add a random salt > Slow hash: Argon2id > Store the salt and hash

Measure the difference between a fast hash and a slow one on your own machine. PBKDF2 is in Python's standard library, and it works by repeating a hash a set number of times:

```python
import hashlib, time

start = time.perf_counter()
hashlib.sha256(b"hunter2").hexdigest()
print("sha256:", time.perf_counter() - start)

start = time.perf_counter()
hashlib.pbkdf2_hmac("sha256", b"hunter2", b"per-user-salt", 600_000)
print("pbkdf2:", time.perf_counter() - start)
```

The first takes a few millionths of a second and the second a noticeable fraction of one, tens of thousands of times longer. A user waits that long once per login and never notices. An attacker with a stolen table pays it for every single guess, for every single user.

Now see what the salt does. The same password, hashed with two different salts:

```
salt-a   f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4
salt-b   26f91e2a1e5652c5ee66799bfe41d6c3c5d6dc95eafb1068e8582801e205ee3e
```

Nothing in the stored values reveals that the two users chose the same password, and a guess has to be recomputed separately for each of them. Write the two functions that every login system has at its centre. The tests use a low iteration count so that they run quickly: real systems use the numbers in the table below.

@code password-hash

?? Why isn't a plain SHA-256 password hash enough?
+ Guessing is cheap, at billions per second
- SHA-256 can be reversed with a key
- Hashes always grow too long to store
- Passwords can't be hashed more than once
=> A hash can't be undone, but it can be guessed at huge speed. Salt and slowness are the answer.

## What to use

The [OWASP cheat sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) says:

| Algorithm | Guidance |
|---|---|
| **Argon2id** | First choice. Minimum 19 MiB of memory, 2 iterations, 1 degree of parallelism |
| **scrypt** | Minimum N=2^17, r=8, p=1 |
| **bcrypt** | For legacy systems. Work factor of at least 10. Most implementations stop at 72 bytes of input |
| **PBKDF2** | When FIPS compliance requires it. 600,000 iterations with HMAC-SHA256 |

```python
from argon2 import PasswordHasher

ph = PasswordHasher()
stored = ph.hash("correct horse battery staple")   # salt is included
ph.verify(stored, "correct horse battery staple")  # raises if wrong
```

Install it with `pip install argon2-cffi`. The value in `stored` is one string that carries everything needed to check a password later:

```
$argon2id$v=19$m=65536,t=3,p=4$c2FsdHNhbHRzYWx0c2FsdA$Zk3J1x…
```

| Part | Meaning |
|---|---|
| `argon2id` | The algorithm |
| `v=19` | The version of the algorithm |
| `m=65536` | Memory cost in KiB: 64 MiB for each hash |
| `t=3` | Time cost: three passes over that memory |
| `p=4` | Parallelism: four lanes |
| The next part | The salt, in Base64 |
| The last part | The hash itself |

Because the settings travel with each hash, you can raise them later without breaking old accounts: `ph.check_needs_rehash(stored)` tells you at login when a stored hash uses weaker settings than today's, and that's the moment to hash the password again. A bcrypt value has the same idea in a shorter form, `$2b$12$…`, where 12 is the work factor. Recognising these prefixes matters when you review a database: a column of 32 or 64 hex characters with no prefix is a plain fast hash.

Good libraries handle the salt for you. Check that you're using recent defaults against the cheat sheet.

?? Two users have the same password. With salted hashing, what's stored?
+ Two different hashes, thanks to their salts
- One shared hash for both those users
- The password encrypted under each user's key
- Two identical hashes with two different usernames
=> Each user's random salt changes the input to the hash. That stops an attacker cracking everyone at once.

?? Why is a *slow* hash a good thing here?
+ Each guess costs an attacker far more
- It gives users time to retype passwords
- It stops databases from ever being stolen
- It makes the salt harder to read
=> Normal logins do it once, and attackers need billions of tries. Slowness only hurts the attacker.

## Secure defaults for the app

You'll need these in the build:

- **Passwords:** Argon2id or bcrypt.
- **Queries:** always parameterised.
- **Cookies:** `HttpOnly`, `Secure`, `SameSite`.
- **Sessions:** new ID at login, expiry, real logout.
- **Authorization:** check ownership **on the server, on every request**.
- **Errors:** generic to users ("invalid username or password"), detailed in your logs.
- **Rate limiting** on login, to slow **credential stuffing** and **password spraying**.

Here is how those lines look in a login handler. It's Flask, but the shape is the same in any framework:

```python
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

ph = PasswordHasher()
app.config.update(SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SECURE=True, SESSION_COOKIE_SAMESITE="Lax")

@app.post("/login")
def login():
    name = request.form["username"]
    row = db.execute("SELECT id, pw_hash FROM users WHERE name = %s", (name,)).fetchone()
    try:
        if row is None:
            raise VerifyMismatchError
        ph.verify(row.pw_hash, request.form["password"])
    except VerifyMismatchError:
        log.warning("failed login for %s from %s", name, request.remote_addr)
        return "Invalid username or password", 401
    session.clear()
    session["user_id"] = row.id
    return redirect("/notes")
```

Read it against the list. The query is parameterised. The password is checked by the library, never compared by hand. An unknown user and a wrong password take the same path and give the same message, while the log keeps the detail. `session.clear()` throws away whatever session existed before login, so the user leaves with a fresh one. The cookie flags are set once for the whole app.

Two pieces aren't in that handler, and both are small enough to write now. The first is the rate limit.

@code login-rate-limit

The second is the check that most often goes missing in real applications. Logging in proves who you are. It doesn't decide what you may open, and every route that returns a note has to ask that question itself.

@code can-read-note

What you ask of users matters too. [NIST SP 800-63B](https://pages.nist.gov/800-63-4/sp800-63b.html) changed the old advice: allow long passwords and password managers, check new passwords against lists of breached ones, and don't force a change every few months, because that only produces `Summer2026!` followed by `Autumn2026!`.

::: try Build the P05 baseline
A small notes app with registration, login, roles and notes a user owns. Use Flask, Express or Next.js with PostgreSQL. See [project P05](/projects/P05/). Write a short design note on why you made each choice.

**Verify, don't assume.** Inspect the stored hash in `psql`. Check the `Set-Cookie` header in DevTools. Try to read another user's note by changing an ID.
:::

::: ai Roadmap exercise: audit an AI-written login
Ask an LLM to generate a login implementation. Audit it line by line against the OWASP cheat sheets for password storage, session management and authentication. List every flaw and compare it with yours. Expect missing rate limits and weak defaults.
:::

?? Why say "invalid username or password" rather than which one failed?
+ It doesn't reveal which valid usernames exist
- It makes the login page load faster
- It stops anyone from ever guessing passwords
- It's required by the HTTP protocol itself
=> A precise error lets an attacker list valid accounts. Keep the detail in your logs.

## Review a login system

You're handed someone else's application to review. Three things you find:

```
id | name | password
1  | ana  | 5f4dcc3b5aa765d61d8327deb882cf99
2  | sam  | 5f4dcc3b5aa765d61d8327deb882cf99
```

?? What does that table tell you?
+ A fast unsalted hash: both chose one password
- A slow salted hash: both are well protected
- An encrypted column: the key is stored elsewhere
- A session table: both users are logged in
=> 32 hex characters with no prefix is MD5, and two identical values mean no salt. This one is the hash of `password`, which any search engine will tell you.

?? A stored value starts `$argon2id$v=19$m=65536,t=3,p=4$`. What is `m=65536`?
+ The memory each hash needs, in KiB
- The number of users in the table
- The maximum length of any one password
- The port the database server listens on
=> 65536 KiB is 64 MiB. Needing that much memory per guess is what stops attackers running millions of guesses side by side on graphics cards.

?? Logged in as sam, you request `/notes/7` and receive a note that belongs to ana. What's missing?
+ An ownership check on the server
- A much longer password for ana
- A `Secure` flag on the cookie
- A slower hash on the passwords
=> The login worked as designed. The route returned a note without asking whether this user may read it, which is the most common serious flaw in web applications.

## The Phase 1 checkpoint

You've reached the end of the Foundations phase. The Month 6 gate:

- The app uses Argon2id or bcrypt, parameterised queries and secure cookies: verified, not assumed.
- You can explain the TLS 1.3 handshake and what a certificate chain proves.
- CryptoHack ≥ 30, and SQL joins and aggregates without looking anything up.
- Foundations self-test ≥ 80%, with gaps scheduled into buffer days.

::: tip Certification window
If your target employers filter on a baseline certificate, Months 6–8 are the time for Security+. See [the certifications guide](/guides/g1-certifications/) first, and skip it if your market doesn't ask.
:::

Use [the review page](/review/) as your 50-question self-test. Re-score yourself on the [skill matrix](/skills/).

?! A developer says "we hash passwords with SHA-256, so we're fine". Write your reply: what's wrong, and exactly what should they do?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [NIST SP 800-63B: authentication and password rules](https://pages.nist.gov/800-63-4/sp800-63b.html)
- [RFC 9106: Argon2](https://www.rfc-editor.org/rfc/rfc9106)
