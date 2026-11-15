---
title: Hardening a Linux server
summary: Services, logs, scheduled jobs and SSH settings, then measurably reducing your attack surface against a benchmark.
month: 3
minutes: 60
builds: a hardened server with before-and-after evidence, completing P01
source: CIS Benchmarks | https://www.cisecurity.org/cis-benchmarks
words: hardening, systemd, benchmark
---
A default install is built to be convenient. **Hardening** means removing what you don't need and tightening what's left, and then proving it.

@term hardening = Reducing a system's attack surface by removing and tightening things.
@term systemd = The program that starts and manages services on most Linux systems.
@term journald = The systemd service that collects logs, read with journalctl.
@term cron = The Linux scheduler for running commands at set times.
@term CIS Benchmark = A consensus hardening guide for a specific product, published by the Center for Internet Security.
@term ufw = Uncomplicated Firewall, a simple front end for Linux host firewalling.
@term nftables = The current Linux kernel firewall framework.
@term Lynis = An open-source tool that audits Linux security settings.

## Know what's running

```
systemctl list-units --type=service --state=running     running services
systemctl status ssh                                    one service's status
sudo systemctl disable --now apache2                    stop it and keep it off
```

`disable --now` stops the service and prevents it from starting at boot. Each service you remove is a piece of attack surface gone.

A **service** is a program that runs in the background with nobody logged in to start it: the SSH server, a web server, the scheduler. `systemd` starts them at boot and restarts them if they crash. Ask for one service's status and read the three lines that matter:

```
$ systemctl status ssh
● ssh.service - OpenBSD Secure Shell server
     Loaded: loaded (/usr/lib/systemd/system/ssh.service; enabled; preset: enabled)
     Active: active (running) since Sun 2026-11-15 09:41:07 CET; 21min ago
   Main PID: 811 (sshd)
```

| Line | What it tells you |
|---|---|
| `Loaded: … enabled` | **Enabled** means it starts at every boot. `disabled` means it won't |
| `Active: active (running)` | It's running right now. `inactive (dead)` means stopped |
| `Main PID: 811` | The process number, which you can look up with `ps -p 811` |

Enabled and running are two separate facts. A service can be running now but disabled at boot, or enabled but stopped, and `disable --now` deals with both at once.

Services matter most when they listen on the network. This command joins the two views, by showing each listening port with the program behind it:

```
$ sudo ss -tlnp
State   Local Address:Port   Process
LISTEN  0.0.0.0:22           users:(("sshd",pid=811,fd=3))
LISTEN  127.0.0.1:3306       users:(("mysqld",pid=1042,fd=22))
LISTEN  0.0.0.0:80           users:(("apache2",pid=977,fd=4))
```

`0.0.0.0` means "reachable on every network card", and `127.0.0.1` means "only from this machine". Here the database is already limited to the machine itself, and the web server is open to everyone. If nobody can say why port 80 is open, that's the service to disable.

?? What does `systemctl disable --now apache2` do?
+ Stops it now, and at boot
- Deletes its files from the disk
- Restarts it with a safer configuration
- Hides it from the process list
=> It stops the service, and keeps it off after a reboot.

## Know where the evidence is

```
journalctl -u ssh --since "1 hour ago"     logs for one service
journalctl -p err -b                       errors since boot
tail -f /var/log/auth.log                  logins, live
```

Logins and `sudo` use go to `/var/log/auth.log` on Ubuntu. Attackers try to clear logs, so serious environments ship them to another machine straight away. That idea returns in Month 9.

One line of `auth.log` holds five facts, always in the same order:

```
Nov 15 10:14:02 ubuntu-lab sshd[811]: Failed password for root from 203.0.113.7 port 44122 ssh2
```

When it happened, on which machine, which program and process wrote it, what happened and to which account, and where the attempt came from. `journalctl -f` shows the same stream live from the journal, and adding `-u ssh` narrows it to one service.

?? Why do serious teams send logs to another machine?
+ Attackers try to clear local logs
- Logs run faster on other machines
- Linux can't store logs on disk
- It stops attackers from logging in
=> An attacker with root can edit local logs. Copies elsewhere survive.

## Scheduled jobs

`cron` runs commands on a timetable: `crontab -l` shows your jobs, and `/etc/cron.d/` and `/etc/crontab` hold system ones.

```
# min hour day month weekday  command
  0   3    *   *     *        /usr/local/bin/backup.sh
```

The five fields are minute, hour, day of the month, month and day of the week, and `*` means "every". Read the line above as: at minute 0 of hour 3, on every day, run the backup. Two more to practise on:

| Schedule | Runs |
|---|---|
| `*/5 * * * *` | Every five minutes |
| `30 2 * * 1` | At 02:30 every Monday |

Jobs hide in several places, so check all of them: `crontab -l` for your own, `sudo crontab -l -u root` for root's, the files in `/etc/cron.d/`, and `systemctl list-timers`, because systemd has its own scheduler that does the same job.

::: why Cron is a favourite for persistence
A line in a cron file brings malware back after every reboot, and if a root cron job runs a script that anyone can edit, that's privilege escalation. Always check cron when investigating, and always look at who can write to the scripts it runs.
:::

?? A root cron job runs `/opt/backup.sh`, which is mode 777. Why is that serious?
+ Anyone can edit code run by root
- Cron can't run files with that mode
- Backups need to be stored in `/var`
- The script reveals root's password when read
=> World-writable means any user can add a command, and root will run it at the next scheduled time.

## Hardening SSH

SSH faces the internet, so it gets attacked constantly, as you saw in `auth.log`. Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
```

`PasswordAuthentication no` only makes sense once a key works, so set the key up first. A key pair is two files: a private key that never leaves your machine, and a public key that you can give to any server. The server keeps the public key and uses it to check that you hold the private one, and no password crosses the network. Lesson 39 explains the mathematics.

```
ssh-keygen -t ed25519                 on your own machine: create the pair, and give it a passphrase
ssh-copy-id ana@192.168.56.10         copy the public key to the server (asks for the password one last time)
ssh ana@192.168.56.10                 log in again: no account password is asked
```

The private key is `~/.ssh/id_ed25519` and the public one is `~/.ssh/id_ed25519.pub`. On the server, the public key lands in `~/.ssh/authorized_keys`, one key per line. Only when the third command works do you turn passwords off.

Then validate before restarting, so that you don't lock yourself out:

```
sudo sshd -t && sudo systemctl restart ssh
```

::: trap Don't saw off the branch you're sitting on
Keep your current session open while you test a new login from a second terminal. If it fails, you can still fix it. On a VM, a snapshot helps too.
:::

On Ubuntu, files in `/etc/ssh/sshd_config.d/` can override the main file, so verify the effective settings with `sudo sshd -T | grep -i permitrootlogin`.

?? Why keep your session open while you test a new login?
+ You can still fix a mistake
- SSH needs two sessions to start
- It makes the new settings apply
- Closing it deletes the configuration file
=> If the new settings lock you out, the open session is your way back in.

## The host firewall

```
sudo ufw default deny incoming
sudo ufw allow from 192.168.56.0/24 to any port 22 proto tcp
sudo ufw enable
sudo ufw status verbose
```

Allow SSH **before** enabling it. `ufw` is a friendly layer over the kernel's [nftables](https://wiki.nftables.org/).

?? Why allow SSH before running `ufw enable`?
+ Otherwise you'd lock yourself out
- Otherwise ufw refuses to start
- Otherwise SSH loses its keys
- Otherwise all logs get deleted
=> Default deny applies at once, including to your own connection.

## Updates

Most break-ins through software use a flaw that already has a fix. Installing the fix is the cheapest hardening there is.

```
sudo apt update                                     refresh the list of available versions
apt list --upgradable                               see what would change
sudo apt upgrade                                    install the new versions
sudo apt install unattended-upgrades                install the automatic updater
sudo dpkg-reconfigure -plow unattended-upgrades     switch it on
```

`update` only downloads the list, and nothing is installed until `upgrade`. With `unattended-upgrades` on, security fixes install themselves daily. Afterwards, `/var/log/unattended-upgrades/` shows what it did.

?? `sudo apt update` finishes without errors. What has changed on the server?
+ Only the list of versions is refreshed
- Every package was upgraded to its latest
- The security fixes alone were all installed
- The kernel was replaced and then restarted
=> `update` fetches the catalogue. `upgrade` is the command that installs.

## Benchmarks: not your opinion

A **CIS Benchmark** is a consensus list of hundreds of settings for one product. You don't need them all. The roadmap asks you to implement a subset and to record why. Download the free PDF for Ubuntu from [CIS](https://www.cisecurity.org/cis-benchmarks).

```
sudo lynis audit system       a scored audit, with suggestions
```

Lynis ends with a score and a list. Each item has a test ID that you can look up:

```
  * Consider hardening SSH configuration [SSH-7408]
      - Details  : MaxAuthTries (set 6 to 3)

  Hardening index : 63 [############        ]
```

`sudo lynis show details SSH-7408` explains one test. Don't chase the number for its own sake: take each suggestion, decide to fix it or to accept it, and write down which and why. A score of 63 with reasons is worth more than a score of 80 that you can't explain.

?? What's a CIS Benchmark?
+ An expert list of secure product settings
- A speed test for your own server
- A law that every company must follow
- A scanner that fixes everything by itself
=> It's expert consensus for one product, and you choose a sensible subset.

## Finish P01

::: try Exit gate
1. Run `audit.sh` on the fresh server, and save the output as `before.txt`.
2. Apply: key-only SSH with no root login, the host firewall, unneeded services removed, updates on, a CIS subset.
3. Run it again and save `after.txt`.
4. Verify from another VM: password login must fail, root login must fail.
5. Rescan with Nmap and explain every open port.
6. Publish [P01](/projects/P01/): diagram, IP plan, firewall rules with reasons, audit script, before/after.
:::

Your pitch writes itself: "Hardening cut my own findings from 14 to 3, and I can show why the last three are accepted risks."

?? Which is the strongest proof that you've hardened SSH?
+ A failed login attempt from another machine
- The edited config file in your notes
- A screenshot showing the service is running
- The name of the benchmark you followed
=> Verified, not assumed. A config file might be overridden, so test the behaviour from outside.

## Check your reading

Before you start the exit gate, read three pieces of evidence the way you will during it.

```
LISTEN  0.0.0.0:5432    users:(("postgres",pid=1203,fd=6))
```

?? That line is from `sudo ss -tlnp` on a web server whose site uses a database on the same machine. What's the finding?
+ The database listens on every network card
- The database is stopped and needs restarting
- The database only accepts connections from localhost
- The database runs as the root user
=> `0.0.0.0` means every interface. The site is on the same machine, so the database should listen on `127.0.0.1` only.

```
*/10 * * * * root /tmp/.cache/update.sh
```

?? You find that line in `/etc/cron.d/` during an investigation. What makes it suspicious?
+ Root runs a hidden script from `/tmp`
- The job runs once every ten minutes
- The schedule has five fields, not six
- Cron files can never name a user
=> `/tmp` is writable by everyone and the folder name starts with a dot to stay out of sight. A root job pointing there is a classic way for malware to come back.

?? You set `PasswordAuthentication no`, ran `sshd -t` and restarted SSH. `sshd -T` still reports `passwordauthentication yes`. What's the likely cause?
+ A file in `sshd_config.d` overrides the setting
- The `sshd -t` test has silently failed
- The firewall is blocking the new setting
- The setting only applies after a reboot
=> On Ubuntu, files in `/etc/ssh/sshd_config.d/` are read first and the first value wins. `sshd -T` shows the effective result, which is why you check it and not the file.

?! Name three things you'd remove or restrict on a fresh server, and the attack each one prevents.
