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
];

export const pyChallenge = (id: string): PyChallenge | undefined => PY_CHALLENGES.find((c) => c.id === id);
