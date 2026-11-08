---
title: SSH internals and forwarding
summary: How SSH builds a secure channel, why trust starts with a question you probably click through, and how its forwarding turns one login into a private network.
level: intermediate
side: both
minutes: 50
attack: T1021.004, T1572, T1563.001, T1098.004, T1552.004
needs: 0013-ssh-and-your-first-wargame, 0039-public-keys-and-tls
pair: 01-10-proxies-pivoting-and-tunnels, 02-05-linux-persistence-and-audit
source: RFC 4251, The Secure Shell Protocol Architecture | https://www.rfc-editor.org/rfc/rfc4251
words: host key, agent forwarding, dynamic forwarding
---
SSH is the most trusted protocol in operations, and that's exactly why it deserves scrutiny. Few people know that it's three protocols stacked together, or that a single agent setting can hand your identity to anyone with root on a jump host. Understanding it makes you a better administrator, and a much better investigator.

@term host key = The long-term key that identifies an SSH server to its clients.
@term TOFU (trust on first use) = Accepting a key the first time you see it, then checking that it never changes.
@term agent forwarding = Letting a remote host use your local SSH agent to sign logins, without the key leaving your machine.
@term SSH certificate = A short-lived key signed by an SSH certificate authority, which avoids distributing individual keys.

## Concept

### Fundamentals: three layers

SSH-2 has three layers, each in its own RFC.

| Layer | RFC | Job |
|---|---|---|
| Transport | [4253](https://www.rfc-editor.org/rfc/rfc4253) | Key exchange, server authentication, encryption, integrity |
| User authentication | [4252](https://www.rfc-editor.org/rfc/rfc4252) | Proves who the client is |
| Connection | [4254](https://www.rfc-editor.org/rfc/rfc4254) | Multiplexes channels: shells, forwards, file transfers |

The transport layer runs a Diffie-Hellman exchange, then the server signs the result with its **host key**. So a passive listener learns nothing, and an active attacker can't complete the handshake without that key.

But how does the client know that the key is right? It usually doesn't. That first prompt, "The authenticity of host can't be established", is **trust on first use**. The answer lands in `known_hosts`, and from then on any change triggers a loud warning. Clicking "yes" to a changed key discards the whole protection.

### Keys and certificates

Public-key login uses the private key to sign a session identifier, so nothing secret crosses the wire. Compromise of a server doesn't reveal your key. Scale is what hurts: `authorized_keys` files spread everywhere and never expire.

**SSH certificates** answer that. A CA signs a key with an expiry and a list of allowed principals. Servers trust the CA, so access expires by itself, which is a great fit with just-in-time access.

### Agent forwarding

Your private key stays on your laptop, inside `ssh-agent`. With `-A`, the remote host gets a socket that forwards signing requests back to your agent. The key doesn't move, which sounds safe. However, **anyone with root on that remote host can use the socket while you're connected**, and log in as you to anything your key can reach.

**ProxyJump** (`ssh -J bastion target`) is the better way. Your client talks to the target through the bastion, end to end, so the bastion never gets access to your agent.

### Forwarding

The connection layer carries arbitrary channels, so SSH can move other traffic.

| Option | Direction | Meaning |
|---|---|---|
| `-L 8080:db:5432` | Local | A local port reaches `db:5432` through the server |
| `-R 9000:localhost:80` | Remote | A port on the server reaches back to your machine |
| `-D 1080` | Dynamic | A local SOCKS proxy that sends anything through the server |

@flow Your app > Local port > Encrypted SSH channel > Server > Internal service

`-L` lets you reach a database that only the server can reach. `-R` publishes something from behind a firewall, because the connection was outbound. `-D` gives you a whole network. These are normal admin tools, and they're also a [pivot](/modules/01-10-proxies-pivoting-and-tunnels/).

### Advanced: recent lessons

SSH is well made, and it still has real failures. [Terrapin](https://terrapin-attack.com/) (CVE-2023-48795) showed that an on-path attacker could remove messages at the start of an encrypted channel with certain ciphers, downgrading security features. Strict key exchange fixed it. [regreSSHion](https://www.qualys.com/2024/07/01/cve-2024-6387/regresshion.txt) (CVE-2024-6387) was a signal-handler race in OpenSSH, reintroducing an old bug. The [xz backdoor](https://www.openwall.com/lists/oss-security/2024/03/29/4) (CVE-2024-3094) targeted sshd through a compression library it didn't even depend on directly, which is a supply chain story.

?? Why is `ssh -J bastion target` safer than `ssh -A bastion`, then connecting on?
+ The bastion never gets a path to your agent
- It uses a stronger cipher than ordinary SSH connections
- It copies your private key to the bastion encrypted
- It removes any need for a target host key
=> With ProxyJump, the bastion only relays encrypted bytes. With agent forwarding, root on the bastion can use your agent while you're connected.

## Threat model

| Technique | ATT&CK |
|---|---|
| SSH as lateral movement | [T1021.004](https://attack.mitre.org/techniques/T1021/004/) |
| Hijacking an agent or session | [T1563.001](https://attack.mitre.org/techniques/T1563/001/) |
| Adding a key for persistence | [T1098.004](https://attack.mitre.org/techniques/T1098/004/) |
| Stealing private keys | [T1552.004](https://attack.mitre.org/techniques/T1552/004/) |
| Tunnelling through SSH | [T1572](https://attack.mitre.org/techniques/T1572/) |

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `ssh -v` | Shows the handshake and authentication | Debugging, or learning what happens |
| `ssh-keyscan` | Fetches host keys | Building a known-good inventory |
| `ssh-keygen -s`, `-L` | Signs and reads certificates | Running an SSH CA |
| `ssh-audit` | Grades server and client configuration | Finding weak algorithms |
| Zeek `ssh.log` | Records SSH sessions | Spotting new clients or brute force |

## Defence

```
PermitRootLogin no
PasswordAuthentication no
AllowTcpForwarding no        # or restrict with PermitOpen
AllowAgentForwarding no
X11Forwarding no
PermitTunnel no
```

Apply exceptions with `Match` blocks for the accounts that need them. Publish host keys through configuration management, or SSHFP records with DNSSEC, so that first use doesn't have to be blind. Prefer short-lived certificates over permanent keys.

**Detection.** `/var/log/auth.log` or the journal records logins with the key fingerprint. Watch for changes to any `authorized_keys`, using auditd or file integrity monitoring. New listening ports on a server may be a `-R` forward. At the network level, a long SSH session with steady traffic to an unusual destination is suspicious, and a lot of inbound SSH from a workstation doesn't fit normal behaviour.

## Pitfalls

- **"SSH is encrypted, so it's safe."** It's a secure pipe to whoever holds the credentials.
- **Ignoring the host key warning.** That message exists to catch on-path attacks. Investigate, don't delete the line.
- **Disabling forwarding and calling it solved.** A user with a shell can usually run their own relay. It's friction, not a boundary.
- **Forgetting old keys.** Offboarding must remove keys, and that's a strong argument for certificates.
- **Putting `ForwardAgent yes` under `Host *`.** That offers your agent to every server you connect to.

?? You see the host key warning after a server was rebuilt. What's the right response?
+ Confirm the new fingerprint through a separate trusted channel
- Delete the line in `known_hosts` and connect straight away
- Disable strict host key checking for this one server
- Connect anyway, because the warning only affects old ciphers
=> The warning may be harmless, but you can't tell from inside the connection. Check the fingerprint out of band before you trust it.

## Exercise

::: law Lab only
Use your own VMs for all of this. Tunnelling out of a network you don't control may break its rules or the law.
:::

Build three VMs: `client`, `bastion`, and `internal`, with `internal` reachable only from `bastion`.

1. Log in with `ssh -v` and find the key exchange, host key, and authentication lines.
2. Use `ssh -L` to reach a web server on `internal` from `client`. Use `ss -ltnp` to see the listener on `client`.
3. Use `ssh -J` to log in to `internal`. Then try `-A`, and as root on `bastion` find the agent socket under `/tmp`. Explain what root could do there, without doing it.
4. Set up a small SSH CA with `ssh-keygen -s`. Issue a one-hour certificate and log in with it. Read it with `ssh-keygen -L`.
5. On `bastion`, turn off forwarding in `sshd_config`, then show that step 2 now fails. Write down what the logs show.

?! A forensic timeline shows an admin's account logging in to five servers within a minute, from a bastion, with no matching login to the bastion. What explanations can you offer, and how would you tell them apart?

## Further reading

- [RFC 4251](https://www.rfc-editor.org/rfc/rfc4251), the architecture overview of SSH.
- [OpenSSH manual pages](https://www.openssh.com/manual.html), especially `ssh_config` and `sshd_config`.
- [Terrapin attack paper and site](https://terrapin-attack.com/), for a modern protocol flaw.
- [ssh-audit](https://github.com/jtesta/ssh-audit), for testing your own servers.
- [Mozilla's OpenSSH guidelines](https://infosec.mozilla.org/guidelines/openssh), for hardened settings.
