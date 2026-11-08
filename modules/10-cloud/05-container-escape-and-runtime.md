---
title: Container isolation and runtime security
summary: What keeps a container in its box, the settings that quietly remove those walls, and how sandboxed runtimes and runtime detection reduce the damage when something goes wrong.
level: advanced
side: defence
minutes: 45
attack: T1611, T1610, T1609
needs: 02-03-linux-confinement, 0069-supply-chain-and-pipelines
pair: 02-03-linux-confinement, 10-06-kubernetes-attack-paths
source: CIS Docker Benchmark | https://www.cisecurity.org/benchmark/docker
words: container runtime, rootless container, sandboxed runtime
---
A container is a process with restrictions, sharing the host's kernel, as [Linux confinement](/modules/02-03-linux-confinement/) explained. So its isolation depends on those restrictions staying in place. Most container breakouts don't need a clever exploit. They happen because a setting turned the walls off, usually to make something work.

@term container runtime = The software that creates and runs containers, such as runc or containerd.
@term rootless container = A container run entirely by an unprivileged user on the host.
@term sandboxed runtime = A container runtime that adds a further isolation layer between the workload and the host kernel.

## Concept

### Fundamentals: the layers of the wall

| Layer | What it limits |
|---|---|
| Namespaces | What a process can see |
| Cgroups | How much it can use |
| Capabilities | Which root powers it has |
| Seccomp | Which system calls it can make |
| AppArmor or SELinux | What it can access |
| Read-only filesystem | What it can change |
| User namespaces | Who it is on the host |

Each is a separate safeguard. Together, they give defence in depth.

### Settings that remove the walls

These are the misconfigurations a reviewer should look for first.

| Setting | Why it's dangerous |
|---|---|
| `--privileged` | Turns off nearly every layer above |
| Docker socket mounted | Gives control of the host's daemon |
| Host paths such as `/` or `/etc` | Host files become writable |
| `--pid=host`, `--net=host` | Shares the host's namespaces |
| `CAP_SYS_ADMIN` and similar | Very broad kernel access |
| Running as root, with no user namespace | UID 0 inside is UID 0 outside |

The **Docker socket** deserves emphasis. Anyone who can talk to it can start a new container with any settings, so it's equal to root on the host. Monitoring and CI tools often ask for it. Treat each such request as a privileged grant, and look for an alternative.

### Runtime and kernel flaws

Since all containers share one kernel, a kernel flaw can cross the boundary. Runtimes have flaws too, such as [CVE-2019-5736](https://nvd.nist.gov/vuln/detail/CVE-2019-5736) in `runc`, and the 2024 ["Leaky Vessels"](https://snyk.io/blog/cve-2024-21626-runc-process-cwd-container-breakout/) issues. So patching hosts, and runtimes, still matters, even if images are perfect.

### Advanced: stronger isolation

**Rootless containers** run the whole stack without root on the host. A breakout then lands as an unprivileged user. Podman was designed for this, and Docker supports it.

**Sandboxed runtimes** add a barrier for untrusted workloads.

| Runtime | Approach |
|---|---|
| gVisor | A user-space kernel that intercepts system calls |
| Kata Containers | A lightweight VM per pod |
| Firecracker | MicroVMs, used by AWS Lambda |

They cost some performance and compatibility, in exchange for not sharing the host kernel directly. For multi-tenant platforms running customers' code, they're now the norm.

**Runtime detection.** Prevention can't catch everything, so watch behaviour. A container running a shell it never needed, or writing to a binary directory, or contacting a new address, is suspicious. [Falco](https://falco.org/) and Tetragon use eBPF for this. Containers are usually predictable, so anomalies stand out more than on a general server.

**Short lives help and hurt.** Ephemeral containers make persistence harder for attackers, and evidence harder for you. So [send logs off the host](/modules/08-08-network-and-cloud-forensics/) as they happen.

?? Why is mounting `docker.sock` into a container dangerous?
+ It gives control of the Docker daemon
- It slows each container's network traffic down
- It fills the host's disk with logs
- It blocks the container from any updates
=> The daemon runs as root, so controlling it means that you can start anything on the host.

## Threat model

| Technique | ATT&CK |
|---|---|
| Escape to host | [T1611](https://attack.mitre.org/techniques/T1611/) |
| Deploying a container | [T1610](https://attack.mitre.org/techniques/T1610/) |
| Container administration commands | [T1609](https://attack.mitre.org/techniques/T1609/) |

Container abuse often begins with an exposed Docker API, or a vulnerable app, then moves to cryptomining or to stealing cloud credentials from the host's metadata.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `docker inspect` | Shows real settings | Reviewing a container |
| Docker Bench for Security | Checks a host against CIS | Host audits |
| Trivy | Scans images and config | CI |
| Falco, Tetragon | Runtime detection | Production |
| gVisor, Kata | Sandboxed runtimes | Untrusted workloads |
| Podman | Rootless containers | Developer machines and hosts |

## Defence

- **Never use `--privileged`** in production.
- **Don't mount the Docker socket** or sensitive host paths.
- **Run as a non-root user,** and drop all capabilities, then add back only what you need.
- **Use `no-new-privileges`, a read-only root filesystem,** and the default seccomp profile.
- **Patch hosts, kernels and runtimes.**
- **Keep the Docker API off the network.**
- **Use sandboxed runtimes** for anything you don't trust.
- **Separate workloads of different trust** onto different hosts.

**Detection.** Alert on privileged container starts, unexpected shells, new processes that aren't in the image, and access to the metadata service.

## Pitfalls

- **"It's in a container, so it's contained."** Only if the settings are right.
- **"The image passed its scan."** Scanners check contents, not how you run it.
- **Using `:latest`.** You can't tell what's running.
- **Trusting debug containers in production.**
- **Adding capabilities until it works.** Find out which one you really need.

?? What does gVisor add?
+ A user-space kernel between containers and host
- A faster image registry for all nodes
- A signed list of trusted base images
- A second copy of every container's data
=> It intercepts system calls itself, so a workload doesn't talk to the host kernel directly.

## Exercise

::: law Lab only
Run this in a disposable VM. Don't test container settings on shared hosts, or on systems you don't own.
:::

1. Run a normal container, and try `mount` and `dmesg` inside it. Then compare with what `capsh --print` shows.
2. Use `docker inspect` to report on a container's capabilities, seccomp and user.
3. Run Docker Bench for Security, and fix three findings.
4. Rewrite a Dockerfile to run as non-root, with a read-only filesystem.
5. Install Falco. Start a shell in a container, and read the alert.
6. Run the same app under gVisor's `runsc`, and compare the system calls that reach the host.

?! A vendor's monitoring agent asks for `--privileged` and the Docker socket. Write the questions you'd ask, and when you'd say no.

## Further reading

- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker).
- [NIST SP 800-190](https://csrc.nist.gov/pubs/sp/800/190/final), on application container security.
- [OWASP Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html).
- [gVisor documentation](https://gvisor.dev/docs/).
- [Docker rootless mode](https://docs.docker.com/engine/security/rootless/).
