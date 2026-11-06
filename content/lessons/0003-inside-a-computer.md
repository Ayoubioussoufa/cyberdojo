---
title: What's inside a computer
summary: Hardware, the operating system, programs, processes and files, explained from nothing, ending with your first real commands.
month: 0
minutes: 25
builds: run your first three commands and capture your first flag
source: The Linux Command Line, William Shotts, free online book | https://linuxcommand.org/tlcl.php
words: operating system, process, shell
---
To protect a computer you need a picture of what's happening inside it. This is that picture. No maths, no memorising. It's five ideas, and every attack you ever study will be a story about them.

@term CPU (processor) = The chip that carries out instructions, billions per second, one small step at a time.
@term RAM (memory) = Fast temporary storage holding running programs and their data. It's wiped when power goes.
@term disk (storage, SSD) = Slow permanent storage for files. It keeps its contents with the power off.
@term operating system (OS) = The software that manages the hardware and lets programs share it safely. Examples are Linux, Windows and macOS.
@term kernel = The core of the operating system. It controls the hardware and decides what each program is allowed to do.
@term program = A file containing instructions, sitting on disk, not doing anything.
@term process = A program that is currently running, with its own memory and identity.
@term file = A named chunk of data stored on disk.
@term directory (folder) = A container for files and other directories.
@term shell = The program that reads the commands you type and runs them.
@term terminal = The window you type into. The shell runs inside it.
@term command line (CLI) = Controlling a computer by typing commands rather than clicking.
@term Linux = A free operating system that runs most of the world's servers, phones and cloud systems.
@term server = A computer that provides a service to others over a network.

## The hardware: a kitchen

Picture a restaurant kitchen:

- The **CPU** is the cook. It does one small instruction at a time, but billions of them per second.
- **RAM** is the worktop: fast, close at hand, and cleared at the end of the day. When the power goes, RAM forgets everything.
- The **disk** is the storeroom: much bigger, much slower, and it keeps things with the power off.

Forensic investigators care about this difference. Evidence in RAM vanishes when a machine is switched off, so pulling the plug can destroy proof. You'll come back to this in Month 15.

## The operating system: the manager

Dozens of programs want the CPU at the same moment. Without a manager, one program could read another's memory, or wipe the disk. The **operating system** is that manager, and its heart is the **kernel**.

The kernel makes one rule that everything in security depends on:

::: key
Programs can't touch the hardware directly. They have to ask the kernel, and the kernel checks whether they're allowed. Most of security is about that check.
:::

Whenever a program wants to open a file, it makes a request. The kernel looks at who's asking and says yes or no. When you see `Permission denied` in a few lessons, that's the kernel's voice.

?? Why does it matter that programs must ask the kernel to open a file?
+ It gives one place to enforce permissions
- It makes reading files much faster overall
- It stops programs from ever having bugs
- It keeps files safe from hardware failure
=> A single checkpoint means a program can't simply help itself. If every program could reach the disk directly, permissions would be meaningless.

## Programs and processes

A **program** is a file on disk: a recipe in a book. A **process** is that program running: the cook actually making the dish. Open your browser twice and you have one program but two processes.

Every process has a number (its PID), its own private memory, and an **identity**: which user it's running as. That identity is what the kernel checks.

@term PID (process ID) = The number the kernel gives each running process.

## Files and folders

Everything on disk is a **file**, and files live in **directories**, which is simply the technical name for folders. Directories can hold more directories, forming a tree. You'll walk that tree in the next lesson.

Now that you've met files, processes and permissions, here's how they connect. Attackers want to run their own **process**, as a powerful **user**, to read or change **files**. Defenders try to stop that, and keep a record when it happens.

## The shell: talking to the kernel

You normally control a computer by clicking. But servers usually have no screen at all, and clicking can't be repeated or automated. So professionals type. Three words get mixed up:

- The **terminal** is the window.
- The **shell** is the program inside it that reads what you type. The most common one on Linux is called `bash`.
- A **command** is a program you ask the shell to run.

When you type `whoami` and press Enter, the shell finds a program called `whoami`, asks the kernel to start it as a new process, and shows you what it prints.

@flow You type whoami > The shell finds the program > The kernel starts a process > It prints a result > The shell waits for you

We use **Linux** throughout because it runs most servers and nearly all security tooling. Don't worry about installing anything yet. The black box below is a terminal running right here in your browser. Its commands behave like the real ones, because we test them against the real ones.

::: try How to use it
Click inside the black box, type a command and press Enter. Nothing you do can break it, and **Reset** gives you a fresh machine at any time.
:::

@range first-steps

?? You type `whoami` in a terminal. Which is the best description of what happens?
+ The shell asks the kernel to run a program
- The terminal window answers you all by itself alone
- The CPU reads your keyboard and prints a name
- The disk searches for your username and displays it
=> The terminal only displays text. The shell understands your command, and the kernel starts the program as a process. Keeping these layers apart will save you confusion later.

?! Explain in your own words the difference between a program and a process, using an analogy of your own rather than the recipe.

## What you can do now

You've run real commands and captured your first flag. And you have a picture that the rest of the course builds on: hardware underneath, a kernel that checks every request, processes running as users, and files on disk.

Next, you'll learn to move around that filesystem as easily as you move around your phone.
