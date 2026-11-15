---
title: Active Directory
summary: Domains, forests, OUs, GPOs, LDAP and why AD runs most enterprises, with a lab you build and script yourself.
month: 7
minutes: 80
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

@stack
Forest | corp.example | the true security boundary
Domain | corp.example | one managed database
OU | Finance, IT, Servers | folders that hold users and computers
Object | users, computers, groups | what GPOs and permissions apply to

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

Every object in the directory has a full address called a **distinguished name**, and you'll see them in tools, logs and scripts. Read one from right to left, from the domain down to the object:

```
CN=Ana Diaz,OU=Finance,OU=Staff,DC=corp,DC=lab
```

| Part | Stands for | Here |
|---|---|---|
| `DC` | Domain component | `corp` and `lab` together make the domain `corp.lab` |
| `OU` | Organizational unit | `Staff`, and inside it `Finance` |
| `CN` | Common name | The object itself, the user Ana Diaz |

So this is the user Ana Diaz, in the Finance OU, inside the Staff OU, in the domain `corp.lab`. The position matters, because GPOs linked to `Staff` and to `Finance` both apply to her.

@code parse-dn

The three commands above return objects, like everything in PowerShell, and each object has far more properties than the default view shows. Ask for the ones a reviewer cares about:

```powershell
Get-ADUser ana.diaz -Properties MemberOf, LastLogonDate, PasswordLastSet, Enabled
```

On a domain controller you can also browse the same data with a mouse: run `dsa.msc` to open **Active Directory Users and Computers**. Use it to learn the shape of the tree, and use PowerShell for anything you'll need to repeat or prove.

Since logins depend on DNS, two commands on a client tell you whether it can find a domain controller at all:

```
nslookup -type=SRV _ldap._tcp.dc._msdcs.corp.lab
nltest /dsgetdc:corp.lab
```

The first asks DNS for the record that lists the DCs. The second asks Windows to locate one and prints its name and address. If the first returns nothing, the client's DNS setting doesn't point at the DC, and no login will work until it does.

?? Why is a domain controller such a high-value target?
+ It stores every single account's password material
- It runs the company's public marketing website
- It's the only machine with internet access
- It has the fastest disks around here
=> Whoever controls a DC controls every account in the domain.

## Why GPOs matter to attackers

A GPO can install software or run scripts on every machine under an OU. So write access to a GPO linked to the Workstations OU means code execution on every workstation. Permissions in AD are as important as those on files, and they're invisible unless you look. That's what [BloodHound](https://bloodhound.specterops.io/) is for.

Three commands cover most GPO questions:

| Command | Where | Shows or does |
|---|---|---|
| `Get-GPO -All` | Domain controller | Every GPO in the domain |
| `gpresult /r` | Any member machine | Which GPOs actually applied to this computer and this user |
| `gpupdate /force` | Any member machine | Fetches and applies policy now, without waiting |

A GPO does nothing until it's **linked** to an OU, and then it applies to the objects inside that OU and below it. When a setting "isn't working", `gpresult /r` on the affected machine is the first thing to read: either the GPO is in the list or it isn't, and if it isn't, the computer is in an OU the GPO isn't linked to.

?? Why is write access to a GPO so dangerous?
+ It can run code on many machines
- It only changes the desktop background picture
- It lets you read all the logs
- It deletes the forest all at once
=> A GPO applies to everything under its OU, so one permission reaches every machine there.

## Service accounts and SPNs

Programs like SQL Server run under **service accounts**. An **SPN** ties a service to its account. These accounts often have weak, never-changed passwords and too many rights. Remember that: it's what makes Kerberoasting work, two lessons from now.

Finding these accounts is a defender's job before it's anyone else's. This lists every account that has an SPN, with the two facts that decide how risky it is:

```powershell
Get-ADUser -Filter 'ServicePrincipalName -like "*"' -Properties ServicePrincipalName, PasswordLastSet, MemberOf |
  Select-Object Name, PasswordLastSet, MemberOf
```

A password last set years ago was probably chosen by a person and never rotated. Membership of a powerful group means the account can do far more than run one service. The modern fix is a **group managed service account**, where the domain itself generates a long random password and changes it automatically, so there's no human-chosen secret at all.

A few more one-line audits belong in the same script. Each one answers a question an attacker would ask about your domain, so ask first:

```powershell
Get-ADGroupMember "Domain Admins"                                  # who holds the keys?
Search-ADAccount -AccountInactive -TimeSpan 90.00:00:00 -UsersOnly  # who hasn't logged in for 90 days?
Get-ADUser -Filter 'PasswordNeverExpires -eq $true'                 # whose password never changes?
```

@code risky-service-accounts

?? What's an SPN?
+ A name tying a service to its account
- A password that a service account always uses
- A log of every service on a machine
- A group of accounts that all share permissions
=> Clients find services by SPN. Weak passwords on those accounts are the real risk.

## Tiering

The [tier model](https://learn.microsoft.com/en-us/security/privileged-access-workstations/privileged-access-access-model) says: never log in to a low-trust machine with a high-trust account. When a Domain Admin logs in to a workstation, their credentials land in that machine's memory. Compromise the workstation and you've got the domain.

?? What does the tier model forbid?
+ High-trust accounts logging in to low-trust machines
- Low-trust accounts printing to any shared printers
- Accounts with passwords over twelve characters long
- All logins from outside normal working hours
=> A login leaves credentials in that machine's memory, so a weak machine puts a strong account at risk.

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

## Audit your own domain

Once the lab exists, review it the way you'd review a client's. Three findings to interpret:

```
Name     PasswordLastSet        MemberOf
svc_sql  03/14/2019 09:12:44    {CN=Domain Admins,CN=Users,DC=corp,DC=lab}
```

?? What's wrong with that account?
+ An old password and too much power
- A new password and too little power
- A name that doesn't follow the standard
- A login that happened outside office hours
=> It's a service account whose password hasn't changed in years, and it's a Domain Admin. Running one database doesn't need control of the whole domain.

?? A new workstation can't log anyone in, and `nslookup -type=SRV _ldap._tcp.dc._msdcs.corp.lab` returns no answer. Where do you look first?
+ The workstation's DNS server setting
- The user's password expiry date
- The domain controller's disk space
- The workstation's desktop background GPO
=> Clients find domain controllers through DNS. If the SRV lookup fails, the machine is asking the wrong DNS server, usually the router's.

?? You linked a new GPO to the `Workstations` OU, but `gpresult /r` on one laptop doesn't list it, even after `gpupdate /force`. What's the likeliest cause?
+ The laptop's account sits in another OU
- The GPO needs one day to copy
- The laptop needs more than 8 GB
- The GPO only applies to Domain Admins
=> A GPO applies to the objects in the OU it's linked to. New computers land in the default `Computers` container until someone moves them.

?! Explain the difference between a domain, a forest and an OU, as if to a new colleague.
