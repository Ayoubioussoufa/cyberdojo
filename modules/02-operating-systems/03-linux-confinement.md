---
title: Linux confinement
summary: Beyond rwx. ACLs, capabilities, SELinux, AppArmor, seccomp, namespaces and cgroups. These are the building blocks of every container, and of every serious hardening guide.
level: intermediate
side: defence
minutes: 60
attack: T1548, T1611
needs: 0007-users-and-permissions, 0008-suid-sticky-umask, 02-01-linux-processes-and-proc
pair: 02-04-linux-privilege-escalation, 11-01-formal-access-models, 10-05-container-escape-and-runtime
source: capabilities(7), Linux manual | https://man7.org/linux/man-pages/man7/capabilities.7.html
words: capability, seccomp, namespace
---
Classic Unix permissions have two kinds of user: root, who can do anything, and everyone else. That's too blunt. If a web server gets compromised, it should be able to read its own files and nothing more. Over the last 25 years, Linux gained a set of finer tools. Together, they're what makes least privilege real, and they're exactly what a container is made of.

@term Linux capability = One slice of root's power, such as binding low ports, that can be granted separately.
@term mandatory access control = A policy enforced by the system that even a resource's owner can't override.
@term seccomp = A kernel feature that filters which system calls a process may make.
@term Linux namespace = A kernel feature that gives a process its own view of a resource, such as process IDs or the network.
@term cgroup = A kernel feature that limits and accounts for the resources used by a group of processes.

## Concept

### Fundamentals: discretionary access

**POSIX ACLs** extend the owner/group/other model to named users and groups. `getfacl` and `setfacl` manage them, and a `+` at the end of `ls -l` permissions shows one is present. They're still *discretionary*: a file's owner decides.

### Capabilities: splitting root

Since kernel 2.2, root's power has been divided into about 40 **capabilities**. Binding port 80 needs `CAP_NET_BIND_SERVICE`, not full root.

```
setcap cap_net_bind_service=+ep ./server
getcap -r / 2>/dev/null
```

Some capabilities are nearly equal to root, and these are what an auditor looks for.

| Capability | Why it's dangerous |
|---|---|
| `CAP_SYS_ADMIN` | Huge catch-all: mounts, namespaces, and more |
| `CAP_SYS_PTRACE` | Can inject into other processes |
| `CAP_DAC_OVERRIDE` | Bypasses file permission checks |
| `CAP_SETUID` | Can become any user |
| `CAP_SYS_MODULE` | Can load kernel modules |

### Mandatory access control

**SELinux** labels every process and object, and a central policy says which label may do what. A confined web server labelled `httpd_t` can't read a file labelled `shadow_t`, even running as root. **AppArmor** does a similar job with per-program path-based profiles, and it's simpler to write. Red Hat family systems default to SELinux, and Debian and Ubuntu to AppArmor. Both have a learning mode: *permissive* and *complain*.

### seccomp

A process can install a filter on its own system calls, written as a small BPF program. Violations can return an error or kill the process. The kernel API has over 300 calls, and most programs use a fraction of them, so this cuts kernel attack surface directly. Docker applies a default profile that blocks dozens of risky calls. Set `no_new_privs` first, so that a filtered process can't regain power by running a SUID program.

### Advanced: namespaces and cgroups make a container

A **namespace** gives a process a private view.

| Namespace | Isolates |
|---|---|
| `pid` | Process IDs: the first process is PID 1 inside |
| `net` | Interfaces, routes, ports |
| `mnt` | Mount points |
| `uts` | Hostname |
| `ipc` | Shared memory, semaphores |
| `user` | User IDs: root inside can map to nobody outside |
| `cgroup`, `time` | Views of cgroups and clocks |

**cgroups** cap how much CPU, memory and PIDs a group can use, which stops a fork bomb from taking down the host.

There's no such thing as a "container" in the kernel. A container is a process with namespaces, cgroups, dropped capabilities and a seccomp filter, on a shared kernel. That shared kernel is the difference from a VM, and it's why escapes are about kernel bugs and bad settings.

**User namespaces** are powerful and double-edged. They let unprivileged users act as root inside the namespace, which is the basis of rootless containers. They also open kernel code to ordinary users, and some distributions restrict them for that reason. Ubuntu added AppArmor restrictions on unprivileged user namespaces.

?? A web server runs as root but is confined by SELinux. What stops it reading `/etc/shadow`?
+ The policy forbids its label from reading that label
- Root accounts can't read files that are in `/etc`
- Permissions on `/etc/shadow` always exclude the root user entirely
- The kernel hides the file from every network service
=> Mandatory access control sits above ordinary permissions. Being root doesn't help if the label isn't allowed.

## Threat model

Confinement doesn't prevent the first compromise. It decides how far that compromise goes, and it turns a code execution bug into a contained event. Attackers respond by abusing what's over-granted ([T1548](https://attack.mitre.org/techniques/T1548/)), and by escaping ([T1611](https://attack.mitre.org/techniques/T1611/)). A SUID-like file capability on a Python interpreter, for instance, can give an easy route to root. See [Linux privilege escalation](/modules/02-04-linux-privilege-escalation/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `getcap -r /` | Finds file capabilities | Auditing a host |
| `capsh --print` | Shows current capabilities | Checking a container |
| `getenforce`, `sestatus`, `ausearch -m avc` | SELinux state and denials | Debugging a policy |
| `aa-status`, `aa-logprof` | AppArmor state and tuning | Building a profile |
| `unshare`, `nsenter`, `lsns` | Create, enter and list namespaces | Learning, or inspecting containers |
| `systemd-run -p ...` | Runs a process with limits | Trying sandbox options |

## Defence

- **Start from systemd sandboxing.** It exposes most of this as simple options: `CapabilityBoundingSet=`, `SystemCallFilter=`, `NoNewPrivileges=yes`, `ProtectSystem=strict`, `PrivateTmp=yes`.
- **Leave SELinux or AppArmor on.** Fix policies, rather than running `setenforce 0`. Move new profiles from permissive to enforcing with evidence.
- **Audit capabilities regularly.** Any file capability needs a reason.
- **Set limits.** Use cgroup limits on memory and PIDs for every service and container.
- **Apply `no_new_privs`** wherever a service doesn't need privilege changes.
- **Watch for denials.** AVC messages are a detection source: a web server being denied `/etc/shadow` is often the first sign of an intrusion.

## Pitfalls

- **"SELinux broke it, so disable it."** That's the most common mistake. `audit2why` explains the denial.
- **"Containers are VMs."** They share the host kernel, so a kernel exploit crosses that boundary.
- **"A capability is small, so it's safe."** Several are equivalent to root.
- **"Root in a container is harmless."** Without a user namespace, root inside is UID 0 on the host, restrained only by the other layers.
- **Assuming seccomp filters arguments fully.** It can't follow pointers, so it can't safely inspect path strings.

?? What does a user namespace change about root inside a container?
+ Container root can map to an unprivileged host user
- Container root gets the full powers of root outside
- Container root may no longer use any system calls
- Container root loses access to the container's own files
=> The mapping means that UID 0 inside isn't UID 0 outside, so a breakout lands as an unprivileged user.

## Exercise

::: law Lab only
Run this on your own Linux VM. Take a snapshot before changing SELinux, AppArmor or systemd settings.
:::

1. Copy `python3` to `/tmp/py`, then run `setcap cap_net_bind_service=+ep /tmp/py`. Bind port 80 as a normal user. Then remove the capability with `setcap -r`, and see it fail.
2. Run `getcap -r / 2>/dev/null`, and justify each result.
3. Build a container by hand: `sudo unshare --pid --fork --mount-proc --net --uts bash`. Run `ps aux` and `ip a`, and set a hostname. What's different, and what's not?
4. Write a small service, and raise its `systemd-analyze security` score by adding sandbox options. Confirm that it still works.
5. Load an AppArmor profile in complain mode for a small program, exercise it, then enforce with `aa-logprof`.

?! A service needs to bind port 443 and read one directory. Design its confinement, using at least four of the mechanisms here, and say what each one stops.

## Further reading

- [capabilities(7)](https://man7.org/linux/man-pages/man7/capabilities.7.html), the reference for every capability.
- [namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html) and [cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html).
- [seccomp in the kernel docs](https://www.kernel.org/doc/html/latest/userspace-api/seccomp_filter.html).
- [The SELinux Notebook](https://github.com/SELinuxProject/selinux-notebook), a free and thorough reference.
- [AppArmor documentation](https://apparmor.net/), with profile language reference.
