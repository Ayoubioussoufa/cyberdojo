---
title: Build your lab
summary: Virtual machines, snapshots and safe network modes, then real step-by-step setup on your own computer.
month: 1
minutes: 60
builds: two virtual machines on an isolated network, with snapshots
source: VirtualBox User Manual, Virtual Networking | https://www.virtualbox.org/manual/
words: virtual machine, snapshot, host-only network
---
Until now, everything has run in your browser. Real security work needs real machines that you can break without consequence. A **virtual machine** gives you a whole computer inside your computer, free, that you can reset in seconds.

@term virtual machine (VM) = A complete simulated computer running as a program on your real computer.
@term hypervisor = The software that creates and runs virtual machines, such as VirtualBox.
@term host = Your real computer, which runs the hypervisor.
@term guest = An operating system running inside a virtual machine.
@term snapshot = A saved state of a virtual machine that you can return to instantly.
@term NAT network mode = A VM network mode giving outbound internet access while hiding the VM from outside.
@term host-only network = A private network between your VMs and your host, with no internet.
@term internal network = A private network between VMs only, not reaching the host.
@term Kali Linux = A Linux distribution packed with security testing tools.

## What a virtual machine is

A **hypervisor** is a program that pretends to be a computer. It gives each **guest** a virtual CPU, memory, disk and network card. The guest doesn't know it's not real hardware. This gives you three superpowers for security:

- **Isolation.** What happens in the VM stays there, provided you set it up properly.
- **Snapshots.** Save the state, try something dangerous, and restore it in seconds.
- **Variety.** Run Linux, Windows and a firewall on one laptop.

?? Why are snapshots so useful for security practice?
+ You can undo anything in a few seconds
- They make the virtual machine run much faster
- They stop malware from being able to run
- They copy the whole machine to the internet
=> Saving a state and restoring it means that you can try dangerous things without fear.

## Choosing a network mode

This is the setting that keeps you safe. It decides what your VM can reach.

| Mode | Reaches the internet? | Reaches your host? | Reaches other VMs? | Use it for |
|---|---|---|---|---|
| **NAT** | Yes | Not directly | Not usually | Installing updates |
| **Host-only** | No | Yes | Yes | Your main lab network |
| **Internal** | No | No | Yes | Most isolated: dangerous experiments |
| Bridged | Yes | Yes | Yes | Avoid: the VM joins your real network |

The exact behaviour is described in the [VirtualBox networking chapter](https://www.virtualbox.org/manual/).

::: law
Never attack anything from a bridged VM on a university or work network. Scanning your neighbours is unauthorised testing, even by accident. Stay on host-only or internal networks.
:::

?? You want a Linux VM and a Kali VM to reach each other with no internet access. Which mode?
+ Host-only or internal, on the same named network
- NAT, because every VM shares the same address
- Bridged, because it gives the best network speed
- No network, because VMs share the host's memory
=> Both give a private network with no route to the internet. Internal doesn't reach the host either, so it's the most isolated.

## Step by step

Check the [hardware guidance](/guides/a1-the-whole-plan/) first: 16 GB of RAM is comfortable, and 8 GB can run one or two small VMs. These steps use VirtualBox, which is free and [released under the GPL](https://www.virtualbox.org/wiki/Downloads). VMware Workstation Pro is [also free](https://knowledge.broadcom.com/external/article/368667/download-and-license-information-for-vmw.html) if you prefer it.

::: try Do this on your computer
1. Download **VirtualBox** from [virtualbox.org](https://www.virtualbox.org/wiki/Downloads) and install it. If VMs won't start, enable virtualization (Intel VT-x or AMD-V) in your computer's BIOS/UEFI settings.
2. Download the **Ubuntu Server** LTS image from [ubuntu.com](https://ubuntu.com/download/server). The current one is 26.04 LTS. An older roadmap may say 24.04, which also works.
3. In VirtualBox: **New**, name it `ubuntu-server`, choose the image. Give it 2 GB of RAM, 2 CPUs and a 25 GB disk.
4. Run the installer and accept the defaults. Tick **Install OpenSSH server**. Write down the username you choose.
5. Download the ready-made **Kali** VirtualBox image from [kali.org](https://www.kali.org/get-kali/#kali-virtual-machines), then import it with **File → Import**. Give it 2–4 GB of RAM.
6. Create the network: **Tools → Network → Host-only Networks → Create**.
7. For each VM, open **Settings → Network**: Adapter 1 stays on NAT for updates, and Adapter 2 goes on **Host-only**.
8. Start both, and run `ip a` in each. Find the address on the host-only network, usually `192.168.56.x`.
9. From Kali: `ping <ubuntu-address>`. Replies mean your lab works.
10. Shut down and take a snapshot of each: **Snapshots → Take**, named `clean-install`.
:::

::: tip Snapshot discipline
Take a snapshot before anything risky, and give it a name that says why. Before running anything unknown, also disable shared folders and the clipboard. When you test malware in Month 16, remove the NAT adapter entirely.
:::

?? You're about to try a command that could break your Ubuntu VM. What should you do first?
+ Take a named snapshot of the VM
- Copy the command into your notes first
- Switch the network adapter to bridged mode
- Increase the memory available to the VM
=> A snapshot makes the risky thing safe. It takes seconds, and it's the habit that lets you experiment freely.

## Document it

The gate asks for a lab of two VMs with snapshots, documented in a README. Write down the VM names, their addresses, the network mode and why you chose it. This starts project [P01](/projects/P01/).

?! Paste your `ip a` output from each VM (these are private lab addresses) and explain which address belongs to which network adapter. If something failed, describe the error exactly.

## What you can do now

You own a real lab. From here on, the commands you've learned work on real machines too. Next, you'll connect to a remote server securely.
