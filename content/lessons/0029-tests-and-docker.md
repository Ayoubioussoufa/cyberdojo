---
title: Tests, packaging and Docker
summary: Prove your tool works with pytest, package it, containerise it and run it anywhere.
month: 4
minutes: 40
builds: finish P03 with tests, a Dockerfile and a README a stranger can follow
source: pytest documentation | https://docs.pytest.org/
words: unit test, container, image
---
A 50-line script is a toy. Add tests, packaging and a README and it's a tool. That difference is what the roadmap asks of project P03.

@term unit test = A small automated check of one piece of code.
@term pytest = The most popular Python testing framework.
@term fixture file = Sample input kept with the tests, so results are repeatable.
@term Docker = A tool that packages software with its dependencies into containers.
@term image = A read-only template that a container starts from.
@term container = A running, isolated process started from an image.
@term Dockerfile = The recipe that builds a Docker image.
@term CI (continuous integration) = Automatically running tests on every change.

## Tests prove it

```python
# test_logparse.py
from logparse import parse

def test_counts_failures_by_ip():
    failures, skipped = parse("tests/fixtures/auth_small.log")
    assert failures["203.0.113.7"] == 3
    assert skipped == 0

def test_handles_invalid_user_lines():
    failures, _ = parse("tests/fixtures/invalid_user.log")
    assert failures["198.51.100.23"] == 1
```

Run `pytest`. Each test sets up a small input, runs your code and asserts the result. Keep small **fixture files** with real-looking lines, including the weird ones you've seen.

::: key Add a test for each bug
Whenever you fix a bug, first write a test that fails because of it. That's how you stop it coming back. In Month 8 you'll use the same idea to prove a security fix works.
:::

?? You find a log format your parser mishandles. What's the professional order?
+ Add a failing test, fix it, then rerun
- Fix it, then delete the old test files
- Add a comment warning people about the format
- Rewrite the entire parser from scratch again tonight
=> The failing test proves the bug exists, and it keeps guarding you afterwards.

## A sensible project layout

```
toolkit/
├── README.md
├── pyproject.toml
├── src/toolkit/logparse.py
├── src/toolkit/enrich.py
├── tests/
├── .pre-commit-config.yaml
├── Dockerfile
└── .gitignore
```

Work in branches and open pull requests, even alone. Add a [GitHub Actions](https://docs.github.com/en/actions) workflow that runs your tests on every push: that's **CI**, and the green badge is visible proof.

?? What does CI do for your project?
+ Runs your tests on every push
- Writes your tests for you automatically
- Stores your passwords in the cloud
- Deletes any branches you've finished with
=> A green tick means that the tests passed on a clean machine.

## Containers in five minutes

A **container** isn't a virtual machine. A VM has a whole operating system. A container is an isolated process sharing the host's kernel, so it starts in moments. An **image** is the template, and a container is a running instance of it.

| | Virtual machine | Container |
|---|---|---|
| Includes | A full OS with its own kernel | App and libraries, shared kernel |
| Starts in | Minutes | Seconds or less |
| Isolation | Strong | Weaker: a kernel flaw can matter |
| Used for | Labs, malware analysis | Packaging and running apps |

A virtual machine carries a whole operating system:

@stack
App | your tool and its libraries |
Guest OS | with its own kernel |
Hypervisor | VirtualBox |
Host | hardware and host OS |

A container shares the host's kernel, which is why it starts so fast:

@stack
App | your tool and its libraries |
Container runtime | Docker |
Host | hardware and the shared kernel |

```dockerfile
FROM python:3.13-slim
WORKDIR /app
COPY pyproject.toml .
COPY src ./src
RUN pip install --no-cache-dir .
USER nobody
ENTRYPOINT ["logparse"]
```

`USER nobody` means the tool doesn't run as root inside the container: least privilege again. Then:

```
docker build -t toolkit .
docker run --rm -v "$PWD/logs:/data:ro" toolkit /data/auth.log
```

`-v` mounts a folder, and `:ro` makes it read-only. `--rm` cleans up afterwards. Follow [Docker's getting-started guide](https://docs.docker.com/get-started/) to learn compose, volumes and the rest.

?? Why do containers isolate less strongly than virtual machines?
+ They all share the same host kernel
- They have no filesystem of their own
- They can't have any network restrictions applied
- They always run as root by design
=> A VM has its own kernel. Containers rely on the host's, so a kernel flaw can break out. Use VMs for malware.

::: ai Roadmap exercise
Write the tool yourself first. Then ask an LLM to review it and to explain every suggestion. Accept only changes you can justify, and add a test for each accepted fix. Track bugs caught by your tests, bugs caught by the AI, and AI suggestions that were wrong.
:::

## The Month 4 gate

A CLI with `--help`, at least 10 passing tests, a README and a Dockerfile. No secrets in Git history. You can explain every line in a 10-minute walkthrough. At least 5 small scripts in the repo, such as a port scanner with `socket` and a hash checker. See [Month 4](/roadmap/4/).

?! Write the "Quick start" section of your tool's README, so that a stranger can run it in five minutes.
