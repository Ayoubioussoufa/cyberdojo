---
title: Microarchitectural security
summary: When the processor itself leaks. Caches, speculative execution, Spectre, Meltdown and Rowhammer explained as design trade-offs, with the mitigations that cost us real performance.
level: advanced
side: defence
minutes: 45
attack: none
needs: 0030-how-operating-systems-work, 03-09-breaking-bad-crypto
pair: 15-07-hardware-attacks-and-tees
source: Spectre and Meltdown attack papers | https://meltdownattack.com/
words: speculative execution, cache timing, Rowhammer
---
For decades, software security assumed that hardware does what the manual says. In January 2018, that assumption broke. Researchers showed that the tricks making CPUs fast could leak secrets across isolation boundaries that all of computing relied on. The lesson goes beyond any one bug: performance optimisations can become security flaws.

@term speculative execution = A processor running instructions before it knows they're needed, then discarding them if it guessed wrong.
@term cache side channel = Learning about another program's memory use from the time memory accesses take.
@term Rowhammer = A DRAM flaw in which repeatedly accessing one row can flip bits in neighbouring rows.
@term KPTI (kernel page-table isolation) = A Linux defence that removes most kernel mappings while user code runs.

## Concept

### Fundamentals: an abstraction with holes

The architecture is the contract: instructions and their results. The **microarchitecture** is how a chip delivers it: caches, branch predictors, out-of-order execution. Software shouldn't be able to see those details. Yet timing reveals them.

A **cache** keeps recently used memory close by, so a hit is much faster than a miss. An attacker who shares a cache can measure timing to learn what memory someone else touched. This is the basic channel behind most of what follows.

### Speculation

Modern CPUs guess where a branch will go, and race ahead. If the guess is wrong, they roll back the *architectural* state. But the **cache isn't rolled back**. So work that "never happened" leaves a footprint.

**Spectre** (CVE-2017-5753 and CVE-2017-5715) trains the branch predictor, so that a victim speculatively reads memory that it shouldn't, then leaves a trace in the cache. It crosses boundaries inside one process too, which was especially bad for browsers running untrusted JavaScript.

**Meltdown** (CVE-2017-5754) exploited a specific behaviour on many Intel chips, in which a permission check happened too late, letting kernel memory influence the cache before the fault.

The two differ. Meltdown was largely fixable in software. Spectre is a **class** that comes from speculation itself. Google's engineers [argued](https://arxiv.org/abs/1902.05178) that Spectre can't be fully removed by software alone.

### The aftermath

Many related flaws followed, including L1TF, MDS, Zenbleed, Downfall and Inception. Vendors changed designs, and microcode updates continue to this day.

| Mitigation | Addresses | Cost |
|---|---|---|
| KPTI | Meltdown | Slower system calls |
| Retpoline | Spectre variant 2 | Slower indirect branches |
| IBRS, STIBP, eIBRS | Branch predictor isolation | Varies |
| Microcode updates | Many | Varies |
| Site isolation in browsers | Spectre in JavaScript | Memory |
| Disabling SMT | Sibling-thread leaks | Throughput |

### Advanced: Rowhammer

DRAM stores bits as charge in tiny cells, packed so tightly that activity disturbs neighbours. [Kim and others](https://users.ece.cmu.edu/~yoonguk/papers/kim-isca14.pdf) showed in 2014 that repeatedly activating a row can flip bits nearby. Researchers later turned this into [privilege escalation](https://googleprojectzero.blogspot.com/2015/03/exploiting-dram-rowhammer-bug-to-gain.html). Target Row Refresh was meant to stop this, yet variants defeated it in DDR4. ECC memory helps, though it isn't a complete answer.

It's a reliability bug turned into a security bug. Software assumed that memory is exact, and every security boundary above it inherited that assumption.

### Cloud implications

Public cloud places strangers on the same hardware. Providers respond with core scheduling, fast microcode rollout, and custom isolation hardware. For sensitive workloads, **dedicated hosts** reduce shared-hardware risk.

?? Why did Spectre need hardware and software fixes?
+ Speculation is a design feature of CPUs
- Its bug sat in one browser's code
- Its cause was an expired CPU certificate
- Its effects appeared only on hard disks
=> Speculation is core to performance, so patches narrow the leak, while real fixes need changes to hardware design.

## Threat model

These attacks need code running on the same machine, or a shared environment, such as cloud, browser or shared hosting. Ordinary organisations see them rarely compared with phishing, yet the risk is higher in multi-tenant systems. The usual attack path isn't complicated: leaving a host unpatched for known issues. ATT&CK has no specific technique, which is why this module says none.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `lscpu`, `/sys/devices/system/cpu/vulnerabilities/` | Lists mitigation status | Checking a Linux host |
| `spectre-meltdown-checker` | Audits a system | Verifying patches |
| `perf` | Counts cache events | Performance research |
| Hypervisor settings | Core scheduling | Multi-tenant hosts |

## Defence

- **Keep microcode, kernels and browsers patched.**
- **Don't disable mitigations casually** to gain speed.
- **Consider dedicated hosts** for the most sensitive workloads.
- **Use constant-time crypto,** with no secret-dependent branches or lookups.
- **Choose ECC memory** for servers.
- **Isolate untrusted code** at the process or VM level, not just by language sandbox.

## Pitfalls

- **"Software bugs only."** Hardware has bugs that software must work around.
- **"Patched means gone."** Mitigations narrow the channel, and new variants keep emerging.
- **"This is only a cloud issue."** A browser runs untrusted code on your laptop.
- **Quoting benchmark costs as universal.** They vary by workload.
- **Assuming physical memory is reliable.** Rowhammer disproved that.

?? What is the Rowhammer effect?
+ Repeated row access flips bits in neighbours
- Constant disk writes wear out one sector
- Excess network packets overheat the CPU die
- Loud sounds damage a spinning hard drive
=> Rapid activation disturbs nearby DRAM cells, changing data without any software permission check.

## Exercise

::: law Lab only
Only run these on your own machine. Don't run proof-of-concept hardware attacks on shared or cloud systems, since they can affect other tenants, and break provider terms.
:::

1. Run `grep . /sys/devices/system/cpu/vulnerabilities/*` on a Linux machine, and explain three lines.
2. In C or Python on your own machine, time access to a cached and an uncached array element. Plot the two distributions.
3. Run `spectre-meltdown-checker`, and read its report.
4. Check a browser's `chrome://process-internals` for site isolation.
5. Read section 1 and the conclusion of the Spectre paper.

?! Your finance team asks whether to move a key-signing service from shared cloud to dedicated hosts. Give a recommendation, and say what risk you're actually paying to reduce.

## Further reading

- [Spectre and Meltdown](https://meltdownattack.com/).
- [Spectre is here to stay](https://arxiv.org/abs/1902.05178), an analysis from Google.
- [Project Zero on Rowhammer](https://googleprojectzero.blogspot.com/2015/03/exploiting-dram-rowhammer-bug-to-gain.html).
- [Linux kernel's hardware vulnerabilities docs](https://docs.kernel.org/admin-guide/hw-vuln/index.html).
- [CyBOK Hardware Security](https://www.cybok.org/knowledgebase1_1/).
