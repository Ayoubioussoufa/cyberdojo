---
title: certutil
summary: A Windows certificate utility that attackers misuse to download and decode files.
side: both
use: know
docs: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/certutil
alt: powershell, sysmon
---
## What it's for
certutil is a legitimate Windows program for working with certificates. It appears in real intrusions because it can also download a file from the Internet and decode base64, which lets an attacker fetch a payload using a trusted, signed, built-in program. ATT&CK records it in many campaigns.

## How it works
The dual use is the issue. Its genuine job is managing certificates, but two of its features, downloading a file and decoding encoded data, are exactly what an attacker needs to pull in a tool and unpack it. Because certutil is signed by Microsoft and expected on the system, this slips past controls that only look for unknown programs. It's a textbook [living off the land](/modules/06-03-living-off-the-land/) binary.

## Practise safely
Study the detection rather than the technique. On a lab VM with [Sysmon](/tools/sysmon/), look at what a normal certificate operation logs, so you know the baseline. The abuse shows up clearly: certutil making a network connection, or certutil decoding a file, is rare in normal use and easy to alert on. Read the community [Sigma](/tools/sigma/) rules for it to see the exact patterns.

## What defenders see
Alert on certutil contacting a network address, and on its decode feature being used, since neither is common in day-to-day administration. More broadly, application control that limits which built-in tools can run, and good command-line logging, are what catch this whole family. The [LOLBAS project](https://lolbas-project.github.io/) catalogues such binaries.

?! Why does using a Microsoft-signed, built-in tool help an attacker evade defences that focus on unknown programs?
