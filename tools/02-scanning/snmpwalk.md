---
title: snmpwalk
summary: Reads a device's settings over SNMP.
side: both
use: own
docs: https://www.net-snmp.org/docs/man/snmpwalk.html
kali: snmp
aka: onesixtyone
alt: nmap
---
## What it's for
SNMP is how network devices report their status. snmpwalk reads the whole tree of values from a device. If a device still uses the default community string, it may tell anybody its interfaces, routes and software.

## How it works
SNMP values live in a tree, the MIB, with each value at a numeric path. snmpwalk asks for one value, then the next, until it reaches the end. Versions 1 and 2c use a community string, which is a shared password sent in clear text. Version 3 adds real authentication and encryption. `onesixtyone` is a companion tool that tests a list of community strings across hosts quickly.

## Try it
::: law Your lab only
Use a lab router or VM running `snmpd`.
:::

```
snmpwalk -v2c -c public 192.168.56.10 system
```

`-c` is the community string, and `system` limits it to the basic tree. Try to find the host's name and uptime.

## What defenders see
Use SNMPv3 with authentication and privacy. Change the defaults, limit which hosts may query, and block UDP port 161 from user networks. IDS rules can flag the `public` string, as it's visible in clear text.

?! Why does running SNMPv2c with a long community string still leave a risk that SNMPv3 removes?
