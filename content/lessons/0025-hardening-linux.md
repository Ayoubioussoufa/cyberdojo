---
title: Hardening a Linux server
summary: Services, logs, scheduled jobs and SSH settings, then measurably reducing your attack surface against a benchmark.
month: 3
minutes: 45
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

## Benchmarks: not your opinion

A **CIS Benchmark** is a consensus list of hundreds of settings for one product. You don't need them all. The roadmap asks you to implement a subset and to record why. Download the free PDF for Ubuntu from [CIS](https://www.cisecurity.org/cis-benchmarks).

```
sudo lynis audit system       a scored audit, with suggestions
```

?? What's a CIS Benchmark?
+ An agreed list of secure settings
- A speed test for your server
- A law that every company follows
- A scanner that fixes everything automatically
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

?! Name three things you'd remove or restrict on a fresh server, and the attack each one prevents.
