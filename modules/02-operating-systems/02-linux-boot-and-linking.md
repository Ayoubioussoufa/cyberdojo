---
title: Linux boot, linking and login
summary: What runs before your shell does. The boot chain, systemd, the dynamic linker, PAM and password storage, and why each is a favourite place to hide.
level: intermediate
side: both
minutes: 50
attack: T1574.006, T1556.003, T1543.002, T1003.008
needs: 02-01-linux-processes-and-proc, 0025-hardening-linux
pair: 02-05-linux-persistence-and-audit, 02-14-virtualisation-and-boot-integrity
source: Linux kernel admin guide, sysctl | https://www.kernel.org/doc/html/latest/admin-guide/sysctl/index.html
words: dynamic linker, LD_PRELOAD, PAM
---
A program rarely runs alone. A bootloader starts the kernel, systemd starts the services, a dynamic linker stitches in libraries, and PAM decides who may log in. An attacker who gets into any of those gains code that runs early, runs often, or sees passwords. Knowing the order of events tells you where to look.

@term dynamic linker = The program, usually `ld.so`, that loads a binary's shared libraries when it starts.
@term LD_PRELOAD = An environment variable that makes the dynamic linker load a chosen library before all others.

## Concept

### Fundamentals: the boot chain

@flow Firmware (UEFI) > Bootloader (GRUB) > Kernel and initramfs > systemd (PID 1) > Services and login

Each stage trusts the one before. If an attacker can edit the GRUB configuration, they control the kernel's command line. Adding `init=/bin/bash` gives a root shell with no password, which is why physical access matters and why a GRUB password and disk encryption exist. See Boot integrity.

**systemd** is PID 1 on most distributions. It reads *units*: services, timers, sockets and more. Files in `/etc/systemd/system/` override those in `/usr/lib/systemd/system/`. A unit named `sshd-keygen-backup.service` won't look out of place in a long list, which is why persistence loves it.

### The dynamic linker

Most Linux programs are dynamically linked: they don't contain `libc`, they ask for it. At startup, the kernel runs `ld.so`, which finds and loads each library, then starts the program. `ldd /bin/ls` lists what would be loaded.

Its search order is the attack surface:

1. `LD_PRELOAD` and `/etc/ld.so.preload`
2. `RPATH` and `RUNPATH` inside the binary, and `LD_LIBRARY_PATH`
3. The cache from `/etc/ld.so.conf`, then default directories

`LD_PRELOAD` is a real feature for debugging: a library loaded first can replace any function. So a preloaded library can wrap `read` or `readdir`, and hide files from every program that uses libc. `/etc/ld.so.preload` applies to **every** dynamically linked program on the system, as a whole-system version of the same idea.

The kernel does protect the obvious case. For SUID programs, it sets *secure-execution mode*, in which the linker ignores `LD_PRELOAD` from an ordinary user. Otherwise, any user could become root trivially. Sudo strips such variables as well, unless `env_keep` restores them, which is a known escalation path.

### Authentication: PAM and shadow

A program such as `sshd` or `sudo` doesn't check passwords itself. It asks **PAM**, which reads `/etc/pam.d/<service>` and runs a stack of modules. Modules return success or failure, and control flags such as `required` and `sufficient` decide how those combine.

Password hashes live in `/etc/shadow`, readable only by root. The format is `$id$salt$hash`, where `$6$` is SHA-512 crypt and `$y$` is yescrypt. `/etc/passwd` is world-readable, and modern systems put an `x` in its password field.

### Advanced: kernel parameters

`sysctl` exposes kernel tunables. A few matter directly to security.

| Setting | Effect |
|---|---|
| `kernel.randomize_va_space=2` | Full ASLR |
| `kernel.kptr_restrict=2` | Hides kernel addresses from users |
| `kernel.dmesg_restrict=1` | Restricts kernel logs |
| `kernel.unprivileged_bpf_disabled=1` | Reserves eBPF for privileged users |
| `fs.protected_symlinks=1` | Blocks a class of `/tmp` link attacks |
| `net.ipv4.conf.all.rp_filter=1` | Rejects spoofed sources |

?? Why can't a normal user use `LD_PRELOAD` to attack a SUID-root program?
+ Secure-execution mode makes the linker skip that unsafe variable
- SUID programs are always statically linked by the compiler
- `LD_PRELOAD` only works for the root user on Linux
- The kernel encrypts the environment of all such programs
=> The kernel flags the process as secure-execution, and `ld.so` then ignores unsafe variables. Sudo's `env_keep` is a separate hole.

## Threat model

| Place | Technique | ATT&CK |
|---|---|---|
| `LD_PRELOAD`, `ld.so.preload` | Hijack execution flow | [T1574.006](https://attack.mitre.org/techniques/T1574/006/) |
| A malicious PAM module | Log or bypass passwords | [T1556.003](https://attack.mitre.org/techniques/T1556/003/) |
| New systemd service | Persistence | [T1543.002](https://attack.mitre.org/techniques/T1543/002/) |
| Reading `/etc/shadow` | Credential access | [T1003.008](https://attack.mitre.org/techniques/T1003/008/) |

A changed PAM stack is especially bad: it can accept a magic password for every account, or write every real password to a file.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `systemctl list-units`, `list-timers` | Lists what's running or scheduled | Hunting persistence |
| `systemd-analyze blame`, `security` | Boot timing, and a sandbox score per service | Reviewing a service's exposure |
| `ldd`, `readelf -d` | Lists libraries and RPATH | Understanding loading |
| `cat /proc/<pid>/maps` | Shows what really got loaded | Spotting an injected library |
| `debsums`, `rpm -Va` | Compares files to package hashes | Finding replaced PAM modules or binaries |
| `sysctl -a` | Lists kernel settings | Auditing hardening |
| Lynis | Audits a host | A quick baseline |

## Defence

- **Protect the early chain.** Set a GRUB password, enable Secure Boot, and encrypt the disk.
- **Monitor these files.** Watch `/etc/ld.so.preload`, `/etc/pam.d/`, `/etc/systemd/system/`, `/lib/security/` and `/etc/shadow` with auditd or file integrity monitoring. `/etc/ld.so.preload` normally doesn't exist, so its creation alone is an alert.
- **Verify packages.** `debsums` or `rpm -Va` shows any PAM module or binary that doesn't match its package.
- **Strip the environment.** Keep sudo's `env_reset` on, and don't add `LD_PRELOAD` to `env_keep`.
- **Sandbox services.** `systemd-analyze security <service>` scores options like `ProtectSystem`, `NoNewPrivileges` and `PrivateTmp`.
- **Apply sysctl settings** from a CIS Benchmark, through configuration management, so that they can't drift.

## Pitfalls

- **"Static binaries are immune."** They ignore `LD_PRELOAD`, so a statically linked `busybox` makes a good forensic tool, but they don't help against kernel-level tricks.
- **"`ldd` is safe on any file."** On some systems it can run the target's code. On an unknown binary, use `readelf -d` or `objdump -p`.
- **"A hidden file can't be found."** A preload rootkit fools libc programs. A static tool, or reading the disk from a live USB, doesn't use the same path.
- **Editing PAM on a remote server with no spare session.** A single typo can lock everyone out. Keep a root session open while you test.

?? `/etc/ld.so.preload` appears on a server that never had one. Why is this urgent?
+ Every dynamically linked program here will now load that library
- The dynamic linker will stop working after the next reboot
- The file means that systemd has now started an update
- It proves a user has mistyped a command as root
=> That file affects every dynamic program on the system, which suits a user-mode rootkit. Legitimate uses are rare.

## Exercise

::: law Lab only
Do this on a throwaway VM with a snapshot taken first. Writing to `/etc/ld.so.preload` or PAM can make a system unbootable.
:::

1. Run `readelf -d /bin/ls | grep NEEDED`, and compare it with `ldd /bin/ls`.
2. Write a small C library that overrides `puts` to print an extra line. Compile with `gcc -shared -fPIC`, and run a test program with `LD_PRELOAD=./lib.so`. Now try it on a SUID binary and explain why nothing changes.
3. Read `/etc/pam.d/sshd` and `common-auth`. Explain each line's module and control flag.
4. Run `systemd-analyze security ssh.service`. Pick three findings and decide whether to fix them.
5. Write auditd rules that watch `/etc/ld.so.preload` and `/etc/pam.d/`. Touch those paths, and find the events with `ausearch -k`.

?! List every point between power-on and a user's shell at which code you didn't intend could run. For each, name one detection or hardening control.

## Further reading

- [ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html), which documents search order and secure-execution mode.
- [pam.d(5)](https://man7.org/linux/man-pages/man5/pam.d.5.html), on control flags.
- [systemd.exec(5)](https://man7.org/linux/man-pages/man5/systemd.exec.5.html), on sandboxing options.
- [Kernel self-protection](https://www.kernel.org/doc/html/latest/security/self-protection.html), in the kernel docs.
- [CIS Benchmarks](https://www.cisecurity.org/cis-benchmarks), for reference settings.
