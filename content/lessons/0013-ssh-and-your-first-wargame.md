---
title: SSH and your first wargame
summary: Log in to remote machines securely, understand key pairs, and start OverTheWire Bandit, a real server built for practice.
month: 1
minutes: 45
builds: connect over SSH with a key, and finish Bandit level 0
source: OverTheWire Bandit | https://overthewire.org/wargames/bandit/
words: SSH, public key, private key
---
Nearly every server in the world is managed remotely over one protocol: **SSH**. Today you'll use it, understand why keys beat passwords, and start the wargame that the roadmap uses as your Month 1 benchmark.

@term SSH (Secure Shell) = A protocol for logging in to a remote machine over an encrypted connection.
@term public key = The half of a key pair you can share freely. It's used to verify.
@term private key = The secret half of a key pair. Whoever holds it can prove they're you.
@term key pair = Two mathematically linked keys used together, one public and one private.
@term wargame = A series of legal hacking challenges where each level gives access to the next.
@term port = A number that identifies a specific service on a machine, such as 22 for SSH.

## What SSH gives you

SSH opens a shell on another machine, over an encrypted connection, so nobody on the network can read what you type. The basic form:

@seq You | Server
You > Server: Hello, on port 22
Server > You: My host key, to prove who I am
You > Server: Your key or password, encrypted
Server > You: You're in: an encrypted shell

```
ssh username@address
ssh -p 2220 username@address     use a non-standard port
```

A **port** is like a door number on a building: the address finds the machine, and the port finds the service. SSH normally uses [port 22](https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml).

::: try In your lab
From Kali, connect to your Ubuntu VM: `ssh yourname@192.168.56.x`. The first time, SSH shows a fingerprint and asks whether you trust this machine. That's how it detects impostors later. Answer `yes`, then log in.
:::

?? In `ssh -p 2220 ana@10.0.0.5`, what does `2220` choose?
+ Which service on that machine you connect to
- How many seconds the connection stays open for
- How many users can log in at once
- Which account you're going to log in as
=> The address finds the machine, and the port finds the service. `ana` is the account.

## Passwords versus keys

A password travels to the server and can be guessed. You saw the attacks in `auth.log`. Keys work differently, using a **key pair**:

- The **private key** stays on your machine, and is never shared.
- The **public key** goes on the server.

To log in, the server sends a challenge that only the matching private key can answer. **The private key never leaves your machine.** There's nothing to guess and nothing to steal in transit.

Think of a padlock: you hand out as many open padlocks (public keys) as you like, but only you hold the key that opens them.

::: try Set up key login, on your own VMs only
```
ssh-keygen -t ed25519            # on Kali: accept the default path, set a passphrase
ssh-copy-id yourname@192.168.56.x
ssh yourname@192.168.56.x        # it now uses the key
ls -l ~/.ssh                     # private key: 600. public key ends in .pub
```
:::

Permissions matter here. If your private key is readable by others, [SSH refuses to use it](https://man7.org/linux/man-pages/man1/ssh.1.html). You met mode 600 in lesson 7, and this is why.

?? You want to log in to a new server with keys. What goes on the server?
+ Your public key, in the authorized keys file
- Your private key, in your home directory folder
- Both keys, so that they can be compared
- A copy of your passphrase, in a config
=> The private key never leaves your machine. The server only needs the public half, stored in `~/.ssh/authorized_keys`.

## Bandit: a real machine, legally

[OverTheWire Bandit](https://overthewire.org/wargames/bandit/) is a free wargame for learning Linux. Each level is a real account on a real server, and the password for the next level is hidden somewhere. It's the roadmap's benchmark: **level 20 or higher by the end of Month 1**, with at least 70% solved without walkthroughs.

Level 0 asks you to connect like this:

```
ssh -p 2220 bandit0@bandit.labs.overthewire.org
```

The password is on the [Level 0 page](https://overthewire.org/wargames/bandit/bandit0.html). We don't print it or any later ones here, because [OverTheWire's rules](https://overthewire.org/rules/) ask people not to publish credentials.

::: tip If SSH says "broken pipe" from a VM
OverTheWire [notes](https://overthewire.org/wargames/bandit/) that this can happen with a NAT adapter. Adding `IPQoS throughput` to `/etc/ssh/ssh_config` should fix it.
:::

### How to work through it

- **Give each level 20 minutes of real effort** before any hint.
- **Read the level page,** including the commands it suggests, and use `man` on each.
- **Write one lesson per level in your notes,** in your own words, without spoilers. That becomes write-up #1: "What Bandit taught me about Linux".
- **Don't paste levels into an AI to solve them.** The roadmap's rule: use AI as a quiz master, never as a Bandit solver. The struggle is the content.

Everything you practised in the browser applies: `ls -a`, `cat`, quoting odd file names, `find` by size, `grep`, `sort | uniq`, `base64 -d`, SSH keys.

?? You're stuck on a Bandit level after 25 minutes. What fits the roadmap's rules?
+ Re-read the level's man pages, then take a hint
- Paste the level into an AI for the answer
- Copy a walkthrough, then move on to the next
- Skip ahead, because the later levels get much easier
=> Effort first, then a small hint. Copying teaches nothing, and your exit gate asks for 70% solved without walkthroughs.

?! Explain to a non-technical friend why logging in with an SSH key is safer than a password.

## What you can do now

You can reach a real remote machine securely. One piece remains: recording your work so that it counts.
