---
title: ssh
summary: Logs in to and runs commands on remote machines over an encrypted channel.
side: both
use: open
docs: https://man.openbsd.org/ssh
aka: OpenSSH, sshd
alt: fail2ban
---
## What it's for
SSH is how administrators reach Linux servers and network devices: an encrypted login, remote commands, file copies with `scp` and `sftp`, and port forwarding. OpenSSH provides both the client, `ssh`, and the server, `sshd`, and ships with Linux, macOS and Windows.

## How it works
Client and server first agree session keys with a Diffie-Hellman exchange, and the server proves its identity with its host key. The client remembers that key in `~/.ssh/known_hosts` and warns loudly if it ever changes. Then the user authenticates, ideally with a key pair: the private key stays on your computer, the public key goes in the server's `~/.ssh/authorized_keys`, and the server checks a signature, so no secret crosses the network. The [SSH internals](/modules/01-09-ssh-internals-and-forwarding/) module covers forwarding and the protocol in depth.

## Try it
```
ssh-keygen -t ed25519
ssh-copy-id user@server.lab
ssh user@server.lab
ssh -v user@server.lab
ssh-keygen -lf /etc/ssh/ssh_host_ed25519_key.pub
```

`-v` shows each step of the handshake, which is how you debug a refused login. The last line, run on the server, prints its host key fingerprint: compare it with the one your client showed on first connection.

## What defenders see
On the server, every login lands in the auth log (`journalctl -u ssh`, or `-u sshd` on Red Hat systems), with the user, source address and method. Many failures from one address is password guessing, which [fail2ban](/tools/fail2ban/) can block. Hardening is short: `PasswordAuthentication no`, `PermitRootLogin no`, keys only. A new line in someone's `authorized_keys` that nobody added is a classic way to keep access, so watch those files.

?! Your client warns that the server's host key has changed. Give one harmless and one dangerous explanation, and say how you'd tell them apart.
