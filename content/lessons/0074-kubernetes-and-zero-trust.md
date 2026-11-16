---
title: Kubernetes and zero trust
summary: The cluster's moving parts, hardening with RBAC and policies, runtime detection, the idea of never trusting by location, and writing an ADR.
month: 19
minutes: 80
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
@term etcd = The database where Kubernetes keeps the cluster's state, including secrets.
@term kubelet = The agent on each node that runs pods.
@term node = One machine in a Kubernetes cluster.
@term manifest = A YAML file describing what you want Kubernetes to run.

## The cluster

Imagine a port. Containers arrive, and something has to decide which ship carries them, restart what fails and keep everything in order. **Kubernetes** does this for software.

You write a **manifest** that says what you want, such as "three copies of this image". Kubernetes makes it so.

The **API server** is the front door, **etcd** stores the state, and each **node** runs a **kubelet**. Almost everything goes through the API server, so who can call it, and with what rights, is the central question. It's the same lesson as cloud IAM.

?? Why is unauthenticated access to etcd so serious?
+ It holds the cluster's state and its secrets
- It runs the web pages that users visit
- It only stores some unimportant temporary log files
- It controls the speed of the nodes' disks
=> Reading etcd can reveal everything, including secrets. That's why it needs encryption and strict access.

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

By default, every pod can usually reach every other pod, which turns one compromised pod into a foothold for the rest. And each pod has a **service account**, so a stolen token can call the API with whatever rights that account holds.

Here's what the Restricted profile asks for, written into a pod:

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: web
  namespace: shop
spec:
  automountServiceAccountToken: false
  securityContext:
    runAsNonRoot: true
    seccompProfile:
      type: RuntimeDefault
  containers:
    - name: web
      image: registry.example/shop@sha256:4f1a…
      securityContext:
        allowPrivilegeEscalation: false
        readOnlyRootFilesystem: true
        capabilities:
          drop: ["ALL"]
```

Each line removes something an attacker inside the container would use: root, extra kernel capabilities, the chance to gain privileges through a setuid program, a writable filesystem, and a service-account token the web server never needed. Label the namespace `pod-security.kubernetes.io/enforce: restricted`, and the API server rejects pods that don't comply.

@code pod-security-check

A default-deny policy for a namespace is four lines of `spec`. An empty `podSelector` selects every pod in the namespace, and listing `Ingress` with no rules allows nothing in:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: default-deny-ingress
  namespace: shop
spec:
  podSelector: {}
  policyTypes: ["Ingress"]
```

Then you add one policy for each conversation that should happen, such as the API reaching the database. The rule is easy to get backwards: a pod that **no** policy selects accepts traffic from anywhere, and a pod that any policy selects accepts only what those policies allow.

@code network-policy

RBAC is checked the same way. A Role lists rules, and three patterns deserve a finding: a `*` in verbs or resources, reading `secrets`, and `pods/exec`, which is a shell in someone else's container. Ask the cluster what an identity can really do rather than reading YAML:

```
kubectl auth can-i --list --as=system:serviceaccount:shop:default -n shop
```

@code rbac-review

@drill k8s-control

?? Which Pod Security Standard is the most locked down?
+ Restricted
- Baseline
- Privileged
- Unconfined
=> Restricted follows current hardening best practice. Privileged is unrestricted, and Baseline prevents known escalations.

## Review real manifests

@range k8s

::: ai Roadmap exercise
Have an LLM generate manifests, then validate them. Tally the insecure defaults: privileged pods, wide RBAC, `latest` tags. That tally is a blog post.
:::

## Detecting at runtime

Prevention will sometimes fail. **Falco** watches what containers do at the system-call level, and it alerts on behaviour such as a shell starting inside a web server's container. Since containers should do one narrow job, unusual behaviour stands out clearly. It's the Pyramid of Pain again: detect behaviour.

A Falco rule reads like a sentence:

```yaml
- rule: Shell in a web container
  desc: A shell started inside a container
  condition: spawned_process and container and proc.name in (bash, sh)
  output: "Shell in container (user=%user.name container=%container.name cmd=%proc.cmdline)"
  priority: WARNING
```

`spawned_process` and `container` are macros from Falco's default rules: a new process, inside a container. The output line pulls fields from the event, so the alert says who, where and what without anyone opening a log.

?? Why is detecting odd behaviour often easier in a container than on a laptop?
+ Containers do one narrow, predictable job
- Containers cannot ever run a shell
- Laptops never record any useful events
- Falco blocks attackers before they arrive
=> A web container that suddenly starts a shell stands out. A laptop does a thousand things, so normal is harder to define.

## Zero trust

Old thinking: inside the network means trusted. Think of a castle: once past the wall, you can walk anywhere. [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) rejects that: no implicit trust from location. Every request is authenticated and authorised, based on identity, device and context.

@flow Who are you? > Is the device healthy? > Is this allowed now? > Grant narrowly > Keep checking

It's a direction, not a product. The [CISA maturity model](https://www.cisa.gov/zero-trust-maturity-model) helps you plan the steps.

Written as code, a zero-trust decision looks at the request, not at the network it came from:

| Check | If it fails |
|---|---|
| The role may use this resource | Deny |
| The device is managed, for a sensitive resource | Deny |
| MFA was completed recently | Ask for it again |

The source network appears nowhere in that table. A request from the office and one from a café are judged by the same facts.

@code zero-trust-decision

?? What does "zero trust" actually mean?
+ Nothing is trusted for its network location
- No employees are trusted with any access
- Firewalls are no longer needed by anyone
- A single product that makes you secure
=> It's about removing implicit trust. Access is still granted, but explicitly and narrowly.

## Thinking like an architect

Good architecture is trade-offs written down. An **ADR** records the context, the decision, the options you rejected and the consequences. Start writing them for your own projects.

```
# ADR 7: Admin panel requires a managed device
Status: accepted
Context: Admins log in from home. The VPN gives wide network access.
Decision: Identity-aware proxy, with MFA and a device check.
Rejected: VPN only (a stolen laptop gets everything).
Consequences: Slightly slower logins. Contractors need managed devices.
```

?? What's the most valuable part of an ADR, a year later?
+ Why the other options were rejected back then
- The exact font used when it was written
- A complete copy of all the source code
- The names of all the attendees' many pets
=> Six months on, nobody remembers why. The reasoning stops the team repeating a debate, or undoing a good decision.

## Review a manifest

A team asks you to approve this before it ships.

```yaml
spec:
  containers:
    - name: api
      image: registry.example/api:latest
      securityContext:
        privileged: true
```

And the namespace has no NetworkPolicy at all.

?? What does `privileged: true` give the container?
+ Nearly the power of root on its node
- Faster access to the cluster's own internal network
- A much larger share of the node's memory
- Permission to read only its own log files
=> A privileged container can reach the host's devices and kernel features, so escaping to the node is easy. The Restricted profile forbids it.

?? What does the missing NetworkPolicy mean for this pod?
+ Any pod in the cluster can reach it
- No pod at all can ever reach it
- Only pods in its namespace can reach it
- Only the API server itself can reach it
=> A pod that no policy selects accepts traffic from everywhere. Add a default-deny policy, then allow only the callers it needs.

?? Why is `:latest` a problem here?
+ Nobody can say which image is actually running
- Kubernetes simply refuses every single image tagged latest
- Latest images are always the slowest to start
- The tag makes the container run as root
=> `latest` moves each time someone pushes. Pin by digest, as in lesson 69, so that what was reviewed is what runs.

?! Write a short ADR: "Why our admin panel requires a managed device, rather than just a VPN."
