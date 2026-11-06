---
title: Kubernetes and zero trust
summary: The cluster's moving parts, hardening with RBAC and policies, runtime detection, and the idea of never trusting by location.
month: 19
minutes: 40
builds: a hardened local cluster and one architecture decision record
source: Kubernetes security checklist | https://kubernetes.io/docs/concepts/security/security-checklist/
words: pod, zero trust, ADR
---
Two ideas finish the common core: how modern workloads run, and how to design security when you assume that the network can't be trusted.

@term Kubernetes = A system that runs and manages containers across many machines.
@term pod = The smallest unit Kubernetes runs: one or more containers together.
@term namespace (Kubernetes) = A way of dividing a cluster into separate areas.
@term NetworkPolicy = A Kubernetes rule controlling which pods can talk to each other.
@term admission control = Checks that run when something is created in a cluster, and can reject it.
@term Falco = An open-source runtime threat detection tool for containers.
@term zero trust = A security model that verifies every request and grants no trust based on network location.
@term ADR (architecture decision record) = A short document recording a design decision and why it was made.

## The cluster

The **API server** is the front door, **etcd** stores the state, and each node runs a **kubelet**. Almost everything goes through the API server, so who can call it, and with what rights, is the central question.

## Hardening

| Control | Purpose |
|---|---|
| RBAC | Least privilege for people and service accounts |
| Namespaces + NetworkPolicies | Limit who can talk to whom |
| [Pod Security Standards](https://kubernetes.io/docs/concepts/security/pod-security-standards/) | Privileged, Baseline or Restricted profiles |
| Admission policy (Kyverno, OPA) | Reject unsafe workloads |
| Secrets handling | Not in images or plain manifests |
| Falco | Runtime detection |

Default-deny NetworkPolicies are the same idea as your firewall in Month 3. Check your setup with `kube-bench`.

?? Which Pod Security Standard is the most locked down?
+ Restricted
- Baseline
- Privileged
- Unconfined
=> Restricted follows current hardening best practice. Privileged is unrestricted, and Baseline prevents known escalations.

::: ai Roadmap exercise
Have an LLM generate manifests, then validate them. Tally the insecure defaults: privileged pods, wide RBAC, `latest` tags. That tally is a blog post.
:::

## Zero trust

Old thinking: inside the network means trusted. [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) rejects that: no implicit trust from location. Every request is authenticated and authorised, based on identity, device and context.

@flow Who are you? > Is the device healthy? > Is this allowed now? > Grant narrowly > Keep checking

It's a direction, not a product. The [CISA maturity model](https://www.cisa.gov/zero-trust-maturity-model) helps you plan the steps.

## Thinking like an architect

Good architecture is trade-offs written down. An **ADR** records the context, the decision, the options you rejected and the consequences. Start writing them for your own projects.

?? What does "zero trust" actually mean?
+ Nothing is trusted for its network location
- No employees are trusted with any access
- Firewalls are no longer needed by anyone
- A single product that makes you secure
=> It's about removing implicit trust. Access is still granted, but explicitly and narrowly.

?! Write a short ADR: "Why our admin panel requires a managed device, rather than just a VPN."
