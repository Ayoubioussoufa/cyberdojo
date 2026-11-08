---
title: Kubernetes security in depth
summary: The control plane, RBAC, service accounts, secrets and network policy. How a cluster's defaults create risk, and the layered controls that keep one pod's problem from spreading.
level: advanced
side: defence
minutes: 50
attack: T1613, T1552.007, T1609
needs: 0074-kubernetes-and-zero-trust, 10-05-container-escape-and-runtime
pair: 10-05-container-escape-and-runtime, 10-07-iac-and-policy-as-code
source: Kubernetes Security Documentation | https://kubernetes.io/docs/concepts/security/
words: service account token, audit policy, admission controller
---
Lesson 74 introduced the cluster, and project P14 hardened one. This module looks at the structure of the risk. Kubernetes is an API for running anything, so whoever controls that API effectively controls every workload. Most cluster compromises follow a similar pattern: a weak workload, a generous identity, and no boundary to stop the next step.

@term admission controller = Kubernetes code that checks or changes API requests before objects are stored.
@term service account token = A credential mounted into pods, which lets them authenticate to the API server.

## Concept

### Fundamentals: the control plane

| Component | Role | Why it matters |
|---|---|---|
| API server | Front door for all actions | Every control meets here |
| etcd | Stores all cluster state, including Secrets | Direct access equals cluster admin |
| Scheduler, controllers | Place and reconcile workloads | Follow API state |
| Kubelet | Runs pods on each node | Node-level control |

A request passes through **authentication**, **authorisation** (RBAC), then **admission** before it's stored. Each is a place to enforce policy.

### RBAC

Roles list verbs on resources, and bindings grant them to subjects. Some permissions are much more powerful than they look.

| Permission | Why it's powerful |
|---|---|
| `create pods` | Can run anything, with any service account in that namespace |
| `get secrets` | Reads credentials |
| `escalate`, `bind` | Can grant higher rights |
| `impersonate` | Can act as another user |
| `nodes/proxy`, `pods/exec` | Can run commands in workloads |

So reviewing RBAC means asking what each role could lead to, not just what it says. Avoid `cluster-admin` for workloads, and avoid wildcards.

### Service accounts

Each pod runs as a service account, and its token is often mounted automatically. If an attacker takes over a pod, then that token is what they get next. If the token is powerful, one vulnerable app becomes control of the cluster. Hence: set `automountServiceAccountToken: false` when a pod doesn't need the API, and give each app its own account. Modern clusters use short-lived projected tokens.

### Other defaults

**Network.** By default, every pod can reach every other pod. **NetworkPolicy** needs a CNI that enforces it, and a default-deny baseline per namespace.

**Secrets.** Kubernetes Secrets are only base64-encoded in the API. Turn on **encryption at rest** for etcd, restrict `get secrets`, and consider an external manager.

**Metadata.** A pod may reach the cloud's metadata endpoint, and with it the node's identity. Block this using network policy, and use workload identity, as in [AWS](/modules/10-01-aws-attack-paths/).

**Pod Security.** The **restricted** standard stops privileged pods and host mounts at admission, which removes [container escape](/modules/10-05-container-escape-and-runtime/) settings.

### Advanced: exposure, audit and supply chain

**Exposed interfaces.** A public API server, an unauthenticated kubelet, or an old dashboard have all led to cryptomining. Keep the control plane private.

**Audit logs** are the cluster's CloudTrail. A policy decides what's recorded. Without them, an investigation is close to blind. Watch for `pods/exec`, new `ClusterRoleBindings`, and access to secrets.

**Multi-tenancy.** A namespace isn't a security boundary. Different trust levels need separate nodes, sandboxed runtimes, or separate clusters.

**Admission as a supply chain gate.** Kyverno or OPA Gatekeeper can require signed images from your registry, so that only what passed [your pipeline](/modules/13-02-cicd-attacks/) can run. Microsoft's [threat matrix for Kubernetes](https://microsoft.github.io/Threat-Matrix-for-Kubernetes/) lays out the stages in ATT&CK style.

?? Why is cluster-admin on a default service account so dangerous?
+ Any compromised pod could control the cluster
- Pods would lose all of their networking
- Nodes would stop pulling images at all
- Secrets would be deleted on each restart
=> Pods use that account's token, so a flaw in any one of them gains full control of the API.

## Threat model

| Technique | ATT&CK |
|---|---|
| Container and resource discovery | [T1613](https://attack.mitre.org/techniques/T1613/) |
| Container API credentials | [T1552.007](https://attack.mitre.org/techniques/T1552/007/) |
| Container administration command | [T1609](https://attack.mitre.org/techniques/T1609/) |

Typical path: a flaw in an internet-facing app, then the mounted token, then the API or node, then cloud credentials.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `kubectl auth can-i --list` | Shows what an identity can do | Reviewing RBAC |
| kube-bench | Checks CIS benchmarks | Cluster audit |
| Kubescape, Trivy | Scan clusters and manifests | CI and audits |
| Falco | Runtime detection | Production |
| Kyverno, Gatekeeper | Admission policy | Enforcing rules |
| [Kubernetes Goat](https://madhuakula.com/kubernetes-goat/) | Vulnerable practice cluster | Learning safely |

## Defence

- **Private API server,** with authentication through your identity provider.
- **Least-privilege RBAC.** Review `create pods`, `get secrets`, `bind`.
- **Disable token automount** unless it's needed.
- **Default-deny NetworkPolicy** in each namespace.
- **Enforce the restricted Pod Security Standard.**
- **Encrypt etcd,** and restrict access to it.
- **Block metadata access** from pods.
- **Turn on audit logging,** and send it to your SIEM.
- **Require signed images** from trusted registries.
- **Keep clusters patched,** since old versions stop receiving fixes.

## Pitfalls

- **"Namespaces isolate tenants."** They organise. They don't isolate.
- **NetworkPolicy with a CNI that ignores it.** Test it.
- **Base64 Secrets treated as encrypted.**
- **`cluster-admin` for Helm or CI.** It's convenient, and very risky.
- **Skipping audit logs** to save money.

?? What does a default-deny NetworkPolicy change?
+ Pods need explicit rules to talk
- Pods need a public IP address
- Nodes reject any new image pulls
- Services lose their stable DNS names
=> Without it, all pods can reach each other. With it, allowed traffic has to be stated.

## Exercise

::: law Lab only
Use `kind`, `minikube` or Kubernetes Goat on your own machine. Don't test any cluster that you don't own.
:::

1. In `kind`, run `kubectl auth can-i --list --as=system:serviceaccount:default:default`.
2. Deploy a pod and read its token path. Set `automountServiceAccountToken: false`, and confirm that it's gone.
3. Apply default-deny NetworkPolicy using a CNI that enforces it, such as Calico or Cilium. Then allow one flow.
4. Label a namespace as `restricted`, and show that a privileged pod is rejected.
5. Enable an audit policy on `kind`, and find `pods/exec` in the log.
6. Work through two Kubernetes Goat scenarios.

?! You inherit a cluster where all apps share one namespace and service account. Write the first five changes, in order, with the risk each removes.

## Further reading

- [Kubernetes Security Checklist](https://kubernetes.io/docs/concepts/security/security-checklist/).
- [NSA and CISA Kubernetes Hardening Guide](https://media.defense.gov/2022/Aug/29/2003066362/-1/-1/0/CTR_KUBERNETES_HARDENING_GUIDANCE_1.2_20220829.PDF).
- [CIS Kubernetes Benchmark](https://www.cisecurity.org/benchmark/kubernetes).
- [Threat Matrix for Kubernetes](https://microsoft.github.io/Threat-Matrix-for-Kubernetes/).
- [RBAC good practices](https://kubernetes.io/docs/concepts/security/rbac-good-practices/).
