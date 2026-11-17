---
title: schtasks
summary: Windows' command for scheduled tasks, a common way for intruders to stay on a machine.
side: both
use: know
docs: https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/schtasks
aka: Task Scheduler
alt: autoruns, sysmon
---
## What it's for
Windows' Task Scheduler runs programs at set times, at logon or at start-up, and `schtasks` is its command-line interface. Administrators use it for maintenance. Intruders use it to run their program again after every reboot or logon, and to run commands on other machines. ATT&CK lists scheduled tasks as both a persistence and an execution technique.

## How it works
A task is stored as an XML definition under `C:\Windows\System32\Tasks` and in the registry, with a trigger (a time, a logon, a start-up), an action (the program and its arguments) and an account to run as. A task that runs as SYSTEM has the highest privileges, so creating one needs administrator rights. Tasks can be created on the local machine, or on another machine by an account that is an administrator there.

## Practise safely
In a lab VM, open Task Scheduler and browse the library: Microsoft's own tasks fill most of it, which is exactly the noise an intruder hides in. Create a harmless task by hand that opens Notepad at logon, sign out and in again, then find the task's XML file and the events it produced. That shows you what a defender sees.

## What defenders see
Task creation is logged: event 4698 in the Security log, when object access auditing is on, and events in the Microsoft-Windows-TaskScheduler/Operational log, while [Sysmon](/tools/sysmon/) records the files written under `System32\Tasks`. Look for tasks whose action runs from user folders, `ProgramData` or `Temp`, starts a script engine with encoded arguments, or was created from another machine. [Autoruns](/tools/autoruns/) lists every task in one view.

?! Event 4698 shows a new task named `GoogleUpdateTaskMachineCore1` whose action is a PowerShell command. What do you check to decide whether it's legitimate?
