---
title: Storing passwords and building the app
summary: Salts, slow hashes and Argon2id, then a small login app built correctly, and an AI-written one audited.
month: 6
minutes: 60
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
