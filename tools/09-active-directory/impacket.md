---
title: Impacket
summary: A library of Windows network protocols that powers many admin and attack tools.
side: both
use: know
docs: https://github.com/fortra/impacket
kali: impacket
alt: netexec, wireshark
---
## What it's for

Impacket is a Python library that implements Windows network protocols, such as SMB and the remote-execution services. A great many security tools, friendly and hostile, are built on it, so its example scripts appear constantly in intrusion reports. Recognising their footprints is a core Windows detection skill.

## How it works

Because it speaks the protocols directly, Impacket can perform actions that normally need Windows tools: running a command on a remote host, reading parts of the directory, and handling authentication exchanges. Its example scripts each wrap one such action. For a defender, the point is that these use legitimate protocols in legitimate-looking ways, so detection depends on noticing unusual patterns of normal activity rather than forbidden commands.

## Practise safely

On a lab with [Sysmon](/tools/sysmon/) and network monitoring, learn what normal remote administration looks like, so the abnormal stands out. The remote-execution scripts, for example, tend to create recognisable service and named-pipe patterns on the target. The exercise is to identify, in your logs, the difference between an administrator's remote action and an anomalous one from an unexpected source.

## What defenders see

Detection rests on context: remote execution from a host that never does it, service creation tied to a short-lived command, and authentication from unusual places. Restrict who can perform remote administration, log it well, and alert on the service and pipe patterns these scripts leave. [Windows credential stores](/modules/02-07-windows-credential-stores/) and the defences module give the background.

?! Why is abuse built on legitimate Windows protocols detected by unusual patterns rather than by forbidden commands?
