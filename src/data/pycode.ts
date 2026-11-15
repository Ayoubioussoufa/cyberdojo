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
];

export const pyChallenge = (id: string): PyChallenge | undefined => PY_CHALLENGES.find((c) => c.id === id);
