---
title: Physical side channels and trusted execution
summary: Chips leak through power and timing, and faults can skip checks. How smart cards and HSMs resist that, and what trusted execution environments really promise.
level: advanced
side: defence
minutes: 40
attack: none
needs: 15-05-microarchitectural-attacks, 03-11-key-management
pair: 15-05-microarchitectural-attacks
source: Kocher, Jaffe and Jun, Differential Power Analysis | https://www.paulkocher.com/doc/DifferentialPowerAnalysis.pdf
words: power analysis, fault injection, remote attestation
---
Software security assumes that a chip keeps its secrets. With physical access, that assumption weakens: a device's power use changes with the data it's processing, and a voltage glitch can make it skip an instruction. This is why bank cards, HSMs and secure elements are engineered so carefully. It's also the setting for a newer idea: running code on a machine that you don't trust.

@term power analysis = Inferring secrets from how a chip's power use varies during computation.
@term fault injection = Deliberately disturbing a chip, by voltage or light for instance, so that it makes an error.
@term trusted execution environment = Hardware that isolates code and data from the rest of the machine, including its operating system.
@term remote attestation = Cryptographic proof to a remote party of what code is running in protected hardware.

## Concept

### Fundamentals: physical leakage

| Channel | What's measured | Notes |
|---|---|---|
| Timing | How long operations take | Can work remotely |
| Power | Current over time | Needs physical access |
| Electromagnetic | Radiation from a chip | Can work at a small distance |
| Acoustic, thermal | Noise, heat | Mostly research |

[Kocher, Jaffe and Jun](https://www.paulkocher.com/doc/DifferentialPowerAnalysis.pdf) introduced **differential power analysis** in 1999. Transistors draw slightly different power based on the data they switch. Collect many traces, split them by a guess about a key byte, and compare the averages. Only the right guess gives a clear peak. So a key leaks one byte at a time, without any bug in the algorithm.

### Fault injection

Rather than watching, an attacker can disturb a chip: a voltage glitch, a clock spike, an electromagnetic pulse or a laser. A skipped check might bypass secure boot, or a corrupted calculation may reveal a key, as in the Bellcore attack on [RSA](/modules/03-05-rsa-in-depth/). Researchers have glitched many microcontrollers and game consoles this way.

### Countermeasures

Smart cards, and HSMs certified under [FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final) or Common Criteria, use a mix of these.

| Technique | Effect |
|---|---|
| Masking | Randomises intermediate values |
| Hiding | Random delays, balanced logic |
| Redundant checks | Detect skipped instructions |
| Sensors | Detect voltage, light or temperature changes |
| Active shields | Detect probing |
| Zeroisation | Wipes keys on tamper |

Security here is about raising cost, not about absolute guarantees. Assume that a determined lab with the device can eventually extract a key. So **never share one key across all your devices**.

### Advanced: trusted execution environments

Cloud raises a new question: can you compute on a machine that you don't control? **Trusted execution environments** try to answer it.

| Technology | Scope |
|---|---|
| Intel SGX | Small enclaves inside a process |
| AMD SEV-SNP, Intel TDX | Whole confidential VMs |
| Arm TrustZone | Secure world on phones |
| Apple Secure Enclave | Dedicated security processor |

Memory is encrypted, so that the host OS and hypervisor can't read it. **Remote attestation** lets you check what's running before sending secrets: the hardware signs a measurement of the code, with a key rooted in the vendor.

Attacks show the limits. [Foreshadow](https://foreshadowattack.eu/) broke SGX using a speculative execution flaw, and others extracted attestation keys. So TEEs shift trust to the CPU vendor, and side channels remain a serious issue. They're useful for confidential computing in the cloud, as an extra layer, and not as a guarantee.

?? What does differential power analysis exploit?
+ Power use that depends on secret data
- Batteries that store a copy of keys
- Chargers that forward data to the network
- Voltage labels printed on the circuit board
=> Tiny variations in power correlate with data being processed, so statistics can reveal a key.

## Threat model

Physical attacks need the device, equipment and time, so think of stolen tokens, deployed smart meters, payment terminals and consoles. Remote variants exist where timing or software-controlled power features leak. TEE attacks generally need code execution on the host, which is why providers treat them seriously.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| ChipWhisperer | Open hardware for side channels | University labs |
| Oscilloscope | Captures traces | Measurement |
| Gramine, Open Enclave | Run code in enclaves | Trying confidential computing |
| Cloud confidential VMs | SEV-SNP or TDX instances | Practical testing |
| `sgx-ra-sample`-type tools | Show attestation flows | Learning |

## Defence

- **Buy certified hardware** for root keys: HSMs and secure elements.
- **Use unique per-device keys.**
- **Use constant-time and masked implementations** in crypto libraries.
- **Treat attestation as one input,** and check that firmware is up to date.
- **Assume physical access means eventual compromise,** and design the blast radius accordingly.

## Pitfalls

- **"It's encrypted, so it's safe to ship."** With the key in the device, a lab may recover it.
- **"TEE means we needn't trust anyone."** You trust the vendor, its microcode and its key management.
- **Forgetting that a certificate is scoped.** Check what was tested.
- **Skipping attestation.** An enclave you didn't verify proves nothing.
- **Treating FIPS 140 as the whole story.** It validates a module, not how you use it.

?? What does remote attestation prove?
+ Which code runs inside a genuine enclave
- Which employee last logged on to it
- Which country the server's owner lives in
- Which backups were restored on Tuesday night
=> The hardware signs a measurement of the loaded code, so a remote party can check it before sharing secrets.

## Exercise

::: law Lab only
Use only devices you own, in a university lab with supervision where possible. Attacking bank cards, SIMs or other people's hardware is illegal.
:::

1. Read the first sections of the DPA paper, and explain the method in five lines.
2. Simulate it: generate fake power traces in Python, using the Hamming weight of an S-box output plus noise. Recover a key byte by correlation.
3. Add random noise and measure how many more traces you need.
4. If you have access to one, work through ChipWhisperer's first tutorial.
5. Launch a confidential VM on a cloud trial, and read its attestation report.

?! A startup claims that its "secure enclave SaaS means you don't have to trust us". List the questions you'd ask.

## Further reading

- [Differential Power Analysis](https://www.paulkocher.com/doc/DifferentialPowerAnalysis.pdf).
- [FIPS 140-3](https://csrc.nist.gov/pubs/fips/140-3/final).
- [Foreshadow](https://foreshadowattack.eu/).
- [Confidential Computing Consortium](https://confidentialcomputing.io/).
- [ChipWhisperer](https://chipwhisperer.readthedocs.io/).
