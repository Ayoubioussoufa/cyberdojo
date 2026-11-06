---
title: Parsing logs with Python
summary: Regular expressions, files, JSON and CSV, turning a messy log into a structured report.
month: 4
minutes: 45
builds: logparse, the first tool in your P03 toolkit
source: Python re module documentation | https://docs.python.org/3/library/re.html
words: regular expression, JSON, parser
---
In lesson 6 you answered a question with one pipeline. What about ten questions, on three log formats, every day, with tests? That's when you write a parser.

@term parser = Code that reads text and turns it into structured data.
@term JSON = A text format for structured data, used by most APIs.
@term CSV = A plain text table with values separated by commas.
@term CLI tool = A program you run from the command line with options.
@term argparse = The Python standard library module for building command-line options.

## Regular expressions in Python

You've met `^`, `$`, `.` and `[0-9]`. Python's [`re` module](https://docs.python.org/3/library/re.html) adds capture groups, which extract the parts you want.

```python
import re

LINE = re.compile(
    r"Failed password for (?:invalid user )?(?P<user>\S+) "
    r"from (?P<ip>\d+\.\d+\.\d+\.\d+) port (?P<port>\d+)"
)

m = LINE.search("sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2")
if m:
    print(m.group("ip"))     # 203.0.113.7
```

| Pattern | Meaning |
|---|---|
| `\d+` | One or more digits |
| `\S+` | One or more non-spaces |
| `(?P<name>...)` | A named capture group |
| `(?:...)?` | An optional group, not captured |
| `r"..."` | A raw string, so backslashes stay literal |

Note `(?:invalid user )?`. Real logs have variations like this, and a regex that ignores them silently drops data.

::: trap A silent parsing bug is worse than no tool
If your parser skips the lines it doesn't understand, your numbers look fine and they're wrong. Count the lines you couldn't parse, and report that number.
:::

?? What does `\d+` match in `port 44122`?
+ The whole number, all five digits
- Only the first digit, the `4`
- The word `port` plus one space
- Everything up to the line ending
=> `\d` is one digit and `+` means one or more, so it takes all of them.

## From lines to a report

```python
from collections import Counter

def parse(path: str) -> tuple[Counter, int]:
    failures: Counter = Counter()
    skipped = 0
    with open(path, encoding="utf-8", errors="replace") as f:
        for line in f:
            if "Failed password" not in line:
                continue
            m = LINE.search(line)
            if m:
                failures[m.group("ip")] += 1
            else:
                skipped += 1
    return failures, skipped
```

`errors="replace"` matters: logs can contain any bytes, including attacker-controlled ones. `failures.most_common(5)` then gives the top five. Same logic as your pipeline, but now it can be tested and extended.

## Structured output

Tools should talk in structured formats so that other tools can use them.

```python
import csv, json

print(json.dumps({"top": failures.most_common(5), "skipped": skipped}, indent=2))

with open("report.csv", "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["ip", "failures"])
    w.writerows(failures.most_common())
```

## A real command-line interface

```python
import argparse

def main() -> None:
    ap = argparse.ArgumentParser(description="Summarise failed SSH logins.")
    ap.add_argument("logfile")
    ap.add_argument("--top", type=int, default=5)
    ap.add_argument("--json", action="store_true", help="output JSON")
    args = ap.parse_args()
    ...

if __name__ == "__main__":
    main()
```

`--help` now works automatically, and that's one of your exit-gate items.

?? Why add a `--json` output mode to a security tool?
+ Other tools can consume its output more reliably
- JSON output makes the parser run much faster
- It hides sensitive data from anyone reading it
- Terminals can't display plain text reports very well
=> Composability. A human-friendly table is hard to parse, while JSON lets the next tool or script use your results.

::: try Build logparse
Parse `auth.log` and a web access log. Report the top source IPs, the most targeted usernames, unusual hours and rare user agents. Include a `skipped` count. This becomes part of [P03](/projects/P03/).

Keep practising small patterns on [regex101](https://regex101.com/), choosing the Python flavour.
:::

?! Your parser reports zero failures on a log you know has attacks. List three things you'd check.
