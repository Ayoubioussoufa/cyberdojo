---
title: Security APIs and secret hygiene
summary: Call threat-intelligence APIs properly, with authentication, rate limits and retries, without ever leaking a key.
month: 4
minutes: 40
builds: enrich, a CLI that looks up IPs and hashes with caching
source: Requests documentation | https://requests.readthedocs.io/
words: API, rate limit, IOC
---
An analyst looking up 200 IP addresses by hand is wasting a day. A script does it in a minute. Security work runs on APIs, and using them safely is a basic professional skill.

@term API = A defined way for one program to talk to another.
@term API key = A secret string that identifies you to an API.
@term REST API = A common style of web API using HTTP methods and JSON.
@term rate limit = A cap on how many requests you can send in a period.
@term IOC (indicator of compromise) = A technical clue left by an attack, such as an IP, domain or file hash.
@term enrichment = Adding context to an indicator, such as its reputation or owner.
@term hash (file hash) = A short fixed-size fingerprint of data. Change one byte and it changes completely.
@term pagination = Splitting a long API response across several requests.

## A first request

```python
import os
import requests

key = os.environ["ABUSEIPDB_KEY"]
r = requests.get(
    "https://api.abuseipdb.com/api/v2/check",
    headers={"Key": key, "Accept": "application/json"},
    params={"ipAddress": "203.0.113.7", "maxAgeInDays": 90},
    timeout=10,
)
r.raise_for_status()
print(r.json()["data"]["abuseConfidenceScore"])
```

Three things here are professional habits:

- **`timeout=10`.** Without one, a stuck server hangs your tool forever.
- **`raise_for_status()`.** It turns HTTP errors into exceptions rather than silently using bad data.
- **The key comes from the environment,** never from the code.

?? Why add `timeout=10` to a request?
+ A stuck server can't hang it
- It limits the user to ten
- It retries the request ten times
- It encrypts requests for ten seconds
=> Without a timeout, your tool may wait forever.

## Secrets: the rule with no exceptions

::: law Never commit a key
Bots scan public repositories constantly. A pushed key should be treated as stolen. [GitHub's own docs](https://docs.github.com/en/code-security/secret-scanning/about-secret-scanning) explain how it scans for them.
:::

Store secrets in a `.env` file that's listed in `.gitignore`:

```
# .env
ABUSEIPDB_KEY=your-key
```

Commit a `.env.example` with empty values, so that others know what's needed. Install [gitleaks](https://github.com/gitleaks/gitleaks) as a pre-commit hook from day one: it blocks commits containing things that look like secrets, and your exit gate requires a clean history.

?? Where should your API key live?
+ In an environment variable or a git-ignored file
- In a constant at the top of scripts
- In a base64-encoded comment inside the source code
- In your README so teammates can find it
=> Code gets committed and shared. Base64 hides nothing, as you saw in Month 2.

## Being a good API citizen

APIs protect themselves with **rate limits**. Exceed one and you get HTTP `429 Too Many Requests`. Free tiers can be strict: check [VirusTotal's](https://docs.virustotal.com/reference/public-vs-premium-api) current limits, for instance.

```python
import time

def get_with_retry(url: str, **kw) -> requests.Response:
    for attempt in range(5):
        r = requests.get(url, timeout=10, **kw)
        if r.status_code != 429:
            r.raise_for_status()
            return r
        time.sleep(2 ** attempt)     # back off: 1, 2, 4, 8, 16 seconds
    raise RuntimeError("rate limited too many times")
```

**Exponential backoff** waits longer after each failure. And **cache** results: if you already looked up an IP today, don't ask again. A JSON file or SQLite is plenty.

?? Your tool gets HTTP 429. What's the right response?
+ Wait, retry with backoff, and cache your results
- Send more requests until one finally gets through
- Create several new accounts to bypass the limit
- Treat the indicator as clean, then move on
=> 429 means slow down. Hammering makes it worse, multiple accounts usually break the terms, and assuming clean is a false negative.

## What to send, and what not to

::: trap Lookups can tip off an attacker
Looking up a file **hash** is usually safe: it reveals nothing about the file. But **uploading** a file to a public scanner shares it with the community. It may contain company data, and attackers watch these services to see when they've been noticed. Default to hash lookups.
:::

Compute a hash with the standard library:

```python
import hashlib
print(hashlib.sha256(open("sample.bin", "rb").read()).hexdigest())
```

?? What's safest to do with a suspicious company file?
+ Searching for the file's hash
- Uploading it to public scanners
- Emailing it to every colleague
- Opening it on your laptop
=> A hash reveals nothing about the contents. An upload may share them with the world.

## Build enrich

::: try Part of P03
A CLI that takes IPs, hashes or domains and returns reputation data, with `--offline` mode, a cache, rate limiting and `--json`. Sign up for free keys on [AbuseIPDB](https://www.abuseipdb.com/) and [VirusTotal](https://www.virustotal.com/). Test only with known public indicators.
:::

?! Why is uploading a file to a public scanner riskier than searching for its hash?
