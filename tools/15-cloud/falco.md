---
title: Falco
summary: Detects suspicious behaviour in containers and on hosts at runtime.
side: defence
use: open
docs: https://falco.org/docs/
alt: wazuh, tracee
---
## What it's for
Scanning finds bad configuration before deployment; Falco watches what actually happens after it. It's the leading open-source runtime security tool for containers and Linux hosts, raising alerts when a workload does something it shouldn't.

## How it works
It reads system calls, through an eBPF probe or a kernel module, and checks them against rules. A rule might say that a shell starting inside a container, or a write to a system directory, is suspicious. Because it watches real behaviour at the kernel level, it catches activity that no configuration check could predict, such as a container that's been compromised at runtime.

## Try it
::: law Your host only
Run it on a lab host or cluster you control.
:::

```
falco
```

With Falco running on a lab host, start a shell inside a running container, and watch the alert that fires. Then read the rule that caught it.

## What defenders see
Falco is the runtime layer of container defence, sitting beside the scanning done earlier. Tune its rules to your workloads to cut noise, ship alerts to your SIEM, and treat "a shell in a production container" as a strong signal. It pairs naturally with [container runtime security](/modules/10-05-container-escape-and-runtime/).

?! Why is runtime detection needed when you already scan every image for vulnerabilities before deployment?
