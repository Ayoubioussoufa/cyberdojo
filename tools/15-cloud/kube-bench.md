---
title: kube-bench
summary: Checks a Kubernetes cluster against the CIS Benchmark.
side: defence
use: open
docs: https://github.com/aquasecurity/kube-bench
alt: trivy, kube-hunter
---
## What it's for
Kubernetes has many security settings, and defaults aren't always safe. kube-bench, from Aqua, checks a cluster against the CIS Kubernetes Benchmark and reports what to fix.

## How it works
It runs as a job in the cluster, inspects the configuration of the control plane and the nodes, and compares each setting with the benchmark. For each item it reports pass, fail or manual-check, with the remediation. So you get a prioritised, standards-based list of what to harden. [Kubernetes attack paths](/modules/10-06-kubernetes-attack-paths/) shows what these settings defend against.

## Try it
::: law Your cluster only
Run it on a cluster you administer, such as a local one.
:::

```
kubectl apply -f https://raw.githubusercontent.com/aquasecurity/kube-bench/main/job.yaml
kubectl logs -f job/kube-bench
```

Run it on a local lab cluster such as kind or minikube, and work through the top failures.

## What defenders see
This is a defender's baseline check for Kubernetes. Automate it, track the results, and pair it with runtime policy such as admission control and network policies, since a benchmark checks configuration, not what workloads do once they're running.

?! A benchmark checks a cluster's configuration. What important risks does it not cover, that you'd need other controls for?
