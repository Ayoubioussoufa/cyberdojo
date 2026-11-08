---
title: Virtualisation and boot integrity
summary: What hypervisors isolate, and what they don't. Secure Boot, measured boot, the TPM and full-disk encryption, and how they combine to protect a machine from power-on.
level: advanced
side: defence
minutes: 45
attack: T1542.003, T1611
needs: 0012-build-your-lab, 02-02-linux-boot-and-linking
pair: 02-02-linux-boot-and-linking, 15-09-physical-security, 06-07-rootkits-and-bootkits
source: NIST SP 800-147, BIOS Protection Guidelines | https://csrc.nist.gov/pubs/sp/800/147/final
words: hypervisor, measured boot, TPM
---
Two foundations sit under everything else on a machine. A hypervisor promises isolation between virtual machines, and the boot chain promises that the OS you loaded is the one you meant to load. If either fails, every control above it is built on sand.

@term TPM (Trusted Platform Module) = A security chip that stores keys and records boot measurements.
@term Secure Boot = A UEFI feature that runs only signed boot code.
@term measured boot = Recording a hash of each boot component in the TPM, for later checking.
@term PCR (platform configuration register) = A TPM register that accumulates measurements of the boot process.

## Concept

### Fundamentals: hypervisors

A **type 1** hypervisor, such as ESXi, Hyper-V or Xen, runs on the hardware. A **type 2**, such as VirtualBox, runs inside an OS. KVM sits between, as a Linux kernel module. Hardware support (VT-x, AMD-V) and second-level page tables enforce memory separation.

Isolation is strong, but it isn't magic. Device emulation is the classic weak spot: a flaw in a virtual device can let a guest reach the host, which is **VM escape**. [VENOM](https://nvd.nist.gov/vuln/detail/CVE-2015-3456) (CVE-2015-3456) was one, in a virtual floppy controller that nobody needed. Removing unused virtual hardware shrinks that surface. [Shared hardware](/modules/15-05-microarchitectural-attacks/) can also leak between guests.

Hypervisors are also attractive for attackers because of leverage: ransomware groups target ESXi hosts, since encrypting one host takes down every VM on it.

### Containers aren't VMs

A VM brings its own kernel, whereas a container [shares the host's](/modules/02-03-linux-confinement/). Microservices that need strong isolation can use gVisor or Kata Containers, which add a kernel layer or a light VM.

### The boot chain

**Secure Boot** verifies signatures on each boot stage, using keys held in UEFI: PK, KEK, and the allowed (`db`) and forbidden (`dbx`) lists. On Linux, a small `shim` signed by Microsoft loads GRUB and the kernel.

**Measured boot** answers a different question. Instead of blocking, it records a hash of each stage in the TPM's **PCRs**. A PCR can't be set, only extended: `new = hash(old || measurement)`. So nothing can erase a measurement after the fact.

| | Secure Boot | Measured boot |
|---|---|---|
| Action | Enforce | Record |
| Failure | Refuses to boot | Boots, but evidence differs |
| Uses | Firmware keys | TPM |

### The TPM

A TPM holds keys that can't be exported, and it can **seal** a key to a state: it releases the key only if PCRs match. That's how BitLocker unlocks automatically. **Remote attestation** lets a server check a machine's PCRs before trusting it, and that's useful for [Zero Trust](/modules/07-07-zero-trust-in-depth/) device checks.

### Advanced: full-disk encryption and its limits

**BitLocker** and **LUKS** encrypt the disk, protecting against theft. Yet TPM-only unlock has a gap: the key travels from TPM to CPU at boot, and on some laptops that bus can be sniffed. A pre-boot **PIN** defends against this, by making the TPM's release depend on something that you know.

Boot-level threats exist. [BootHole](https://eclypsium.com/blog/theres-a-hole-in-the-boot/) (2020) was a GRUB flaw that undermined Secure Boot, and fixing it required revoking old bootloaders. [BlackLotus](https://www.microsoft.com/en-us/security/blog/2023/04/11/guidance-for-investigating-attacks-using-cve-2022-21894-the-blacklotus-campaign/) (2023) was a UEFI bootkit able to run on fully patched Windows 11 by abusing an old signed boot component. Both show why `dbx` updates matter. Microsoft's [replacement of the 2011 Secure Boot certificates](https://support.microsoft.com/en-us/topic/windows-secure-boot-certificate-expiration-and-ca-updates-7ff40d33-95dc-4c3c-8725-a9b95457578e) in 2026 is the same issue at scale, so check that your fleet has updated.

?? What does measured boot add to Secure Boot?
+ A tamper-evident record of what truly ran
- A faster boot for all signed kernels
- A way to skip entering disk passwords
- A backup copy of the firmware image
=> Secure Boot blocks unsigned code, whereas measurements give evidence of what actually ran, which can be checked later.

## Threat model

| Technique | ATT&CK |
|---|---|
| Bootkits | [T1542.003](https://attack.mitre.org/techniques/T1542/003/) |
| Escape to host | [T1611](https://attack.mitre.org/techniques/T1611/) |

Boot persistence survives reinstalling the OS. Attackers with physical access can try [evil maid attacks](/modules/15-09-physical-security/). In cloud, a compromised hypervisor is the provider's concern, and that's why confidential VMs exist.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `mokutil --sb-state` | Shows Secure Boot state | Linux |
| `tpm2-tools` | Reads PCRs, seals keys | Learning the TPM |
| `manage-bde`, `cryptsetup` | Manage disk encryption | Windows and Linux |
| `systemd-cryptenroll` | Binds LUKS to a TPM | Linux laptops |
| CHIPSEC | Assesses firmware | Platform review |
| `fwupd` | Updates firmware | Linux fleets |

## Defence

- **Enable Secure Boot,** and keep `dbx` current.
- **Use TPM with a PIN** on high-risk laptops.
- **Escrow recovery keys** in AD, Entra or a vault.
- **Update firmware,** like any other software.
- **Remove unused virtual devices,** and patch hypervisors first.
- **Isolate hypervisor management.** ESXi hosts shouldn't be reachable from user networks.
- **Use attestation** where you've got device trust.

## Pitfalls

- **"Encrypted disk means safe while running."** Once unlocked, it's readable like any other.
- **"Secure Boot stops all malware."** It only covers the boot path.
- **Forgetting recovery keys.** Disk encryption without escrow is data loss waiting to happen.
- **Assuming VMs are perfect boundaries.** Patch, and don't mix trust levels on one host.
- **Leaving ESXi on the corporate domain.** That links its fate to AD.

?? Why does a TPM with PIN beat TPM-only BitLocker?
+ The disk key needs something you know
- The PIN encrypts each file twice over
- The TPM stops working without the network
- The disk gets noticeably faster at boot
=> Without the PIN, a stolen powered-off laptop can't release its key, so bus sniffing has nothing to capture.

## Exercise

::: law Lab only
Use VMs or your own test machine. Changing firmware or Secure Boot keys can make a machine unbootable, so take backups first.
:::

1. Enable a virtual TPM on a lab VM. Run `tpm2_pcrread`, and note the values.
2. Change the kernel command line, reboot, and compare the PCRs.
3. Create a small LUKS volume, and bind it to the TPM with `systemd-cryptenroll`.
4. Check Secure Boot state with `mokutil`, then read `/sys/firmware/efi`.
5. List the virtual devices in a VM, and remove all those that you don't need.

?! A laptop was left in a hotel for a day. Write what you'd check when it returns, and which settings would have changed your worry.

## Further reading

- [NIST SP 800-147](https://csrc.nist.gov/pubs/sp/800/147/final), BIOS protection.
- [NIST SP 800-125A](https://csrc.nist.gov/pubs/sp/800/125/a/r1/final), on hypervisor security.
- [Trusted Computing Group TPM 2.0](https://trustedcomputinggroup.org/resource/tpm-library-specification/).
- [Microsoft on BlackLotus](https://www.microsoft.com/en-us/security/blog/2023/04/11/guidance-for-investigating-attacks-using-cve-2022-21894-the-blacklotus-campaign/).
- [Arch Wiki on Secure Boot](https://wiki.archlinux.org/title/Unified_Extensible_Firmware_Interface/Secure_Boot), for a practical reference.
