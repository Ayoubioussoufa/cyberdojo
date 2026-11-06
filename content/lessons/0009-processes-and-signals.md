---
title: Processes and signals
summary: See what's running on a machine, spot what doesn't belong, and stop it safely.
month: 1
minutes: 20
builds: find a rogue process and stop it, even one that fights back
source: signal(7) manual page | https://man7.org/linux/man-pages/man7/signal.7.html
words: PID, signal, SIGKILL
---
A file on disk does nothing until it runs. So when something is wrong on a server, defenders ask: *what's running right now, who started it, and where did it come from?*

@term signal = A small message the kernel delivers to a process, for example asking it to stop.
@term SIGTERM = Signal 15, a polite request to stop. A program can catch it and clean up.
@term SIGKILL = Signal 9. The kernel ends the process at once, and it can't be caught or ignored.
@term parent process = The process that started another. Every process except the first has one.
@term service (daemon) = A program that runs in the background, like a web server.

## Seeing what's running

Every process has a parent, so a running system forms a tree:

@flow systemd (PID 1) > sshd > bash > your command

```
$ ps aux
USER   PID %CPU %MEM COMMAND
root     1  0.0  0.1 /sbin/init
root   612  0.0  0.1 /usr/sbin/sshd -D
ana   4021  0.0  0.1 -bash
ana   5177 98.2  4.0 /tmp/.x/cryptominer --pool evil.example
```

Read it like a detective. PID 1 is the first process, which starts everything else. `sshd` is the service that accepts remote logins. And that last line has three red flags: it's using 98% of the CPU, it's running from a hidden folder in `/tmp`, and its name says what it is.

Every process also has a **parent**, shown by `ps -ef` in the PPID column. That turns out to matter enormously: Word starting PowerShell is one of the strongest signs of attack you'll meet in Month 9.

::: try What to check on any suspicious process
**Who** runs it (USER)? **Where** is the program on disk? **What** started it (parent)? **What** is it doing (CPU, network)? That's the start of every host investigation.
:::

?? Which of these makes a process most suspicious?
+ It runs from a hidden `/tmp` folder
- It has a process number above 1000
- It belongs to `root` on a server
- It uses a little memory while running
=> Real programs live in places such as `/usr/bin`. A hidden folder in a place that anyone can write to is a strong warning sign.

## Signals

You stop a process by sending it a **signal**, a small message delivered by the kernel. The full list is in [signal(7)](https://man7.org/linux/man-pages/man7/signal.7.html). You'll use two:

| Signal | Number | Meaning | Can it be ignored? |
|---|---|---|---|
| `SIGTERM` | 15 | Please stop, and clean up first | Yes |
| `SIGKILL` | 9 | Stop now | No |

```
kill 5177        sends SIGTERM by default
kill -9 5177     sends SIGKILL
```

Despite the name, `kill` just sends signals. Always try SIGTERM first: it lets a database finish writing, for example. Use SIGKILL when that fails.

?? You run `kill 5177`, and `ps` shows it's still running. Most likely explanation?
+ It caught or simply ignored the polite signal
- `kill` only works on files, never on processes
- The kernel needs a reboot to apply it
- PID 5177 now belongs to a different user
=> SIGTERM is a request that programs may handle. If it ignores you, escalate to `kill -9`, which the kernel enforces.

## Who may kill what

The kernel checks permissions here too: **you can only signal your own processes**, unless you're root. Try it on someone else's and you get `Operation not permitted`. It's the same idea as file permissions: identity, then a check.

::: job Think before you strike
In a real incident, killing a process destroys what it held in memory, possibly including keys and evidence. Responders often collect memory first, or isolate the machine from the network, before killing anything. You'll learn that trade-off in Month 11.
:::

@range procs

?? A suspicious program is running. Why might a responder not kill it straight away?
+ Its memory may hold evidence that vanishes
- Killing processes always crashes the whole server
- Only the original attacker can stop it
- Linux doesn't let anyone stop running malware
=> RAM disappears when a process ends. The decision between stopping harm and preserving evidence is a real trade-off.

?! List the three red flags in the `cryptominer` line above, and what each suggests.

## What you can do now

You can look at a machine and tell what's running, what's suspicious, and how to stop it. The next two lessons step back from the terminal and give you the language of the whole field.
