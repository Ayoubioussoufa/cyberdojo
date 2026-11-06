---
title: Python from zero
summary: Variables, lists, loops, functions and virtual environments, using a security task as the running example.
month: 4
minutes: 45
builds: a small script that flags weak passwords from a list
source: The Python Tutorial, official | https://docs.python.org/3/tutorial/
words: variable, function, virtual environment
---
Bash is great for gluing commands together. When a job gets bigger, with real data structures, APIs and tests, you reach for Python. It's the most requested scripting language in security adverts, and it's what separates juniors who scale from juniors who click.

@term Python = A readable general-purpose programming language, widely used in security automation.
@term list = An ordered collection of values in Python, written with square brackets.
@term dictionary (dict) = A collection of key and value pairs in Python.
@term function = A named, reusable block of code.
@term loop = Code that repeats, once for each item or while a condition holds.
@term module = A Python file you can import to reuse its code.
@term virtual environment (venv) = A private folder of Python packages for one project.
@term exception = An error raised while a program runs, which code can catch.

## Run something

Python reads a file top to bottom and does what it says. Create `hello.py`:

```python
name = "Ana"
attempts = 3
print(f"Hello {name}, you have {attempts} attempts left.")
```

Run it with `python3 hello.py`. The `f` before the quotes lets you put values inside `{}`.

?? What does the `f` in `f"Hello {name}"` do?
+ It puts values inside the text
- It saves the text to files
- It makes the text run faster
- It fixes any spelling in text
=> It's an f-string: anything in `{}` gets filled in.

## The types you'll use constantly

```python
count = 42                              # int: a whole number
ratio = 0.75                            # float
ip = "203.0.113.7"                      # str: text
blocked = True                          # bool
ips = ["10.0.0.1", "10.0.0.2"]          # list: ordered
hits = {"10.0.0.1": 3, "10.0.0.2": 9}   # dict: key to value
seen = {"root", "admin"}                # set: unique values
```

A **dict** is the workhorse of log analysis: `hits[ip]` looks up the count for an IP instantly.

?? You want to count how many times each IP appears. Which structure fits best?
+ A dict mapping each IP to a count
- A list holding every single count in order
- A string containing all the addresses joined up
- A boolean recording each new address you see
=> A dict gives you a direct lookup by key. Python even has `collections.Counter`, built for exactly this.

## Decisions and loops

Python uses **indentation** to group code. Those spaces aren't decoration: they're the structure.

```python
for ip, n in hits.items():
    if n >= 5:
        print(f"{ip} looks like brute force ({n} attempts)")
    elif n > 1:
        print(f"{ip} worth a look")
    else:
        print(f"{ip} is fine")
```

?? What does indentation do in Python?
+ It groups code into blocks
- It only makes code nicer
- It sets the file's size
- It marks lines as comments
=> Those spaces are the structure. Wrong indentation changes what the program does.

## Functions

A **function** names a piece of logic so that you can test and reuse it. Put logic in functions from the start.

```python
def is_weak(password: str) -> bool:
    """Return True if the password fails our basic rules."""
    if len(password) < 12:
        return True
    return password.lower() in {"password123456", "qwertyuiop123"}

print(is_weak("hunter2"))    # True
```

The `: str` and `-> bool` are type hints: they don't change behaviour, but they document intent and tools can check them. The triple-quoted line is a docstring.

?? Why put logic in functions from the start?
+ You can test and reuse it
- Python refuses code outside of them
- Functions always run much faster here
- They hide code from other people
=> Small named pieces are what make testing possible.

## Handling errors

Real data is messy. **Exceptions** let you handle problems rather than crash:

```python
try:
    with open("auth.log") as f:
        lines = f.readlines()
except FileNotFoundError:
    print("No log file found")
```

`with open(...)` closes the file for you, even if something fails.

?? What do `try` and `except` let you do?
+ Handle a problem without crashing
- Prevent every error from happening
- Hide the code from attackers
- Run code twice at once
=> Real data is messy, so a good tool expects problems and handles them.

## Virtual environments

Different projects need different package versions. A **virtual environment** gives each one its own folder.

```
python3 -m venv .venv
source .venv/bin/activate
pip install requests
pip freeze > requirements.txt
```

Add `.venv/` to `.gitignore`. Never install random packages system-wide, and remember the warning from the Handbook's AI guide: [check that a package exists and who publishes it](/guides/d3-using-ai-well/) before you install it.

?? Why use a virtual environment for each project?
+ Each project keeps its own separate package versions
- It encrypts the project's source code on disk
- It makes the Python interpreter run much faster
- It lets the project run without any Python
=> Isolation avoids version conflicts and makes a project reproducible from `requirements.txt`.

::: try Your first tool
Write `weakpass.py`. It reads a file of passwords, one per line, and prints how many fail your rules. Use made-up passwords, never real ones. Then read the [Python tutorial](https://docs.python.org/3/tutorial/) up to chapter 5. If you'd like a structured course, [CS50P](https://cs50.harvard.edu/python/) is excellent.
:::

?! Explain the difference between a list and a dict, and give one security task where each is the right choice.
