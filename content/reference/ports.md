---
title: Ports
summary: The ports you'll meet on every scan, and why a defender cares about each one.
source: IANA Service Name and Port Number Registry | https://www.iana.org/assignments/service-names-port-numbers/service-names-port-numbers.xhtml
---
## Everyday services

| Port | Proto | Service | Note |
|---|---|---|---|
| 22 | TCP | SSH | Keys, no root login |
| 25 | TCP | SMTP | Mail between servers |
| 53 | UDP, TCP | DNS | Watch for tunnelling |
| 67, 68 | UDP | DHCP | Server, client |
| 80 | TCP | HTTP | No encryption |
| 123 | UDP | NTP | Time for your logs |
| 443 | TCP, UDP | HTTPS, HTTP/3 | Most traffic, including C2 |

## Mail

| Port | Proto | Service | Note |
|---|---|---|---|
| 110 | TCP | POP3 | Plain text |
| 143 | TCP | IMAP | Plain text |
| 465 | TCP | SMTPS | Submission over TLS |
| 587 | TCP | Submission | Clients send here |
| 993 | TCP | IMAPS | IMAP over TLS |
| 995 | TCP | POP3S | POP3 over TLS |

## Windows and Active Directory

| Port | Proto | Service | Note |
|---|---|---|---|
| 88 | TCP, UDP | Kerberos | Tickets |
| 135 | TCP | RPC | Endpoint mapper |
| 137–139 | UDP, TCP | NetBIOS | Legacy, disable it |
| 389 | TCP, UDP | LDAP | Directory queries |
| 445 | TCP | SMB | Never on the internet |
| 464 | TCP, UDP | Kerberos password | Password changes |
| 636 | TCP | LDAPS | LDAP over TLS |
| 3268 | TCP | Global Catalog | Forest-wide LDAP |
| 3389 | TCP | RDP | Behind a VPN, with MFA |
| 5985, 5986 | TCP | WinRM | Remote PowerShell |

## Databases

| Port | Proto | Service | Note |
|---|---|---|---|
| 1433 | TCP | Microsoft SQL | Keep internal |
| 1521 | TCP | Oracle | Keep internal |
| 3306 | TCP | MySQL | Keep internal |
| 5432 | TCP | PostgreSQL | Keep internal |
| 6379 | TCP | Redis | Often no password |
| 9200 | TCP | Elasticsearch | Often exposed by mistake |
| 27017 | TCP | MongoDB | Often exposed by mistake |

## Management and legacy

| Port | Proto | Service | Note |
|---|---|---|---|
| 21 | TCP | FTP | Plain text, replace it |
| 23 | TCP | Telnet | Plain text, remove it |
| 69 | UDP | TFTP | No authentication |
| 161, 162 | UDP | SNMP | Change default strings |
| 514 | UDP | Syslog | Logs in plain text |
| 873 | TCP | rsync | Check for open shares |
| 2049 | TCP, UDP | NFS | Check its exports |
| 5900 | TCP | VNC | Weak by default |

## Containers and cloud

| Port | Proto | Service | Note |
|---|---|---|---|
| 2375 | TCP | Docker API | No TLS: root on the host |
| 2376 | TCP | Docker API | With TLS |
| 2379 | TCP | etcd | Holds cluster secrets |
| 6443 | TCP | Kubernetes API | The front door |
| 10250 | TCP | kubelet | Must require auth |
| `169.254.169.254` | | Cloud metadata | An address, not a port |

## The ranges

| Range | Name |
|---|---|
| 0–1023 | System, or well-known |
| 1024–49151 | Registered |
| 49152–65535 | Dynamic, or ephemeral |

::: law
Port scanning is for your own lab and for systems you have written permission to test.
:::
