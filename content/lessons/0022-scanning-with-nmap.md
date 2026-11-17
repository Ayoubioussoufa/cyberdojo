---
title: Scanning with Nmap
summary: Discover hosts and services the way an attacker does, and read the results like a defender.
month: 3
minutes: 50
builds: an Nmap report of your own lab explaining every open port
source: Nmap Network Scanning, the official book, free online | https://nmap.org/book/
words: port scan, service detection, enumeration
---
Before attacking anything, an attacker asks: what's there? Nmap is the tool that answers, and every defender should run it against their own network first.

@term Nmap = A free tool that discovers hosts and services on a network.
@term port scan = Probing a machine's ports to find which are open.
@term enumeration = Actively collecting details about a target's hosts, services and users.
@term banner = Text that a service sends identifying itself, often including a version.
@term NSE (Nmap Scripting Engine) = Nmap's scripts for extra checks against a service.

::: law
Scanning is the first step of an attack, and scanning systems you don't own can get you into real trouble. Scan your own lab, or the host Nmap itself [provides for testing](https://nmap.org/book/man-target-specification.html), `scanme.nmap.org`, gently. Note that Kali should be on your host-only network here.
:::

## How scanning works

It's the TCP handshake from lesson 18, used as a question.

| You send | Reply | Nmap says |
|---|---|---|
| SYN | SYN-ACK | **open**: a service is listening |
| SYN | RST | **closed**: host up, nothing listening |
| SYN | Nothing, or ICMP unreachable | **filtered**: a firewall is probably in the way |

The default scan as root, `-sS`, is a **SYN scan**: on SYN-ACK, Nmap sends RST instead of finishing the handshake. It's fast. It's also still visible to any decent monitoring.

### With root, and without

A SYN scan builds its packets by hand and never finishes the handshake, and only root may send hand-made packets. Ask for one as an ordinary user and Nmap stops at once:

```
You requested a scan type which requires root privileges.
QUITTING!
```

Run without root and without naming a scan type, Nmap quietly uses a **connect scan**, `-sT`, instead: it asks the operating system to open a normal connection to each port, completing the handshake, then closes it. The states mean the same thing, and `--reason` shows the evidence:

```
PORT   STATE SERVICE REASON
80/tcp open  http    syn-ack
```

The difference matters to a defender: a completed connection reaches the service, so the service's own log may record it, while a SYN scan's half-open probes usually don't get that far.

?? In a SYN scan, what does a closed port send back?
+ RST, which means that nothing's listening there
- SYN-ACK, which means that a service answered
- Nothing, because closed ports stay totally silent
- FIN, which means the service has finished
=> A closed port answers RST. Silence usually means that a firewall dropped the probe.

### Your first scan, line by line

On Kali, Nmap is already installed. On Ubuntu, `sudo apt install nmap` adds it, and `nmap --version` confirms it runs. An Nmap command has three parts: the word `nmap`, the options that say how to scan, and the target that says what to scan. With no options at all, it checks the 1,000 most common TCP ports of the target.

Start your Ubuntu VM, find its address with `ip a`, and from Kali run `sudo nmap` followed by that address. The output looks like this; your version number, address and ports will differ.

```
Starting Nmap 7.95 ( https://nmap.org ) at 2026-11-15 10:02 CET
Nmap scan report for 192.168.56.10
Host is up (0.00042s latency).
Not shown: 997 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
3306/tcp open  mysql
MAC Address: 08:00:27:AB:CD:EF (Oracle VirtualBox virtual NIC)

Nmap done: 1 IP address (1 host up) scanned in 0.31 seconds
```

| Line | What it tells you |
|---|---|
| `Nmap scan report for …` | Which target the lines below describe. A scan of a whole network repeats this block per host |
| `Host is up` | The target answered, and how quickly |
| `Not shown: 997 closed tcp ports (reset)` | 997 of the 1,000 ports answered RST, so Nmap sums them up in one line |
| `PORT STATE SERVICE` | The table itself: port and protocol, its state, and the service that usually lives on that port |
| `MAC Address` | The network card's hardware address. You only see it for hosts on your own local network |
| `Nmap done` | How many addresses were scanned and how long it took |

One thing in that table is a guess. `SERVICE` is looked up from the port number in a list: Nmap hasn't checked that port 80 really runs a web server. Checking is the job of `-sV`, which comes next.

## A method, not a command

```
nmap -sn 192.168.56.0/24                   1. Which hosts are up?
nmap -p- 192.168.56.10                     2. All 65,535 TCP ports on one host
nmap -sV -sC -p 22,80,443 192.168.56.10    3. What exactly is on those ports?
nmap -sU --top-ports 20 192.168.56.10      4. Don't forget UDP (slow)
nmap -oA scan1 192.168.56.10               Save all output formats
```

| Option | Meaning |
|---|---|
| `-sn` | Host discovery only |
| `-p-` | All TCP ports. By default Nmap scans only the 1,000 most common |
| `-sV` | Detect service versions |
| `-sC` | Run default NSE scripts |
| `-sU` | UDP scan |
| `-O` | Guess the operating system |
| `-oA name` | Save results in all formats |

Why four steps and not one big command? Each step is slower and noisier than the one before, so you narrow the target first. Step 1 turns a network of 254 possible addresses into the few that are alive. Step 2 finds every open port on one of them. Step 3 spends its time only on those ports, asking each service what it is. Step 4 repeats the idea for UDP, which is slow because a UDP port that says nothing may be open or may be filtered, and Nmap has to wait to find out. It reports those as `open|filtered`.

Three more options are worth knowing from the start:

| Option | Meaning |
|---|---|
| `--reason` | Adds a column that says why Nmap chose each state, such as `syn-ack` or `reset` |
| `-Pn` | Skips host discovery and scans anyway. Use it when a host blocks ping but you know it's there |
| `-T4` | A faster timing template, fine on your own lab network. The default is `-T3` |

`-oA scan1` writes three files: `scan1.nmap` is what you saw on screen, `scan1.gnmap` has one line per host so that `grep` can search it, and `scan1.xml` is for other tools. Save every scan. A result you can't show again is not evidence.

::: trap Scan all the ports
By default Nmap tests the top 1,000 ports. A service on port 8443 or 31337 may be missed. Always use `-p-` on hosts that matter.
:::

### A lab you can rebuild anywhere

If your VMs aren't ready yet, Docker gives you a target in seconds, on your own machine only. Start a web server published on localhost, scan it, and remove it:

```
docker run -d --rm --name lab-web -p 127.0.0.1:8080:80 nginx:1.27-alpine
nmap -sV -sC -p 8080 127.0.0.1
docker stop lab-web
```

```
PORT     STATE SERVICE VERSION
8080/tcp open  http    nginx 1.27.5
|_http-title: Welcome to nginx!
|_http-server-header: nginx/1.27.5
|_http-open-proxy: Proxy might be redirecting requests
```

The version came from the service itself, and the scripts read the default page. The last line is worth a pause: nginx isn't an open proxy here, the script just saw an answer it couldn't rule out, and says "might". Script output is a lead to check, never a finding on its own.

?? A scan shows port 22 `filtered`. What's the best reading?
+ Something, probably a firewall, is dropping the probes
- SSH is running with its original default password
- The host is definitely turned off right now
- A service is listening and accepted the connection
=> Filtered means Nmap got no useful reply. An open port would answer with SYN-ACK and a closed one with RST.

## Reading the results

```
PORT     STATE  SERVICE VERSION
22/tcp   open   ssh     OpenSSH 9.6p1 Ubuntu
80/tcp   open   http    nginx 1.24.0
3306/tcp open   mysql   MySQL 8.0.36
```

A defender asks three questions about each line:

1. **Should this port be open at all?** A database reachable from the network is a finding.
2. **Who needs to reach it?** Could a firewall limit it?
3. **Is the version current?** Old versions may have known vulnerabilities.

That's your exit-gate deliverable: a report that explains each open port and whether it should exist.

?? Your scan finds MySQL open on a web server, reachable from the staff network. What's the best recommendation?
+ Bind it to localhost, or firewall it very tightly
- Change MySQL to listen on a random high port
- Leave it, since a strong password fixes everything here
- Add a new banner so attackers misread the version
=> Reduce the attack surface. A database should only be reachable by what needs it. Moving the port only hides it from a default scan.

## From a port to a finding

Step 3 of the method replaces the guessed `SERVICE` with what the service says about itself, and `-sC` adds a few safe checks:

```
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 9.6p1 Ubuntu 3ubuntu13 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    nginx 1.24.0 (Ubuntu)
|_http-title: Welcome to nginx!
|_http-server-header: nginx/1.24.0 (Ubuntu)
```

The lines that start with `|_` come from NSE scripts. Here `http-title` fetched the home page and printed its title: "Welcome to nginx!" is the default page, which tells you someone installed a web server and never put a site on it. That's a finding, and you got it without attacking anything.

Write each open port up the same way, so that a reader can act on it:

| Port | What's there | Should it be open? | Action |
|---|---|---|---|
| 22 | OpenSSH 9.6p1 | Yes, for administration | Limit the source to the admin machine |
| 80 | nginx 1.24.0, default page | No, nothing is published | Remove nginx or close the port |
| 3306 | MySQL 8.0.36 | Not from the network | Bind to localhost |

### When the scan surprises you

| You see | Likely reason | Try this |
|---|---|---|
| `requires root privileges. QUITTING!` | You asked for a SYN or UDP scan as an ordinary user | `sudo nmap`, or `-sT` for TCP without root |
| `Host seems down` | Discovery probes were dropped, though the host may be up | `-Pn` to scan anyway |
| Every port `filtered` | A firewall drops everything you send | Check you're scanning the right address, then accept it: that firewall is doing its job |
| `Failed to resolve` | A typo in the name, or DNS can't find it | Check the name, or scan the address |
| Two scans disagree | The service restarted, or the target limits how fast it answers | Scan again more slowly, with `-T3` or less |
| A UDP scan takes forever | Silent UDP ports make Nmap wait | Scan fewer ports, `--top-ports 20` |

?? Nmap prints `80/tcp open http` on a scan with no options. How sure is the word `http`?
+ It's a guess based on the port number
- It's certain, as Nmap fetched a web page
- It's read from the banner the service sent
- It's taken from the host's own process list
=> Without `-sV`, the service name comes from a list of usual ports. Any program can listen on port 80.

?? A host you know is running shows `Host seems down` in your scan. Which option is the right next try?
+ `-Pn`, to skip discovery and scan it anyway
- `-sU`, to change the scan over to UDP
- `-oA`, to save the result into three files
- `-sC`, to run the default scripts on it
=> Host discovery relies on probes that a firewall may drop. `-Pn` tells Nmap to treat the host as up and go straight to the port scan.

::: try Scan, change, scan again
1. Scan your Ubuntu VM with `sudo nmap -p- -oA before` and its address.
2. On the VM, install a web server with `sudo apt install nginx`, then scan again with `-oA after`.
3. Compare the two with `diff before.nmap after.nmap`. Port 80 should be the new line.
4. Run `sudo nmap -sV -sC -p 80` against it and read what the scripts report.
5. Remove the server with `sudo apt remove nginx`, scan a third time, and confirm the port is closed.
:::

## What a defender sees

Run a scan while watching with Wireshark or your IDS. A port scan is a single source touching many ports in a short time, and it's loud. That connects to the next lesson.

@drill ports

?! Scan your Ubuntu VM. Paste the result and, for each port, answer: should it be open, and why?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Nmap reference guide (the man page, online)](https://nmap.org/book/man.html)
- [Nmap book: port scanning techniques](https://nmap.org/book/man-port-scanning-techniques.html)
