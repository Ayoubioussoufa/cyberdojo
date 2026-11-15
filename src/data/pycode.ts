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
];

export const pyChallenge = (id: string): PyChallenge | undefined => PY_CHALLENGES.find((c) => c.id === id);
