/**
 * Interactive Python challenges. A challenge gives the learner a function to
 * write, starter code, and a set of tests that run against what they wrote.
 * The code runs in the browser through Pyodide (Python compiled to
 * WebAssembly); nothing is sent anywhere. The tests here are the ones shown as
 * pass/fail; `solution` is a reference the test suite grades against and is
 * never shown to the learner.
 */
export interface PyTest {
  /** Shown to the learner beside its tick or cross. */
  name: string;
  /** A Python expression that must be truthy once the learner's code has run. */
  expr: string;
}

export interface PyChallenge {
  id: string;
  /** One line: what to build. */
  prompt: string;
  /** What fills the editor to begin. */
  starter: string;
  tests: PyTest[];
  /** A correct answer, used only by the test suite to prove the grader works. Never rendered. */
  solution: string;
}

export const PY_CHALLENGES: PyChallenge[] = [
  {
    id: "is-valid-ip",
    prompt: "Write is_valid_ip(s): return True when s is four whole numbers from 0 to 255 joined by dots (like 127.0.0.1), and False otherwise.",
    starter: "def is_valid_ip(s):\n    # Your code here.\n    return False\n",
    tests: [
      { name: "127.0.0.1 is valid", expr: "is_valid_ip('127.0.0.1') == True" },
      { name: "0.0.0.0 is valid", expr: "is_valid_ip('0.0.0.0') == True" },
      { name: "255.255.255.255 is valid", expr: "is_valid_ip('255.255.255.255') == True" },
      { name: "256.0.0.1 is too big", expr: "is_valid_ip('256.0.0.1') == False" },
      { name: "three parts is not enough", expr: "is_valid_ip('1.2.3') == False" },
      { name: "empty string is not valid", expr: "is_valid_ip('') == False" },
      { name: "words are not numbers", expr: "is_valid_ip('a.b.c.d') == False" },
    ],
    solution:
      "def is_valid_ip(s):\n    parts = s.split('.')\n    if len(parts) != 4:\n        return False\n    for p in parts:\n        if not p.isdigit():\n            return False\n        if int(p) < 0 or int(p) > 255:\n            return False\n    return True\n",
  },
  {
    id: "count-failed-logins",
    prompt: "Write count_failed_logins(lines): given a list of log lines, return how many contain the word FAILED.",
    starter: "def count_failed_logins(lines):\n    # Your code here.\n    return 0\n",
    tests: [
      { name: "counts the FAILED lines", expr: "count_failed_logins(['ok', 'FAILED login', 'FAILED again', 'ok']) == 2" },
      { name: "none failed", expr: "count_failed_logins(['ok', 'ok']) == 0" },
      { name: "empty list is zero", expr: "count_failed_logins([]) == 0" },
      { name: "all failed", expr: "count_failed_logins(['FAILED', 'FAILED']) == 2" },
    ],
    solution: "def count_failed_logins(lines):\n    return sum(1 for line in lines if 'FAILED' in line)\n",
  },
  {
    id: "greet-user",
    prompt: "Write greet(name, attempts): return the text \"Hello NAME, you have N attempts left.\" with the two values filled in. Use an f-string.",
    starter: "def greet(name, attempts):\n    # Your code here.\n    return \"\"\n",
    tests: [
      { name: "greets Ana with 3", expr: "greet('Ana', 3) == 'Hello Ana, you have 3 attempts left.'" },
      { name: "greets root with 0", expr: "greet('root', 0) == 'Hello root, you have 0 attempts left.'" },
      { name: "returns text, not None", expr: "isinstance(greet('x', 1), str)" },
    ],
    solution: "def greet(name, attempts):\n    return f\"Hello {name}, you have {attempts} attempts left.\"\n",
  },
  {
    id: "count-hits",
    prompt: "Write count_hits(ips): given a list of IP addresses, return a dict that maps each address to how many times it appears.",
    starter: "def count_hits(ips):\n    hits = {}\n    # Your code here.\n    return hits\n",
    tests: [
      { name: "counts repeats", expr: "count_hits(['10.0.0.1', '10.0.0.2', '10.0.0.1']) == {'10.0.0.1': 2, '10.0.0.2': 1}" },
      { name: "one address, three times", expr: "count_hits(['10.0.0.9'] * 3) == {'10.0.0.9': 3}" },
      { name: "empty list gives an empty dict", expr: "count_hits([]) == {}" },
      { name: "every address is a key", expr: "sorted(count_hits(['b', 'a', 'c', 'a'])) == ['a', 'b', 'c']" },
    ],
    solution: "def count_hits(ips):\n    hits = {}\n    for ip in ips:\n        hits[ip] = hits.get(ip, 0) + 1\n    return hits\n",
  },
  {
    id: "classify-attempts",
    prompt: "Write classify(n): return 'brute force' when n is 5 or more, 'worth a look' when n is more than 1, and 'fine' otherwise.",
    starter: "def classify(n):\n    # Your code here.\n    return \"fine\"\n",
    tests: [
      { name: "9 attempts is brute force", expr: "classify(9) == 'brute force'" },
      { name: "exactly 5 is brute force", expr: "classify(5) == 'brute force'" },
      { name: "4 is worth a look", expr: "classify(4) == 'worth a look'" },
      { name: "2 is worth a look", expr: "classify(2) == 'worth a look'" },
      { name: "1 is fine", expr: "classify(1) == 'fine'" },
      { name: "0 is fine", expr: "classify(0) == 'fine'" },
    ],
    solution: "def classify(n):\n    if n >= 5:\n        return 'brute force'\n    elif n > 1:\n        return 'worth a look'\n    return 'fine'\n",
  },
  {
    id: "is-weak-password",
    prompt: "Write is_weak(password): return True when the password is shorter than 12 characters or contains no digit, and False otherwise.",
    starter: "def is_weak(password):\n    # Your code here.\n    return False\n",
    tests: [
      { name: "a short one is weak", expr: "is_weak('hunter2') == True" },
      { name: "long but no digit is weak", expr: "is_weak('correcthorsebattery') == True" },
      { name: "long with a digit is not weak", expr: "is_weak('correct-horse-7-battery') == False" },
      { name: "exactly 12 with a digit is not weak", expr: "is_weak('abcdefghijk1') == False" },
      { name: "11 characters is weak", expr: "is_weak('abcdefghij1') == True" },
      { name: "the empty password is weak", expr: "is_weak('') == True" },
    ],
    solution: "def is_weak(password):\n    if len(password) < 12:\n        return True\n    has_digit = False\n    for ch in password:\n        if ch.isdigit():\n            has_digit = True\n    return not has_digit\n",
  },
  {
    id: "parse-port",
    prompt: "Write parse_port(text): return the port as a whole number when text is a number from 1 to 65535, and None for anything else. int() raises ValueError on text that is not a number: catch it.",
    starter: "def parse_port(text):\n    # Your code here.\n    return int(text)\n",
    tests: [
      { name: "'22' becomes 22", expr: "parse_port('22') == 22" },
      { name: "'65535' is the highest port", expr: "parse_port('65535') == 65535" },
      { name: "'ssh' is not a number", expr: "parse_port('ssh') is None" },
      { name: "the empty string is not a number", expr: "parse_port('') is None" },
      { name: "'0' is out of range", expr: "parse_port('0') is None" },
      { name: "'70000' is out of range", expr: "parse_port('70000') is None" },
    ],
    solution: "def parse_port(text):\n    try:\n        port = int(text)\n    except ValueError:\n        return None\n    if port < 1 or port > 65535:\n        return None\n    return port\n",
  },
  {
    id: "extract-ip",
    prompt: "Write extract_ip(line): return the first IPv4-shaped address in the line (four groups of digits joined by dots), or None when there is none. Use the re module.",
    starter: "import re\n\ndef extract_ip(line):\n    # Your code here.\n    return None\n",
    tests: [
      { name: "finds the address in an sshd line", expr: "extract_ip('sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2') == '203.0.113.7'" },
      { name: "finds an address at the start", expr: "extract_ip('198.51.100.20 - - GET /login') == '198.51.100.20'" },
      { name: "returns the first of two", expr: "extract_ip('from 10.0.0.1 to 10.0.0.2') == '10.0.0.1'" },
      { name: "no address gives None", expr: "extract_ip('session opened for user ana') is None" },
      { name: "three groups is not an address", expr: "extract_ip('version 1.2.3 installed') is None" },
    ],
    solution: "import re\n\ndef extract_ip(line):\n    m = re.search(r'\\d+\\.\\d+\\.\\d+\\.\\d+', line)\n    if m:\n        return m.group(0)\n    return None\n",
  },
  {
    id: "failures-by-ip",
    prompt: "Write failures_by_ip(lines): look only at lines that contain \"Failed password\". Return two things, (counts, skipped): counts is a dict from source IP (the address after \"from \") to its number of failures, and skipped is how many \"Failed password\" lines had no address you could read.",
    starter: "import re\n\ndef failures_by_ip(lines):\n    counts = {}\n    skipped = 0\n    # Your code here.\n    return counts, skipped\n",
    tests: [
      {
        name: "counts failures per address",
        expr: "failures_by_ip(['Failed password for root from 203.0.113.7 port 1 ssh2', 'Failed password for invalid user bob from 203.0.113.7 port 2 ssh2', 'Failed password for ana from 198.51.100.4 port 3 ssh2']) == ({'203.0.113.7': 2, '198.51.100.4': 1}, 0)",
      },
      { name: "ignores lines that are not failures", expr: "failures_by_ip(['Accepted password for ana from 198.51.100.4 port 3 ssh2', 'session opened']) == ({}, 0)" },
      { name: "counts a failure it cannot read as skipped", expr: "failures_by_ip(['Failed password for root from ??? port 1', 'Failed password for root from 203.0.113.7 port 1 ssh2']) == ({'203.0.113.7': 1}, 1)" },
      { name: "empty input", expr: "failures_by_ip([]) == ({}, 0)" },
    ],
    solution:
      "import re\n\nLINE = re.compile(r'from (\\d+\\.\\d+\\.\\d+\\.\\d+)')\n\ndef failures_by_ip(lines):\n    counts = {}\n    skipped = 0\n    for line in lines:\n        if 'Failed password' not in line:\n            continue\n        m = LINE.search(line)\n        if m:\n            ip = m.group(1)\n            counts[ip] = counts.get(ip, 0) + 1\n        else:\n            skipped += 1\n    return counts, skipped\n",
  },
  {
    id: "json-report",
    prompt: "Write report(counts, skipped): return a JSON string for an object with two keys: \"top\", a list of [ip, count] pairs ordered from the highest count to the lowest, and \"skipped\", the number you were given.",
    starter: "import json\n\ndef report(counts, skipped):\n    # Your code here.\n    return \"{}\"\n",
    tests: [
      { name: "the output is valid JSON with both keys", expr: "sorted(__import__('json').loads(report({'10.0.0.1': 2}, 0))) == ['skipped', 'top']" },
      { name: "top is ordered by count, highest first", expr: "__import__('json').loads(report({'10.0.0.1': 2, '10.0.0.2': 9, '10.0.0.3': 5}, 0))['top'] == [['10.0.0.2', 9], ['10.0.0.3', 5], ['10.0.0.1', 2]]" },
      { name: "skipped is passed through", expr: "__import__('json').loads(report({}, 4)) == {'top': [], 'skipped': 4}" },
      { name: "it returns a string", expr: "isinstance(report({}, 0), str)" },
    ],
    solution:
      "import json\n\ndef report(counts, skipped):\n    top = sorted(counts.items(), key=lambda pair: pair[1], reverse=True)\n    return json.dumps({\"top\": top, \"skipped\": skipped})\n",
  },
  {
    id: "mask-key",
    prompt: "Write mask_key(key): return the key with every character replaced by * except the last four. A key of four characters or fewer is masked completely.",
    starter: "def mask_key(key):\n    # Your code here.\n    return key\n",
    tests: [
      { name: "keeps only the last four", expr: "mask_key('abcd1234efgh') == '********efgh'" },
      { name: "the length stays the same", expr: "len(mask_key('x' * 40)) == 40" },
      { name: "a four-character key is fully masked", expr: "mask_key('abcd') == '****'" },
      { name: "a two-character key is fully masked", expr: "mask_key('ab') == '**'" },
      { name: "the empty key stays empty", expr: "mask_key('') == ''" },
    ],
    solution: "def mask_key(key):\n    if len(key) <= 4:\n        return '*' * len(key)\n    return '*' * (len(key) - 4) + key[-4:]\n",
  },
  {
    id: "backoff-delays",
    prompt: "Write backoff_delays(attempts): return the list of waiting times, in seconds, for that many attempts with exponential backoff: 1, then 2, then 4, doubling each time.",
    starter: "def backoff_delays(attempts):\n    delays = []\n    # Your code here.\n    return delays\n",
    tests: [
      { name: "five attempts", expr: "backoff_delays(5) == [1, 2, 4, 8, 16]" },
      { name: "one attempt", expr: "backoff_delays(1) == [1]" },
      { name: "no attempts gives an empty list", expr: "backoff_delays(0) == []" },
      { name: "eight attempts end at 128", expr: "backoff_delays(8)[-1] == 128" },
    ],
    solution: "def backoff_delays(attempts):\n    delays = []\n    for attempt in range(attempts):\n        delays.append(2 ** attempt)\n    return delays\n",
  },
  {
    id: "cached-lookup",
    prompt: "Write lookup(ip, cache, fetch): if ip is already a key of the dict cache, return the stored value. Otherwise call fetch(ip), store what it returns in cache under ip, and return it.",
    starter: "def lookup(ip, cache, fetch):\n    # Your code here.\n    return fetch(ip)\n",
    tests: [
      { name: "returns what fetch returns", expr: "lookup('10.0.0.1', {}, lambda ip: 87) == 87" },
      { name: "stores the answer in the cache", expr: "(lambda cache: (lookup('10.0.0.1', cache, lambda ip: 87), cache))({})[1] == {'10.0.0.1': 87}" },
      { name: "uses the cache when the answer is there", expr: "lookup('10.0.0.1', {'10.0.0.1': 5}, lambda ip: 87) == 5" },
      {
        name: "asks only once for the same address",
        expr: "(lambda calls, cache: (lookup('a', cache, lambda ip: calls.append(ip) or 7), lookup('a', cache, lambda ip: calls.append(ip) or 7), len(calls)))([], {}) == (7, 7, 1)",
      },
      {
        name: "asks again for a different address",
        expr: "(lambda calls, cache: (lookup('a', cache, lambda ip: calls.append(ip) or 7), lookup('b', cache, lambda ip: calls.append(ip) or 7), len(calls)))([], {})[2] == 2",
      },
    ],
    solution: "def lookup(ip, cache, fetch):\n    if ip in cache:\n        return cache[ip]\n    result = fetch(ip)\n    cache[ip] = result\n    return result\n",
  },
  {
    id: "sha256-hex",
    prompt: "Write sha256_hex(data): given bytes, return their SHA-256 hash as 64 hexadecimal characters. Use the hashlib module.",
    starter: "import hashlib\n\ndef sha256_hex(data):\n    # Your code here.\n    return \"\"\n",
    tests: [
      { name: "the hash of b'abc'", expr: "sha256_hex(b'abc') == 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'" },
      { name: "the hash of no bytes at all", expr: "sha256_hex(b'') == 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'" },
      { name: "always 64 characters", expr: "len(sha256_hex(b'any file contents')) == 64" },
      { name: "one changed byte changes the hash", expr: "sha256_hex(b'report.pdf') != sha256_hex(b'report.pdg')" },
    ],
    solution: "import hashlib\n\ndef sha256_hex(data):\n    return hashlib.sha256(data).hexdigest()\n",
  },
  {
    id: "read-score",
    prompt: "Write read_score(body): body is the parsed JSON of a response. Return body['data']['abuseConfidenceScore'] when it is there, and None when body is not a dict, has no 'data' dict, or has no score. It must never raise.",
    starter: "def read_score(body):\n    # Your code here.\n    return body[\"data\"][\"abuseConfidenceScore\"]\n",
    tests: [
      { name: "reads the score", expr: "read_score({'data': {'abuseConfidenceScore': 87, 'countryCode': 'NL'}}) == 87" },
      { name: "a score of 0 is still a score", expr: "read_score({'data': {'abuseConfidenceScore': 0}}) == 0" },
      { name: "no data field gives None", expr: "read_score({'errors': [{'detail': 'bad key'}]}) is None" },
      { name: "data without a score gives None", expr: "read_score({'data': {'countryCode': 'NL'}}) is None" },
      { name: "data that is not a dict gives None", expr: "read_score({'data': 'oops'}) is None" },
      { name: "a body that is a list gives None", expr: "read_score([]) is None" },
    ],
    solution:
      "def read_score(body):\n    if not isinstance(body, dict):\n        return None\n    data = body.get('data')\n    if not isinstance(data, dict):\n        return None\n    return data.get('abuseConfidenceScore')\n",
  },
  {
    id: "spot-the-bugs",
    prompt: "parse_port(text) should return the port as a whole number for '1' to '65535', and None for anything else. Write spots_bugs(parse_port): you are handed one version of that function. Call it on inputs of your choice and return True if every answer is right, False as soon as one is wrong. The tests give you a correct version and four buggy ones.",
    starter: "def spots_bugs(parse_port):\n    # One check is written for you. Add the ones that catch the bugs.\n    if parse_port('22') != 22:\n        return False\n    return True\n",
    tests: [
      { name: "accepts a correct parse_port", expr: "spots_bugs(lambda t: (int(t) if t.isdigit() and 1 <= int(t) <= 65535 else None)) == True" },
      { name: "catches a version that accepts port 0", expr: "spots_bugs(lambda t: (int(t) if t.isdigit() and 0 <= int(t) <= 65535 else None)) == False" },
      { name: "catches a version that rejects port 65535", expr: "spots_bugs(lambda t: (int(t) if t.isdigit() and 1 <= int(t) <= 65534 else None)) == False" },
      { name: "catches a version that rejects port 1", expr: "spots_bugs(lambda t: (int(t) if t.isdigit() and 2 <= int(t) <= 65535 else None)) == False" },
      { name: "catches a version that returns 0 for text", expr: "spots_bugs(lambda t: (int(t) if t.isdigit() and 1 <= int(t) <= 65535 else 0)) == False" },
    ],
    solution:
      "def spots_bugs(parse_port):\n    cases = [('22', 22), ('1', 1), ('65535', 65535), ('0', None), ('65536', None), ('ssh', None), ('', None)]\n    for text, expected in cases:\n        if parse_port(text) != expected:\n            return False\n    return True\n",
  },
  {
    id: "decode-enc",
    prompt: "Write decode_enc(b64): given the text that follows -enc on a PowerShell command line, return the command it hides. It is Base64 of UTF-16LE text. Use the base64 module.",
    starter: "import base64\n\ndef decode_enc(b64):\n    # Your code here.\n    return \"\"\n",
    tests: [
      { name: "decodes Get-Date", expr: "decode_enc('RwBlAHQALQBEAGEAdABlAA==') == 'Get-Date'" },
      { name: "decodes a command with spaces and quotes", expr: "decode_enc('VwByAGkAdABlAC0ATwB1AHQAcAB1AHQAIAAnAGgAZQBsAGwAbwAnAA==') == \"Write-Output 'hello'\"" },
      { name: "the result has no null characters left", expr: "'\\x00' not in decode_enc('RwBlAHQALQBEAGEAdABlAA==')" },
      { name: "an empty string decodes to an empty string", expr: "decode_enc('') == ''" },
    ],
    solution: "import base64\n\ndef decode_enc(b64):\n    return base64.b64decode(b64).decode('utf-16-le')\n",
  },
  {
    id: "ps-flags",
    prompt: "Write ps_flags(cmdline): return a list of the warning signs found on a PowerShell command line, in this order: 'encoded' if it contains -enc, 'hidden' if it contains -w hidden, 'noprofile' if it contains -nop. Ignore upper and lower case. Return an empty list when none is present.",
    starter: "def ps_flags(cmdline):\n    flags = []\n    # Your code here.\n    return flags\n",
    tests: [
      { name: "all three signs", expr: "ps_flags('powershell -nop -w hidden -enc SQBFAFgA') == ['encoded', 'hidden', 'noprofile']" },
      { name: "an ordinary command has none", expr: "ps_flags('powershell Get-Service') == []" },
      { name: "upper case still counts", expr: "ps_flags('PowerShell.exe -NoP -W Hidden -Enc AAAA') == ['encoded', 'hidden', 'noprofile']" },
      { name: "only the encoded sign", expr: "ps_flags('powershell -enc AAAA') == ['encoded']" },
      { name: "the long form -EncodedCommand counts as encoded", expr: "ps_flags('powershell -EncodedCommand AAAA') == ['encoded']" },
    ],
    solution:
      "def ps_flags(cmdline):\n    text = cmdline.lower()\n    flags = []\n    if '-enc' in text:\n        flags.append('encoded')\n    if '-w hidden' in text:\n        flags.append('hidden')\n    if '-nop' in text:\n        flags.append('noprofile')\n    return flags\n",
  },
  {
    id: "query-params",
    prompt: "Write query_params(url): return a dict of the parameters in the URL's query string, with percent-encoding decoded. A URL with no query string gives an empty dict. Use urllib.parse: urlsplit(url).query gives the query string, and parse_qsl turns it into pairs.",
    starter: "from urllib.parse import urlsplit, parse_qsl\n\ndef query_params(url):\n    # Your code here.\n    return {}\n",
    tests: [
      { name: "two parameters", expr: "query_params('https://shop.example/search?q=boots&page=2') == {'q': 'boots', 'page': '2'}" },
      { name: "%20 becomes a space", expr: "query_params('https://shop.example/search?q=red%20boots') == {'q': 'red boots'}" },
      { name: "no query string gives an empty dict", expr: "query_params('https://shop.example/about') == {}" },
      { name: "the fragment is not a parameter", expr: "query_params('https://shop.example/item?id=7#reviews') == {'id': '7'}" },
      { name: "an encoded slash is decoded", expr: "query_params('https://shop.example/go?next=%2Fhome') == {'next': '/home'}" },
    ],
    solution: "from urllib.parse import urlsplit, parse_qsl\n\ndef query_params(url):\n    return dict(parse_qsl(urlsplit(url).query))\n",
  },
  {
    id: "parse-request",
    prompt: "Write parse_request(text): text is a raw HTTP request whose lines are separated by \\n. Return (method, path, headers): the first two words of the first line, and a dict of the header lines up to the first empty line. Header names go in lower case, and values have the spaces around them removed.",
    starter: "def parse_request(text):\n    lines = text.split(\"\\n\")\n    # Your code here.\n    return \"\", \"\", {}\n",
    tests: [
      { name: "reads the method", expr: "parse_request('GET /index.html HTTP/1.1\\nHost: shop.example\\n\\n')[0] == 'GET'" },
      { name: "reads the path, query string included", expr: "parse_request('POST /login?next=/home HTTP/1.1\\nHost: shop.example\\n\\n')[1] == '/login?next=/home'" },
      { name: "reads the headers", expr: "parse_request('GET / HTTP/1.1\\nHost: shop.example\\nCookie: session=abc123\\n\\n')[2] == {'host': 'shop.example', 'cookie': 'session=abc123'}" },
      { name: "header names are lower-cased", expr: "'user-agent' in parse_request('GET / HTTP/1.1\\nUser-Agent: curl/8.5.0\\n\\n')[2]" },
      { name: "the body is not read as a header", expr: "parse_request('POST /login HTTP/1.1\\nHost: shop.example\\n\\nnote: this is the body')[2] == {'host': 'shop.example'}" },
      { name: "a value may contain a colon", expr: "parse_request('GET / HTTP/1.1\\nReferer: https://a.example/x\\n\\n')[2] == {'referer': 'https://a.example/x'}" },
    ],
    solution:
      "def parse_request(text):\n    lines = text.split(\"\\n\")\n    method, path = lines[0].split(\" \")[0], lines[0].split(\" \")[1]\n    headers = {}\n    for line in lines[1:]:\n        if line.strip() == \"\":\n            break\n        name, value = line.split(\":\", 1)\n        headers[name.strip().lower()] = value.strip()\n    return method, path, headers\n",
  },
  {
    id: "status-class",
    prompt: "Write status_class(code): given an HTTP status code as a whole number, return 'success' for 200 to 299, 'redirect' for 300 to 399, 'client error' for 400 to 499, 'server error' for 500 to 599, and 'other' for anything else.",
    starter: "def status_class(code):\n    # Your code here.\n    return \"other\"\n",
    tests: [
      { name: "200 is a success", expr: "status_class(200) == 'success'" },
      { name: "201 is a success", expr: "status_class(201) == 'success'" },
      { name: "302 is a redirect", expr: "status_class(302) == 'redirect'" },
      { name: "404 is a client error", expr: "status_class(404) == 'client error'" },
      { name: "429 is a client error", expr: "status_class(429) == 'client error'" },
      { name: "503 is a server error", expr: "status_class(503) == 'server error'" },
      { name: "599 is still a server error", expr: "status_class(599) == 'server error'" },
      { name: "100 and 600 are other", expr: "status_class(100) == 'other' and status_class(600) == 'other'" },
    ],
    solution:
      "def status_class(code):\n    if 200 <= code <= 299:\n        return 'success'\n    if 300 <= code <= 399:\n        return 'redirect'\n    if 400 <= code <= 499:\n        return 'client error'\n    if 500 <= code <= 599:\n        return 'server error'\n    return 'other'\n",
  },
  {
    id: "missing-cookie-flags",
    prompt: "Write missing_flags(set_cookie): given the value of a Set-Cookie header, return the list of protections it lacks, in this order: 'HttpOnly', 'Secure', 'SameSite'. Flags are separated by semicolons and may be written in any case. A cookie with all three gives an empty list.",
    starter: "def missing_flags(set_cookie):\n    missing = []\n    # Your code here.\n    return missing\n",
    tests: [
      { name: "a fully protected cookie", expr: "missing_flags('session=x7f3k9; HttpOnly; Secure; SameSite=Lax; Path=/') == []" },
      { name: "a bare cookie lacks all three", expr: "missing_flags('session=1042; Path=/') == ['HttpOnly', 'Secure', 'SameSite']" },
      { name: "only Secure is missing", expr: "missing_flags('id=abc; HttpOnly; SameSite=Strict') == ['Secure']" },
      { name: "lower case flags count", expr: "missing_flags('id=abc; httponly; secure; samesite=lax') == []" },
      { name: "a value that contains the word secure is not the flag", expr: "missing_flags('note=secure; HttpOnly; SameSite=Lax') == ['Secure']" },
    ],
    solution:
      "def missing_flags(set_cookie):\n    parts = [p.strip().lower() for p in set_cookie.split(';')[1:]]\n    names = [p.split('=')[0] for p in parts]\n    missing = []\n    for flag in ['HttpOnly', 'Secure', 'SameSite']:\n        if flag.lower() not in names:\n            missing.append(flag)\n    return missing\n",
  },
  {
    id: "jwt-payload",
    prompt: "Write jwt_payload(token): a JWT is three parts joined by dots. Return the middle part decoded into a dict. It is Base64URL without padding, so add '=' characters until its length is a multiple of 4, then use base64.urlsafe_b64decode and json.loads.",
    starter: "import base64, json\n\ndef jwt_payload(token):\n    # Your code here.\n    return {}\n",
    tests: [
      {
        name: "reads the subject and the role",
        expr: "jwt_payload('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJhbmEiLCJyb2xlIjoidXNlciIsImV4cCI6MTc5NDAwMDAwMH0.c2lnbmF0dXJl') == {'sub': 'ana', 'role': 'user', 'exp': 1794000000}",
      },
      { name: "works when padding is needed", expr: "jwt_payload('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJibyIsInJvbGUiOiJhZG1pbiJ9.eA') == {'sub': 'bo', 'role': 'admin'}" },
      { name: "no key was needed", expr: "jwt_payload('x.eyJzdWIiOiJibyIsInJvbGUiOiJhZG1pbiJ9.y')['role'] == 'admin'" },
    ],
    solution:
      "import base64, json\n\ndef jwt_payload(token):\n    part = token.split('.')[1]\n    while len(part) % 4 != 0:\n        part += '='\n    return json.loads(base64.urlsafe_b64decode(part))\n",
  },
  {
    id: "same-origin",
    prompt: "Write same_origin(a, b): return True when the two URLs have the same scheme, the same host and the same port. A URL with no port uses 443 for https and 80 for http. urlsplit(url) gives .scheme, .hostname and .port (None when no port is written).",
    starter: "from urllib.parse import urlsplit\n\ndef same_origin(a, b):\n    # Your code here.\n    return False\n",
    tests: [
      { name: "a different path is the same origin", expr: "same_origin('https://shop.example', 'https://shop.example/cart') == True" },
      { name: "a different scheme is not", expr: "same_origin('https://shop.example', 'http://shop.example') == False" },
      { name: "a different host is not", expr: "same_origin('https://shop.example', 'https://api.shop.example') == False" },
      { name: "a different port is not", expr: "same_origin('https://shop.example', 'https://shop.example:8443') == False" },
      { name: "the default https port is the same origin", expr: "same_origin('https://shop.example', 'https://shop.example:443/x') == True" },
      { name: "the default http port is the same origin", expr: "same_origin('http://shop.example:80', 'http://shop.example') == True" },
    ],
    solution:
      "from urllib.parse import urlsplit\n\ndef origin(url):\n    u = urlsplit(url)\n    port = u.port\n    if port is None:\n        port = 443 if u.scheme == 'https' else 80\n    return (u.scheme, u.hostname, port)\n\ndef same_origin(a, b):\n    return origin(a) == origin(b)\n",
  },
  {
    id: "users-with-role",
    prompt: "Write users_with_role(db, role): return the list of names of the users who have that role, in alphabetical order. Pass role as a parameter with a ? placeholder: one test sends a role that tries to rewrite the query.",
    starter: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef users_with_role(db, role):\n    rows = db.execute(\"SELECT name FROM users\").fetchall()\n    # Change the query: filter on the role, with a ? placeholder, and sort by name.\n    return [row[0] for row in rows]\n",
    tests: [
      { name: "the two ordinary users", expr: "users_with_role(make_db(), 'user') == ['sam', 'tom']" },
      { name: "the one admin", expr: "users_with_role(make_db(), 'admin') == ['ana']" },
      { name: "a role nobody has gives an empty list", expr: "users_with_role(make_db(), 'auditor') == []" },
      { name: "an injection attempt finds nobody", expr: "users_with_role(make_db(), \"x' OR '1'='1\") == []" },
    ],
    solution: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef users_with_role(db, role):\n    rows = db.execute(\"SELECT name FROM users WHERE role = ? ORDER BY name\", (role,)).fetchall()\n    return [row[0] for row in rows]\n",
  },
  {
    id: "orders-with-names",
    prompt: "Write orders_with_names(db): return one (name, total) pair for each order, joining orders to users, sorted from the highest total to the lowest.",
    starter: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef orders_with_names(db):\n    # Your query here: JOIN orders to users, and ORDER BY the total.\n    return db.execute(\"SELECT user_id, total FROM orders\").fetchall()\n",
    tests: [
      { name: "names, not user ids", expr: "orders_with_names(make_db())[0][0] == 'sam'" },
      { name: "every order, highest total first", expr: "orders_with_names(make_db()) == [('sam', 70), ('ana', 40), ('sam', 15)]" },
      { name: "a user with no orders does not appear", expr: "'tom' not in [row[0] for row in orders_with_names(make_db())]" },
    ],
    solution: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef orders_with_names(db):\n    return db.execute(\"SELECT users.name, orders.total FROM orders JOIN users ON orders.user_id = users.id ORDER BY orders.total DESC\").fetchall()\n",
  },
  {
    id: "big-spenders",
    prompt: "Write big_spenders(db, minimum): return (name, spent) for each user whose orders add up to more than minimum, where spent is the sum of their totals, highest first. Use GROUP BY and HAVING, and pass minimum as a parameter.",
    starter: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef big_spenders(db, minimum):\n    # Your query here: JOIN, GROUP BY the user, HAVING on the sum.\n    return []\n",
    tests: [
      { name: "more than 50", expr: "big_spenders(make_db(), 50) == [('sam', 85)]" },
      { name: "more than 10 keeps both buyers, highest first", expr: "big_spenders(make_db(), 10) == [('sam', 85), ('ana', 40)]" },
      { name: "more than 100 keeps nobody", expr: "big_spenders(make_db(), 100) == []" },
      { name: "exactly 40 is not more than 40", expr: "big_spenders(make_db(), 40) == [('sam', 85)]" },
    ],
    solution: "import sqlite3\n\ndef make_db():\n    # A small shop database, built in memory. Leave this function as it is.\n    db = sqlite3.connect(':memory:')\n    db.executescript(\"\"\"\n        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);\n        CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, total INTEGER);\n        INSERT INTO users VALUES (1, 'ana', 'admin'), (2, 'sam', 'user'), (3, 'tom', 'user');\n        INSERT INTO orders VALUES (10, 1, 40), (11, 2, 15), (12, 2, 70);\n    \"\"\")\n    return db\n\ndef big_spenders(db, minimum):\n    return db.execute(\"SELECT users.name, SUM(orders.total) AS spent FROM orders JOIN users ON orders.user_id = users.id GROUP BY users.id HAVING SUM(orders.total) > ? ORDER BY spent DESC\", (minimum,)).fetchall()\n",
  },
  {
    id: "hash-kind",
    prompt: "Write hash_kind(value): return 'MD5' for 32 hex characters, 'SHA-1' for 40, 'SHA-256' for 64, and 'unknown' for anything else. Hex characters are 0-9 and a-f, in either case.",
    starter: "def hash_kind(value):\n    # Your code here.\n    return \"unknown\"\n",
    tests: [
      { name: "an MD5", expr: "hash_kind('5d41402abc4b2a76b9719d911017c592') == 'MD5'" },
      { name: "a SHA-1", expr: "hash_kind('aaf4c61ddcc5e8a2dabede0f3b482cd9aea9434d') == 'SHA-1'" },
      { name: "a SHA-256", expr: "hash_kind('2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824') == 'SHA-256'" },
      { name: "upper case is still hex", expr: "hash_kind('5D41402ABC4B2A76B9719D911017C592') == 'MD5'" },
      { name: "32 characters that are not hex", expr: "hash_kind('z' * 32) == 'unknown'" },
      { name: "the wrong length", expr: "hash_kind('abc123') == 'unknown'" },
    ],
    solution: "def hash_kind(value):\n    text = value.lower()\n    for ch in text:\n        if ch not in '0123456789abcdef':\n            return 'unknown'\n    kinds = {32: 'MD5', 40: 'SHA-1', 64: 'SHA-256'}\n    return kinds.get(len(text), 'unknown')\n",
  },
  {
    id: "matches-hash",
    prompt: "Write matches_hash(data, expected): data is bytes and expected is a SHA-256 written in hex. Return True when the hash of data equals expected. Ignore upper or lower case and any spaces around expected.",
    starter: "import hashlib\n\ndef matches_hash(data, expected):\n    # Your code here.\n    return False\n",
    tests: [
      { name: "the right hash matches", expr: "matches_hash(b'hello', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824') == True" },
      { name: "one changed letter does not", expr: "matches_hash(b'hellp', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824') == False" },
      { name: "upper case still matches", expr: "matches_hash(b'hello', '2CF24DBA5FB0A30E26E83B2AC5B9E29E1B161E5C1FA7425E73043362938B9824') == True" },
      { name: "spaces around the hash are ignored", expr: "matches_hash(b'hello', '  2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824\\n') == True" },
      { name: "an empty expected hash never matches", expr: "matches_hash(b'hello', '') == False" },
    ],
    solution: "import hashlib\n\ndef matches_hash(data, expected):\n    return hashlib.sha256(data).hexdigest() == expected.strip().lower()\n",
  },
  {
    id: "verify-hmac",
    prompt: "Write verify(key, message, tag): key and message are bytes, tag is hex text. Return True when tag is the HMAC-SHA256 of message under key. Compare with hmac.compare_digest.",
    starter: "import hmac, hashlib\n\ndef verify(key, message, tag):\n    # Your code here.\n    return True\n",
    tests: [
      { name: "a genuine message", expr: "verify(b'k3y', b'amount=100', '7a9c5ea080b9ca5ac916cc47557769a1189824f3892120b2487d45ead0480caf') == True" },
      { name: "a changed message with the old tag", expr: "verify(b'k3y', b'amount=900', '7a9c5ea080b9ca5ac916cc47557769a1189824f3892120b2487d45ead0480caf') == False" },
      { name: "the right message under the wrong key", expr: "verify(b'other', b'amount=100', '7a9c5ea080b9ca5ac916cc47557769a1189824f3892120b2487d45ead0480caf') == False" },
      { name: "a plain SHA-256 is not an HMAC", expr: "verify(b'k3y', b'hello', '2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824') == False" },
      { name: "an empty tag", expr: "verify(b'k3y', b'amount=100', '') == False" },
    ],
    solution: "import hmac, hashlib\n\ndef verify(key, message, tag):\n    expected = hmac.new(key, message, hashlib.sha256).hexdigest()\n    return hmac.compare_digest(expected, tag)\n",
  },
  {
    id: "dh-shared",
    prompt: "Write two functions for a Diffie-Hellman exchange with base g and modulus p. public_value(g, secret, p) returns the number a side sends in the open. shared_secret(their_public, my_secret, p) returns the secret that side computes. Both are one call to pow with three arguments.",
    starter: "def public_value(g, secret, p):\n    # Your code here.\n    return 0\n\ndef shared_secret(their_public, my_secret, p):\n    # Your code here.\n    return 0\n",
    tests: [
      { name: "Ana sends 8", expr: "public_value(5, 6, 23) == 8" },
      { name: "Bo sends 19", expr: "public_value(5, 15, 23) == 19" },
      { name: "Ana computes 2", expr: "shared_secret(19, 6, 23) == 2" },
      { name: "Bo computes 2", expr: "shared_secret(8, 15, 23) == 2" },
      { name: "both sides always agree", expr: "shared_secret(public_value(7, 91, 7919), 44, 7919) == shared_secret(public_value(7, 44, 7919), 91, 7919)" },
    ],
    solution: "def public_value(g, secret, p):\n    return pow(g, secret, p)\n\ndef shared_secret(their_public, my_secret, p):\n    return pow(their_public, my_secret, p)\n",
  },
  {
    id: "cert-name-matches",
    prompt: "Write name_matches(host, pattern): return True when a certificate name covers the host. An ordinary name must equal the host. A name that starts with *. covers the host only when the host is exactly one label followed by the rest of the name. Ignore upper and lower case.",
    starter: "def name_matches(host, pattern):\n    # Your code here.\n    return host == pattern\n",
    tests: [
      { name: "an exact name", expr: "name_matches('shop.example', 'shop.example') == True" },
      { name: "a different name", expr: "name_matches('shop.example', 'bank.example') == False" },
      { name: "a wildcard covers one label", expr: "name_matches('api.shop.example', '*.shop.example') == True" },
      { name: "a wildcard does not cover the bare domain", expr: "name_matches('shop.example', '*.shop.example') == False" },
      { name: "a wildcard does not cover two labels", expr: "name_matches('a.b.shop.example', '*.shop.example') == False" },
      { name: "case is ignored", expr: "name_matches('API.Shop.Example', '*.shop.example') == True" },
      { name: "a lookalike ending is not a match", expr: "name_matches('api.myshop.example', '*.shop.example') == False" },
    ],
    solution: "def name_matches(host, pattern):\n    host, pattern = host.lower(), pattern.lower()\n    if not pattern.startswith('*.'):\n        return host == pattern\n    rest = pattern[2:]\n    first, _, tail = host.partition('.')\n    return first != '' and tail == rest\n",
  },
  {
    id: "password-hash",
    prompt: "Write two functions. hash_password(password, salt, iterations) returns the PBKDF2-HMAC-SHA256 of the password as hex text: password is text, so encode it to bytes first, and salt is already bytes. verify_password(password, salt, iterations, stored) returns True when hashing the password again gives stored. Compare with hmac.compare_digest.",
    starter: "import hashlib, hmac\n\ndef hash_password(password, salt, iterations):\n    # hashlib.pbkdf2_hmac('sha256', password_bytes, salt, iterations) returns bytes; .hex() turns them into text.\n    return \"\"\n\ndef verify_password(password, salt, iterations, stored):\n    # Your code here.\n    return False\n",
    tests: [
      { name: "the known value for hunter2 with salt-a", expr: "hash_password('hunter2', b'salt-a', 1000) == 'f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4'" },
      { name: "a different salt gives a different hash", expr: "hash_password('hunter2', b'salt-a', 1000) != hash_password('hunter2', b'salt-b', 1000)" },
      { name: "more iterations give a different hash", expr: "hash_password('hunter2', b'salt-a', 1000) != hash_password('hunter2', b'salt-a', 2000)" },
      { name: "the right password verifies", expr: "verify_password('hunter2', b'salt-a', 1000, 'f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4') == True" },
      { name: "the wrong password does not", expr: "verify_password('hunter3', b'salt-a', 1000, 'f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4') == False" },
      { name: "the right password with the wrong salt does not", expr: "verify_password('hunter2', b'salt-b', 1000, 'f681163bbdaa9270a5c685ee22d3be6c24577bcccc63df0f10b2b67f465ff9d4') == False" },
    ],
    solution: "import hashlib, hmac\n\ndef hash_password(password, salt, iterations):\n    return hashlib.pbkdf2_hmac('sha256', password.encode(), salt, iterations).hex()\n\ndef verify_password(password, salt, iterations, stored):\n    return hmac.compare_digest(hash_password(password, salt, iterations), stored)\n",
  },
  {
    id: "login-rate-limit",
    prompt: "Write allow_attempt(failures, now, limit, window): failures is a list of the times, in seconds, of an account's earlier failed logins. Return True when fewer than limit of them happened in the last window seconds before now, so that another attempt may go ahead.",
    starter: "def allow_attempt(failures, now, limit, window):\n    # Your code here.\n    return True\n",
    tests: [
      { name: "no failures yet", expr: "allow_attempt([], 1000, 5, 60) == True" },
      { name: "four recent failures, limit five", expr: "allow_attempt([990, 991, 992, 993], 1000, 5, 60) == True" },
      { name: "five recent failures, limit five", expr: "allow_attempt([990, 991, 992, 993, 994], 1000, 5, 60) == False" },
      { name: "old failures no longer count", expr: "allow_attempt([100, 101, 102, 103, 104], 1000, 5, 60) == True" },
      { name: "a mix of old and recent", expr: "allow_attempt([100, 101, 990, 991, 992, 993, 994], 1000, 5, 60) == False" },
      { name: "a failure exactly one window ago has expired", expr: "allow_attempt([940, 995, 996, 997, 998], 1000, 5, 60) == True" },
    ],
    solution: "def allow_attempt(failures, now, limit, window):\n    recent = 0\n    for t in failures:\n        if now - t < window:\n            recent += 1\n    return recent < limit\n",
  },
  {
    id: "can-read-note",
    prompt: "Write can_read(user, note): user is a dict with 'id' and 'role', and note is a dict with 'owner_id'. Return True when the user owns the note or has the role 'admin'. When user is None, nobody is logged in: return False.",
    starter: "def can_read(user, note):\n    # Your code here.\n    return True\n",
    tests: [
      { name: "the owner can read", expr: "can_read({'id': 2, 'role': 'user'}, {'owner_id': 2}) == True" },
      { name: "another user cannot", expr: "can_read({'id': 2, 'role': 'user'}, {'owner_id': 1}) == False" },
      { name: "an admin can read any note", expr: "can_read({'id': 9, 'role': 'admin'}, {'owner_id': 1}) == True" },
      { name: "nobody logged in cannot", expr: "can_read(None, {'owner_id': 1}) == False" },
      { name: "a role that only looks like admin does not count", expr: "can_read({'id': 3, 'role': 'administrator-wannabe'}, {'owner_id': 1}) == False" },
    ],
    solution: "def can_read(user, note):\n    if user is None:\n        return False\n    return user['id'] == note['owner_id'] or user['role'] == 'admin'\n",
  },
  {
    id: "extra-access",
    prompt: "Write extra_access(users, allowed): users is a list of dicts with 'name', 'department' and 'groups'. allowed maps each department to the groups its people may have. Return a list of (name, group) pairs for every group a user has that their department doesn't allow, in the order you meet them.",
    starter: "def extra_access(users, allowed):\n    findings = []\n    # Your code here.\n    return findings\n",
    tests: [
      { name: "a mover who kept the old group", expr: "extra_access([{'name': 'ana', 'department': 'marketing', 'groups': ['finance-read', 'marketing-edit']}], {'finance': ['finance-read'], 'marketing': ['marketing-edit', 'web-publish']}) == [('ana', 'finance-read')]" },
      { name: "a clean account gives nothing", expr: "extra_access([{'name': 'sam', 'department': 'finance', 'groups': ['finance-read']}], {'finance': ['finance-read'], 'marketing': ['marketing-edit', 'web-publish']}) == []" },
      { name: "two users, findings in order", expr: "extra_access([{'name': 'ana', 'department': 'marketing', 'groups': ['finance-read']}, {'name': 'tom', 'department': 'finance', 'groups': ['finance-read', 'web-publish']}], {'finance': ['finance-read'], 'marketing': ['marketing-edit', 'web-publish']}) == [('ana', 'finance-read'), ('tom', 'web-publish')]" },
      { name: "an unknown department allows nothing", expr: "extra_access([{'name': 'leo', 'department': 'interns', 'groups': ['finance-read']}], {'finance': ['finance-read'], 'marketing': ['marketing-edit', 'web-publish']}) == [('leo', 'finance-read')]" },
      { name: "no users, no findings", expr: "extra_access([], {'finance': ['finance-read'], 'marketing': ['marketing-edit', 'web-publish']}) == []" },
    ],
    solution: "def extra_access(users, allowed):\n    findings = []\n    for user in users:\n        permitted = allowed.get(user['department'], [])\n        for group in user['groups']:\n            if group not in permitted:\n                findings.append((user['name'], group))\n    return findings\n",
  },
  {
    id: "stale-accounts",
    prompt: "Write stale_accounts(accounts, today, days): accounts is a list of dicts with 'name' and 'last_login', a date as 'YYYY-MM-DD' text or None if the account never logged in. today is a date in the same form. Return the names whose last login is more than days days before today, or who never logged in. date.fromisoformat(text) turns the text into a date, and subtracting two dates gives a value with a .days number.",
    starter: "from datetime import date\n\ndef stale_accounts(accounts, today, days):\n    stale = []\n    # Your code here.\n    return stale\n",
    tests: [
      { name: "an old login is stale", expr: "stale_accounts([{'name': 'ana', 'last_login': '2026-03-01'}], '2026-11-15', 90) == ['ana']" },
      { name: "a recent login is not", expr: "stale_accounts([{'name': 'sam', 'last_login': '2026-11-10'}], '2026-11-15', 90) == []" },
      { name: "never logged in counts as stale", expr: "stale_accounts([{'name': 'svc-old', 'last_login': None}], '2026-11-15', 90) == ['svc-old']" },
      { name: "exactly 90 days ago is not more than 90", expr: "stale_accounts([{'name': 'tom', 'last_login': '2026-08-17'}], '2026-11-15', 90) == []" },
      { name: "91 days ago is", expr: "stale_accounts([{'name': 'tom', 'last_login': '2026-08-16'}], '2026-11-15', 90) == ['tom']" },
      { name: "a mixed list keeps its order", expr: "stale_accounts([{'name': 'a', 'last_login': '2025-01-01'}, {'name': 'b', 'last_login': '2026-11-14'}, {'name': 'c', 'last_login': None}], '2026-11-15', 30) == ['a', 'c']" },
    ],
    solution: "from datetime import date\n\ndef stale_accounts(accounts, today, days):\n    now = date.fromisoformat(today)\n    stale = []\n    for account in accounts:\n        last = account['last_login']\n        if last is None or (now - date.fromisoformat(last)).days > days:\n            stale.append(account['name'])\n    return stale\n",
  },
  {
    id: "hotp-code",
    prompt: "Write hotp(secret, counter): return the six-digit one-time code for a secret (bytes) and a counter (a whole number), as text with leading zeros kept. The HMAC is computed for you. Take the last 4 bits of the digest as a position, read 4 bytes from there as a big-endian number, clear its top bit with & 0x7fffffff, and keep the last six decimal digits.",
    starter: "import hmac, hashlib, struct\n\ndef hotp(secret, counter):\n    digest = hmac.new(secret, struct.pack('>Q', counter), hashlib.sha1).digest()\n    # digest is 20 bytes. digest[-1] & 0x0f gives the position.\n    # int.from_bytes(some_bytes, 'big') turns bytes into a number.\n    return \"000000\"\n",
    tests: [
      { name: "the first code of the RFC 4226 test secret", expr: "hotp(b'12345678901234567890', 0) == '755224'" },
      { name: "the second", expr: "hotp(b'12345678901234567890', 1) == '287082'" },
      { name: "the third", expr: "hotp(b'12345678901234567890', 2) == '359152'" },
      { name: "a leading zero is kept", expr: "hotp(b'12345678901234567890', 37037036) == '081804'" },
      { name: "a different secret gives a different code", expr: "hotp(b'another-secret', 0) != hotp(b'12345678901234567890', 0)" },
    ],
    solution: "import hmac, hashlib, struct\n\ndef hotp(secret, counter):\n    digest = hmac.new(secret, struct.pack('>Q', counter), hashlib.sha1).digest()\n    position = digest[-1] & 0x0f\n    number = int.from_bytes(digest[position:position + 4], 'big') & 0x7fffffff\n    return str(number % 1000000).zfill(6)\n",
  },
  {
    id: "pkce-challenge",
    prompt: "Write pkce_challenge(verifier): return the PKCE code challenge for a code verifier given as text. It is the SHA-256 of the verifier, encoded with base64.urlsafe_b64encode, with the = padding removed, as text.",
    starter: "import hashlib, base64\n\ndef pkce_challenge(verifier):\n    # Your code here.\n    return \"\"\n",
    tests: [
      { name: "the example from RFC 7636", expr: "pkce_challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk') == 'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'" },
      { name: "another verifier", expr: "pkce_challenge('a-different-verifier') == 'AkNVVHAAJGZURriUoiB3SOS2JidiVGdHI-ZhLoPPKP8'" },
      { name: "no padding is left", expr: "'=' not in pkce_challenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')" },
      { name: "always 43 characters", expr: "len(pkce_challenge('x')) == 43" },
    ],
    solution: "import hashlib, base64\n\ndef pkce_challenge(verifier):\n    digest = hashlib.sha256(verifier.encode()).digest()\n    return base64.urlsafe_b64encode(digest).decode().rstrip('=')\n",
  },
  {
    id: "redirect-allowed",
    prompt: "Write redirect_allowed(uri, registered): return True only when uri is exactly one of the addresses in the list registered. The starter accepts anything that begins like a registered address, and the tests show why that is not enough.",
    starter: "def redirect_allowed(uri, registered):\n    for allowed in registered:\n        if uri.startswith(allowed):\n            return True\n    return False\n",
    tests: [
      { name: "a registered address", expr: "redirect_allowed('https://app.example/callback', ['https://app.example/callback', 'https://app.example/silent-renew']) == True" },
      { name: "the second registered address", expr: "redirect_allowed('https://app.example/silent-renew', ['https://app.example/callback', 'https://app.example/silent-renew']) == True" },
      { name: "an unknown site", expr: "redirect_allowed('https://evil.example/callback', ['https://app.example/callback', 'https://app.example/silent-renew']) == False" },
      { name: "a longer host that starts the same", expr: "redirect_allowed('https://app.example/callback.evil.example/x', ['https://app.example/callback', 'https://app.example/silent-renew']) == False" },
      { name: "extra path after the registered one", expr: "redirect_allowed('https://app.example/callback/../admin', ['https://app.example/callback', 'https://app.example/silent-renew']) == False" },
      { name: "the same address over http", expr: "redirect_allowed('http://app.example/callback', ['https://app.example/callback', 'https://app.example/silent-renew']) == False" },
    ],
    solution: "def redirect_allowed(uri, registered):\n    return uri in registered\n",
  },
  {
    id: "id-token-problems",
    prompt: "Write id_token_problems(claims, issuer, client_id, now): claims is the decoded payload of an ID token, a dict with 'iss', 'aud' and 'exp'. Return a list of what is wrong, in this order: 'wrong issuer' if iss is not issuer, 'wrong audience' if aud is not client_id, 'expired' if exp is not later than now. A good token gives an empty list.",
    starter: "def id_token_problems(claims, issuer, client_id, now):\n    problems = []\n    # Your code here.\n    return problems\n",
    tests: [
      { name: "a good token", expr: "id_token_problems({'iss': 'https://idp.example', 'aud': 'notes-app', 'exp': 2000}, 'https://idp.example', 'notes-app', 1000) == []" },
      { name: "issued to another app", expr: "id_token_problems({'iss': 'https://idp.example', 'aud': 'calendar-app', 'exp': 2000}, 'https://idp.example', 'notes-app', 1000) == ['wrong audience']" },
      { name: "from another provider", expr: "id_token_problems({'iss': 'https://idp.evil.example', 'aud': 'notes-app', 'exp': 2000}, 'https://idp.example', 'notes-app', 1000) == ['wrong issuer']" },
      { name: "expired", expr: "id_token_problems({'iss': 'https://idp.example', 'aud': 'notes-app', 'exp': 900}, 'https://idp.example', 'notes-app', 1000) == ['expired']" },
      { name: "expiring this very second counts as expired", expr: "id_token_problems({'iss': 'https://idp.example', 'aud': 'notes-app', 'exp': 1000}, 'https://idp.example', 'notes-app', 1000) == ['expired']" },
      { name: "everything wrong, in order", expr: "id_token_problems({'iss': 'x', 'aud': 'y', 'exp': 1}, 'https://idp.example', 'notes-app', 1000) == ['wrong issuer', 'wrong audience', 'expired']" },
    ],
    solution: "def id_token_problems(claims, issuer, client_id, now):\n    problems = []\n    if claims['iss'] != issuer:\n        problems.append('wrong issuer')\n    if claims['aud'] != client_id:\n        problems.append('wrong audience')\n    if claims['exp'] <= now:\n        problems.append('expired')\n    return problems\n",
  },
  {
    id: "parse-dn",
    prompt: "Write parse_dn(dn): given a distinguished name such as 'CN=Ana Diaz,OU=Finance,OU=Staff,DC=corp,DC=lab', return a dict with three keys: 'cn' is the common name, 'ous' is the list of OU names in the order written, and 'domain' is the DC parts joined by dots. Parts are separated by commas, and each part is a type, an equals sign and a value.",
    starter: "def parse_dn(dn):\n    cn = \"\"\n    ous = []\n    dcs = []\n    for part in dn.split(','):\n        kind, value = part.split('=', 1)\n        # Your code here: put value in the right place according to kind.\n    return {'cn': cn, 'ous': ous, 'domain': '.'.join(dcs)}\n",
    tests: [
      { name: "a user in two OUs", expr: "parse_dn('CN=Ana Diaz,OU=Finance,OU=Staff,DC=corp,DC=lab') == {'cn': 'Ana Diaz', 'ous': ['Finance', 'Staff'], 'domain': 'corp.lab'}" },
      { name: "an object with no OU", expr: "parse_dn('CN=Administrator,DC=corp,DC=lab') == {'cn': 'Administrator', 'ous': [], 'domain': 'corp.lab'}" },
      { name: "a three-part domain", expr: "parse_dn('CN=srv1,OU=Servers,DC=eu,DC=corp,DC=example')['domain'] == 'eu.corp.example'" },
      { name: "lower-case types are accepted", expr: "parse_dn('cn=svc_sql,ou=Service Accounts,dc=corp,dc=lab') == {'cn': 'svc_sql', 'ous': ['Service Accounts'], 'domain': 'corp.lab'}" },
    ],
    solution: "def parse_dn(dn):\n    cn = \"\"\n    ous = []\n    dcs = []\n    for part in dn.split(','):\n        kind, value = part.split('=', 1)\n        kind = kind.strip().upper()\n        if kind == 'CN':\n            cn = value\n        elif kind == 'OU':\n            ous.append(value)\n        elif kind == 'DC':\n            dcs.append(value)\n    return {'cn': cn, 'ous': ous, 'domain': '.'.join(dcs)}\n",
  },
  {
    id: "risky-service-accounts",
    prompt: "Write risky_service_accounts(accounts, today, max_age): accounts is a list of dicts with 'name', 'spn' (text, or None when the account has no SPN), 'password_set' (a date as 'YYYY-MM-DD') and 'groups'. Look only at accounts that have an SPN. Return a list of (name, reason) pairs, in order: reason is 'old password' when the password was set more than max_age days before today, and 'domain admin' when 'Domain Admins' is in groups. An account can give both, old password first.",
    starter: "from datetime import date\n\ndef risky_service_accounts(accounts, today, max_age):\n    findings = []\n    # Your code here.\n    return findings\n",
    tests: [
      { name: "the full review", expr: "risky_service_accounts([{'name': 'svc_sql', 'spn': 'MSSQLSvc/srv1.corp.lab:1433', 'password_set': '2019-03-14', 'groups': ['Domain Admins']}, {'name': 'svc_web', 'spn': 'HTTP/web1.corp.lab', 'password_set': '2026-10-01', 'groups': []}, {'name': 'ana.diaz', 'spn': None, 'password_set': '2018-01-01', 'groups': ['Domain Admins']}, {'name': 'svc_old', 'spn': 'HOST/old1.corp.lab', 'password_set': '2024-01-01', 'groups': []}], '2026-11-15', 365) == [('svc_sql', 'old password'), ('svc_sql', 'domain admin'), ('svc_old', 'old password')]" },
      { name: "a person without an SPN is not a service account", expr: "'ana.diaz' not in [name for name, reason in risky_service_accounts([{'name': 'svc_sql', 'spn': 'MSSQLSvc/srv1.corp.lab:1433', 'password_set': '2019-03-14', 'groups': ['Domain Admins']}, {'name': 'svc_web', 'spn': 'HTTP/web1.corp.lab', 'password_set': '2026-10-01', 'groups': []}, {'name': 'ana.diaz', 'spn': None, 'password_set': '2018-01-01', 'groups': ['Domain Admins']}, {'name': 'svc_old', 'spn': 'HOST/old1.corp.lab', 'password_set': '2024-01-01', 'groups': []}], '2026-11-15', 365)]" },
      { name: "a recent password and no powerful group is clean", expr: "'svc_web' not in [name for name, reason in risky_service_accounts([{'name': 'svc_sql', 'spn': 'MSSQLSvc/srv1.corp.lab:1433', 'password_set': '2019-03-14', 'groups': ['Domain Admins']}, {'name': 'svc_web', 'spn': 'HTTP/web1.corp.lab', 'password_set': '2026-10-01', 'groups': []}, {'name': 'ana.diaz', 'spn': None, 'password_set': '2018-01-01', 'groups': ['Domain Admins']}, {'name': 'svc_old', 'spn': 'HOST/old1.corp.lab', 'password_set': '2024-01-01', 'groups': []}], '2026-11-15', 365)]" },
      { name: "a stricter limit catches more", expr: "('svc_web', 'old password') in risky_service_accounts([{'name': 'svc_sql', 'spn': 'MSSQLSvc/srv1.corp.lab:1433', 'password_set': '2019-03-14', 'groups': ['Domain Admins']}, {'name': 'svc_web', 'spn': 'HTTP/web1.corp.lab', 'password_set': '2026-10-01', 'groups': []}, {'name': 'ana.diaz', 'spn': None, 'password_set': '2018-01-01', 'groups': ['Domain Admins']}, {'name': 'svc_old', 'spn': 'HOST/old1.corp.lab', 'password_set': '2024-01-01', 'groups': []}], '2026-11-15', 30)" },
      { name: "no accounts, no findings", expr: "risky_service_accounts([], '2026-11-15', 365) == []" },
    ],
    solution: "from datetime import date\n\ndef risky_service_accounts(accounts, today, max_age):\n    now = date.fromisoformat(today)\n    findings = []\n    for account in accounts:\n        if not account['spn']:\n            continue\n        if (now - date.fromisoformat(account['password_set'])).days > max_age:\n            findings.append((account['name'], 'old password'))\n        if 'Domain Admins' in account['groups']:\n            findings.append((account['name'], 'domain admin'))\n    return findings\n",
  },
];

export const pyChallenge = (id: string): PyChallenge | undefined => PY_CHALLENGES.find((c) => c.id === id);
