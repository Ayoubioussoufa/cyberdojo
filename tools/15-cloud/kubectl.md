---
title: kubectl
summary: Controls a Kubernetes cluster: lists, inspects and changes what runs on it.
side: both
use: open
docs: https://kubernetes.io/docs/reference/kubectl/
alt: docker, kube-bench, trivy
---
## What it's for
Kubernetes runs containers across many machines, restarting them when they fail and adding more when demand grows. `kubectl` is how people and scripts talk to its API server: to see what runs, read logs, deploy changes and, for a security reviewer, check who may do what.

## How it works
Everything in Kubernetes is an object described in YAML: pods (one or more containers), deployments that keep pods running, services that give them a stable address, secrets, and RBAC roles. `kubectl` reads your credentials from `~/.kube/config` and sends requests to the API server, which checks them against RBAC before acting. Namespaces divide a cluster into separate areas.

## Try it
```
kubectl get pods -A
kubectl describe pod NAME -n NAMESPACE
kubectl logs NAME -n NAMESPACE
kubectl auth can-i --list
kubectl get rolebindings,clusterrolebindings -A
kubectl get pod NAME -o yaml
```

Practise on a local cluster such as kind or minikube. `auth can-i --list` shows what your own credentials allow, which is the first question in any review.

## What defenders see
The API server's audit log records every request and who made it, so it's the key log of a cluster. Watch for broad RBAC (anyone bound to `cluster-admin`), pods running privileged or as root, service accounts that may create pods, and secrets that many accounts can read. [kube-bench](/tools/kube-bench/) checks a cluster against the CIS benchmark, and the [Kubernetes attack paths](/modules/10-06-kubernetes-attack-paths/) module explains where each weakness leads.

?! `kubectl auth can-i create pods` answers `yes` for a web application's service account. Why does that matter if the application is compromised?
