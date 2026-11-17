---
title: lsof
summary: Lists the files, sockets and devices each process has open.
side: defence
use: open
docs: https://github.com/lsof-org/lsof
alt: ss, ps
---
## What it's for
On Unix almost everything is a file, network connections included, so "list open files" answers many questions at once: which process holds this port, which files is that process writing, who is using the disk you can't unmount. It complements [ss](/tools/ss/) and [ps](/tools/ps/).

## How it works
For each process, `lsof` reads its open file descriptors (from `/proc` on Linux) and prints one line per open file: the command, process ID, user, descriptor number and mode, the type (regular file, directory, IPv4 socket, pipe) and the name. Options filter that list: `-i` for network files, `-p` for one process, `-u` for one user, `+D` for everything under a folder. Without root you only see your own processes.

## Try it
```
sudo lsof -i -P -n
sudo lsof -i :22
sudo lsof -p 1234
sudo lsof +L1
sudo lsof -u www-data
```

`-P -n` keep ports and addresses as numbers, which is also faster. `+L1` lists files that were deleted while still open. Find which process owns each listening port on your machine.

## What defenders see
`+L1` is a forensic favourite: malware often deletes its own file after starting, but while it runs the file stays open, so you can still copy it back from `/proc/<pid>/fd/`. An unexpected process holding a network connection, or a service writing a file it has no reason to touch, is worth following. The [Linux forensics](/modules/08-07-linux-forensics/) module puts this into an investigation.

?! `lsof +L1` shows a process running from `/tmp/.x` whose file is marked deleted. How do you keep a copy of the program before you stop the process?
