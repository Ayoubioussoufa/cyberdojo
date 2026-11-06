---
title: Active Directory
summary: Domains, forests, OUs, GPOs, LDAP and why AD runs most enterprises, with a lab you build and script yourself.
month: 7
minutes: 60
builds: a domain with users, groups and GPOs, the start of P04
source: GOAD, Game of Active Directory | https://github.com/Orange-Cyberdefense/GOAD
words: domain, domain controller, GPO
---
Active Directory is the phone book, the bouncer and the rulebook of most companies' Windows networks. Compromise it and you own the business. It's why ransomware crews go after it, and why you'll spend this month inside one.

@term Active Directory (AD) = Microsoft's directory service, which stores and manages users and computers in a Windows network.
@term domain = A group of users and computers managed together by Active Directory.
@term domain controller (DC) = A server that runs Active Directory and handles logins.
@term forest = The top-level container of one or more AD domains.
@term OU (organizational unit) = A folder in AD used to organise objects and apply policy.
@term GPO (Group Policy Object) = A set of settings applied to users and computers in AD.
@term LDAP = The protocol for querying a directory such as AD.
@term service account = An account used by a program rather than a person.
@term SPN (service principal name) = A name linking a service to the account that runs it.
@term Domain Admins = The AD group with full control of a domain.
@term tiering model = Keeping admin credentials for critical systems away from less trusted machines.

## The structure

```
Forest: corp.example
└── Domain: corp.example
    ├── OU: Finance      users, computers, a GPO
    ├── OU: IT
    └── OU: Servers
```

| Object | What it is |
|---|---|
| **Domain** | One managed boundary with its own database |
| **Forest** | One or more domains that trust each other: the true security boundary |
| **OU** | A folder for organising and delegating |
| **Group** | A set of users for permissions |
| **GPO** | Settings pushed to everything under an OU |

A **domain controller** holds the database, a file called `NTDS.dit`, which contains password hashes for every account. That's why a DC is the crown jewel. AD depends on **DNS**: clients find DCs through DNS records, so broken DNS means broken logins.

**LDAP** is how you query it:

```powershell
Get-ADUser -Filter * | Select-Object Name
Get-ADGroupMember "Domain Admins"
Get-ADComputer -Filter *
```

?? Why is a domain controller such a high-value target?
+ It stores every single account's password material
- It runs the company's public marketing website
- It's the only machine with internet access
- It has the fastest disks around here
=> Whoever controls a DC controls every account in the domain.

## Why GPOs matter to attackers

A GPO can install software or run scripts on every machine under an OU. So write access to a GPO linked to the Workstations OU means code execution on every workstation. Permissions in AD are as important as those on files, and they're invisible unless you look. That's what [BloodHound](https://bloodhound.specterops.io/) is for.

## Service accounts and SPNs

Programs like SQL Server run under **service accounts**. An **SPN** ties a service to its account. These accounts often have weak, never-changed passwords and too many rights. Remember that: it's what makes Kerberoasting work, two lessons from now.

## Tiering

The [tier model](https://learn.microsoft.com/en-us/security/privileged-access-workstations/privileged-access-access-model) says: never log in to a low-trust machine with a high-trust account. When a Domain Admin logs in to a workstation, their credentials land in that machine's memory. Compromise the workstation and you've got the domain.

## Build the lab

Your own lab, as [P04](/projects/P04/). **With 32 GB of RAM:** [GOAD](https://github.com/Orange-Cyberdefense/GOAD) or GOAD-Light builds it automatically. **Otherwise:** a hand-built three-VM domain.

::: try Hand-built domain
1. Create a Windows Server VM on your host-only network, with a static IP.
2. Install AD DS and promote it to a new forest, in PowerShell:
```powershell
Install-WindowsFeature AD-Domain-Services -IncludeManagementTools
Install-ADDSForest -DomainName "corp.lab" -InstallDns
```
3. Point a Windows 11 VM's DNS at the DC, and join it to the domain.
4. Create OUs, 20+ users and 5 groups with a script. [BadBlood](https://github.com/davidprowe/BadBlood) can populate it, or write your own.
5. Create three GPOs, such as a password policy and an audit policy.
6. Add a service account with an SPN and a deliberately weak password, and **document it** in a weakness register:
```powershell
New-ADUser -Name svc_sql -AccountPassword (Read-Host -AsSecureString) -Enabled $true
setspn -S MSSQLSvc/srv1.corp.lab:1433 corp\svc_sql
```
:::

::: law
This weak account belongs in your isolated lab only. Keep the lab on host-only networks, and never expose it.
:::

The gate asks you to rebuild it from your own script, so write the script as you go.

?? A Domain Admin logs in to a help-desk laptop to fix a printer. Why is that dangerous?
+ Their credentials land in that laptop's memory
- It deletes the laptop's group policy objects
- It removes them from the Domain Admins
- It stops domain controllers from answering requests
=> An attacker on that laptop can harvest them. That's the problem the tier model exists to prevent.

?! Explain the difference between a domain, a forest and an OU, as if to a new colleague.
