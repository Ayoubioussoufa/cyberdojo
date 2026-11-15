---
title: Security APIs and secret hygiene
summary: Call threat-intelligence APIs properly, with authentication, rate limits and retries, without ever leaking a key.
month: 4
minutes: 60
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

## What an API call is

When you open a web page, your browser sends a request and a server sends back HTML for a person to read. An API call is the same exchange, except that a program sends the request and the answer is data for a program to read, nearly always as JSON. Every call has the same five parts:

| Part | In the example below | What it's for |
|---|---|---|
| Method | `GET` | What you want to do. `GET` reads, `POST` sends something |
| URL | `https://api.abuseipdb.com/api/v2/check` | Which service, and which question |
| Parameters | `ipAddress=203.0.113.7` | The details of your question |
| Headers | `Key: …` | Information about the request itself, including who you are |
| Response | A status code and a JSON body | Whether it worked, and the answer |

You can make a call with no Python at all. `curl` sends one from the terminal, which is the fastest way to see what a service really returns:

```
curl -G https://api.abuseipdb.com/api/v2/check \
  --data-urlencode "ipAddress=203.0.113.7" \
  -H "Key: $ABUSEIPDB_KEY" -H "Accept: application/json"
```

The answer comes back as JSON, which Python reads as dicts and lists nested inside each other:

```json
{
  "data": {
    "ipAddress": "203.0.113.7",
    "abuseConfidenceScore": 87,
    "countryCode": "NL",
    "totalReports": 41
  }
}
```

To reach the score you walk down one key at a time: `body["data"]` is the inner dict, and `body["data"]["abuseConfidenceScore"]` is the number 87. The field names here are the ones in the [AbuseIPDB documentation](https://docs.abuseipdb.com/); every API publishes its own, and reading that page first saves you an hour of guessing.

?? In an API call, what is a header for?
+ Information about the request, like who you are
- The data that the server sends you back
- The address of the service you are calling
- The number that says whether the call worked
=> Headers travel with the request and describe it. The API key goes there so that it stays out of the URL, which servers and proxies write into their logs.

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

The status code is the first thing to read in any response, before the body:

| Code | Meaning | What your tool should do |
|---|---|---|
| `200` | It worked | Read the JSON |
| `401` or `403` | Your key is missing, wrong or not allowed | Stop and say so. Retrying won't help |
| `404` | The service has nothing at that address | Check the URL |
| `429` | Too many requests | Wait, then retry |
| `500` to `599` | The service itself has a problem | Wait, then retry a few times |

The key in the example comes from `os.environ`, a dict of the variables that your terminal passes to every program it starts. Set one for the current terminal with `export ABUSEIPDB_KEY=your-key`. If the variable is missing, `os.environ["ABUSEIPDB_KEY"]` stops the program at once with a `KeyError`, and that's what you want: a tool with no key should fail at the first line, not half-way through 200 lookups.

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

To load that file in Python, install `python-dotenv` in your virtual environment and call it once at the top of your tool:

```python
from dotenv import load_dotenv
load_dotenv()          # reads .env and adds its lines to os.environ
```

A key can also leak through your own output. Error messages, debug prints and log files get pasted into tickets and chats, so never print a whole key. Show just enough to tell two keys apart.

@code mask-key

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

Write the waiting times yourself. This is the list that the loop above sleeps through.

@code backoff-delays

A cache is a dict with one rule: look there first. The function below takes the cache and the slow lookup as arguments, which is what lets you test it without touching the network.

```python
def lookup(ip, cache, fetch):
    if ip in cache:
        return cache[ip]
    result = fetch(ip)
    cache[ip] = result
    return result
```

Type it rather than copying it, then run the tests. They pass a fake `fetch` that counts how often it's called.

@code cached-lookup

Some answers are too long for one response. With **pagination**, the service sends one page and tells you whether there's more, and you ask again for the next page until there isn't. Check each API's documentation for the name of its page parameter, and count every page as one request against your rate limit.

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

`hashlib.sha256(data)` takes bytes, not text, which is why the file is opened with `"rb"`: read, binary. `.hexdigest()` gives the result as 64 hexadecimal characters, the form every threat-intelligence service expects.

@code sha256-hex

?? What's safest to do with a suspicious company file?
+ Searching for the file's hash
- Uploading it to public scanners
- Emailing it to every colleague
- Opening it on your laptop
=> A hash reveals nothing about the contents. An upload may share them with the world.

## Don't trust the response

An API is somebody else's server. It can be down, it can change, and it can send back something you didn't expect. A tool that assumes every answer is well-formed will crash on the one lookup that mattered. So read a response the way you read a log line: check before you use.

```python
body = r.json()
data = body.get("data")
if not isinstance(data, dict):
    return None                      # no data at all: report "unknown", not "clean"
return data.get("abuseConfidenceScore")
```

`dict.get` returns `None` when a key is missing, where square brackets would raise a `KeyError`. The comment is the security point: when a lookup fails, the honest result is "unknown". Reporting "clean" because you couldn't get an answer is how a real threat gets waved through.

@code read-score

?? A lookup returns HTTP 401. What should your tool do?
+ Stop and report that the key was rejected
- Wait a few seconds, then retry five times
- Mark the indicator as clean and carry on
- Send the same request again without the key
=> 401 means the service doesn't accept your credentials. Waiting changes nothing, and guessing a verdict is worse than having none.

?? The response has no `data` field at all. What should the tool report for that IP?
+ Unknown, because it got no answer
- Clean, because nothing bad was returned
- Malicious, because the lookup went wrong
- Zero, because that's the default score
=> No answer isn't a verdict. Say "unknown", keep the error, and let a person decide.

## Build enrich

::: try Part of P03
A CLI that takes IPs, hashes or domains and returns reputation data, with `--offline` mode, a cache, rate limiting and `--json`. Sign up for free keys on [AbuseIPDB](https://www.abuseipdb.com/) and [VirusTotal](https://www.virustotal.com/). Test only with known public indicators.
:::

?! Why is uploading a file to a public scanner riskier than searching for its hash?
