---
title: Linux commands
summary: The commands from Months 1 to 3, grouped by what you're trying to do.
source: Linux man pages | https://man7.org/linux/man-pages/
---
## Move around

| Command | Does |
|---|---|
| `pwd` | Show where you are |
| `ls -la` | List everything, with details |
| `cd /path` | Go there |
| `cd ..` | Up one folder |
| `cd -` | Back to the last folder |

## Read files

| Command | Does |
|---|---|
| `cat f` | Print a file |
| `less f` | Page through it, `q` quits |
| `head -n 20 f` | First 20 lines |
| `tail -n 20 f` | Last 20 lines |
| `tail -f f` | Follow new lines |
| `wc -l f` | Count lines |
| `file f` | What kind of file? |
| `strings f` | Readable text in a binary |

## Search

| Command | Does |
|---|---|
| `grep word f` | Lines containing word |
| `grep -i` | Ignore case |
| `grep -v` | Lines that don't match |
| `grep -rn word dir` | Search a folder, with line numbers |
| `grep -E 'a\|b'` | Extended regex |
| `grep -o` | Only the matching part |
| `grep -c` | Count matching lines |
| `find / -name f 2>/dev/null` | Find by name, hide errors |
| `find . -type f -size +1M` | Files over 1 MB |
| `find . -newer ref` | Changed after `ref` |

## Shape text

| Command | Does |
|---|---|
| `sort -rn` | Numeric, largest first |
| `sort -u` | Sorted, without repeats |
| `uniq -c` | Count runs (sort first) |
| `cut -d, -f2` | Field 2 of a CSV |
| `tr -d '"'` | Delete a character |
| `sed 's/a/b/g'` | Replace text |
| `sed -i 's/a/b/' f` | Replace in the file |
| `awk -F: '{print $1}'` | Print a field |
| `awk '$3 > 5'` | Filter on a field |
| `jq -r .a.b f.json` | Read JSON |
| `base64 -d` | Decode base64 |
| `sha256sum f` | File hash |

**The classic:** `grep X log | cut -d' ' -f1 | sort | uniq -c | sort -rn | head`

## Pipes and redirection

| Symbol | Does |
|---|---|
| `a \| b` | Send a's output to b |
| `> f` | Write to a file, replacing it |
| `>> f` | Append to a file |
| `< f` | Read input from a file |
| `2>/dev/null` | Throw away errors |
| `a && b` | Run b if a worked |
| `a \|\| b` | Run b if a failed |

## Users and permissions

| Command | Does |
|---|---|
| `id` | Who am I, which groups? |
| `sudo -l` | What may I run as root? |
| `chmod 640 f` | Owner rw, group r, others none |
| `chmod u+x f` | Owner may execute |
| `chown ana:sec f` | Change owner and group |
| `umask` | Default permission mask |
| `find / -perm -4000 -type f` | Find SUID programs |
| `awk -F: '$3 == 0' /etc/passwd` | UID 0 accounts |

| Digit | Rights |
|---|---|
| `7` | `rwx` |
| `6` | `rw-` |
| `5` | `r-x` |
| `4` | `r--` |
| `0` | `---` |

## Processes and services

| Command | Does |
|---|---|
| `ps aux` | All processes |
| `ps aux \| sort -k3 -rn \| head` | Top CPU users |
| `top` | Live view |
| `kill PID` | Ask a process to stop |
| `kill -9 PID` | Force it |
| `systemctl status x` | Is the service up? |
| `systemctl stop x` | Stop it |
| `systemctl list-units --type=service` | List services |
| `journalctl -u x --since today` | A service's logs |

## Network

| Command | Does |
|---|---|
| `ip a` | My addresses |
| `ip r` | My routes |
| `ss -tulpn` | What's listening? |
| `ping host` | Is it reachable? |
| `dig example.com` | DNS lookup |
| `curl -i URL` | Fetch, with headers |
| `nmap -sV host` | Service scan, **your own hosts only** |
| `tcpdump -i eth0 port 53` | Capture packets |

## Where things live

| Path | Holds |
|---|---|
| `/etc/passwd` | Accounts |
| `/etc/shadow` | Password hashes |
| `/etc/ssh/sshd_config` | SSH settings |
| `/etc/crontab`, `/etc/cron.d/` | Scheduled jobs |
| `/var/log/auth.log` | Logins and sudo |
| `/var/log/syslog` | System messages |
| `~/.ssh/authorized_keys` | Allowed SSH keys |
| `~/.bash_history` | Past commands |
