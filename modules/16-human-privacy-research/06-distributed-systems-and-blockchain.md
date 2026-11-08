---
title: Distributed systems and blockchain security
summary: How machines agree when some of them lie. Byzantine faults, consensus, Sybil resistance, and what smart contract failures teach about code that can't be patched.
level: advanced
side: both
minutes: 45
attack: T1657
needs: 03-04-hash-function-internals, 03-06-diffie-hellman-and-elliptic-curves
pair: 16-05-formal-methods
source: Lamport, Shostak and Pease, The Byzantine Generals Problem | https://lamport.azurewebsites.net/pubs/byz.pdf
words: Byzantine fault, consensus, smart contract
---
A single server can simply be told what's true. Spread that server across many machines, and they must agree, even if some crash, lag or actively lie. That's the hardest problem in distributed systems, and it matters to databases, cloud control planes and cryptocurrencies alike. Blockchains add a further twist: code holding real money that nobody can patch.

@term Byzantine fault = A failure in which a component behaves arbitrarily, including lying differently to different peers.
@term consensus protocol = A method for a group of machines to agree on one value or order of events.
@term Sybil attack = Creating many fake identities to gain influence in an open system.
@term smart contract = A program stored on a blockchain, which runs automatically and is usually immutable.

## Concept

### Fundamentals: failure models

| Model | Behaviour | Example protocols | Nodes for f faults |
|---|---|---|---|
| Crash | Stops, stays silent | Paxos, Raft | `2f + 1` |
| Byzantine | Anything, including lies | PBFT | `3f + 1` |

**Lamport, Shostak and Pease** [showed](https://lamport.azurewebsites.net/pubs/byz.pdf) in 1982 that, without signatures, agreement is impossible when a third or more of the participants are traitors. Most company systems, such as etcd and ZooKeeper, assume crash faults among trusted machines, and use Raft or Paxos. Those are fast, but one compromised member can do real damage. That's why the [Kubernetes etcd store](/modules/10-06-kubernetes-attack-paths/) is such a critical target.

### Open membership

Classic Byzantine protocols need a known list of members. In an open network, one attacker can create thousands of identities, the **Sybil attack**. So participation must cost something scarce.

| Mechanism | Scarce resource |
|---|---|
| Proof of work | Computation and energy |
| Proof of stake | Locked capital |
| Permissioned | Real-world identity |

**Nakamoto consensus**, from Bitcoin's [2008 paper](https://bitcoin.org/bitcoin.pdf), picks the chain with the most accumulated work. An attacker with a majority of hash power can rewrite recent history, called a **51% attack**, which has happened to several smaller coins. The guarantee is probabilistic: a transaction gets safer as blocks are added.

### What a blockchain gives you

It's an append-only log that no single party controls. It doesn't give privacy by default, since transactions are public and pseudonymous. It doesn't make external data true either, an issue known as the **oracle problem**. And it can't protect a private key: lose it and your funds are gone, and steal it and they're yours.

### Advanced: smart contract failures

Contract bugs are special, because code is public, holds money directly, and usually can't be fixed.

| Failure class | Incident | Root cause |
|---|---|---|
| Reentrancy | [The DAO, 2016](https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability) | State updated after an external call |
| Access control | Parity wallet, 2017 | An unprotected initialisation function |
| Oracle manipulation | Many DeFi cases | Trusting a price that can be moved in one transaction |
| Key compromise | Ronin bridge, 2022 | Attackers took over validator keys |
| Bridges | Multiple | Large pools with complex logic |

The Ronin loss of about US$625 million involved no contract bug: the attackers stole keys. The FBI [attributed it](https://www.fbi.gov/news/press-releases/fbi-statement-on-attribution-of-malicious-cyber-activity-posed-by-the-democratic-peoples-republic-of-korea) to North Korean actors. Crypto theft has become a real source of state funding.

The DAO's result also shows a governance lesson: Ethereum's community chose to fork the chain to reverse the theft, which split the network. "Code is law" stopped at the point where people disagreed.

?? How many nodes tolerate `f` Byzantine faults?
+ `3f + 1`
- `2f + 1`
- `f + 1`
- `f + 2`
=> Byzantine agreement needs more than two-thirds honest nodes, whereas crash faults need only a simple majority.

## Threat model

| Threat | Target |
|---|---|
| 51% or stake attacks | Consensus |
| Smart contract flaws | Application logic |
| Key theft | Wallets, bridges, exchanges |
| Phishing and address swapping | Users |
| Cryptojacking | Your servers |

[T1657](https://attack.mitre.org/techniques/T1657/), Financial Theft, covers much of this. In a normal company, the most likely encounter is malware mining on your infrastructure, or ransom payments in cryptocurrency, which are traced by chain analysis.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Slither | Static analysis for Solidity | Reviewing contracts |
| Mythril, Echidna | Symbolic analysis, fuzzing | Finding bugs |
| Foundry | Test framework | Local testing |
| Ethernaut, Damn Vulnerable DeFi | Legal practice games | Learning |
| Block explorers | Read transactions | Investigating |

## Defence

- **Audit before you deploy,** and use tests, fuzzing and formal verification for valuable contracts.
- **Follow checks-effects-interactions,** to stop reentrancy.
- **Use time-locks, pause switches and multi-signature** control, and state their trust trade-offs.
- **Use reputable price oracles** rather than one on-chain pool.
- **Protect keys** in HSMs, with threshold signing.
- **In enterprise systems,** protect your consensus stores as Tier 0.

Ask first whether you need a blockchain at all. A signed database is usually simpler.

## Pitfalls

- **"Immutable means correct."** A bug is immutable as well.
- **"Decentralised means nobody can stop it."** Many projects have few real key holders.
- **"Blockchain data is true."** It's only true that someone wrote it.
- **Assuming audits are guarantees.** Audited projects have been drained.
- **Treating pseudonymity as anonymity.** Transactions can often be traced.

?? What does a Sybil attack rely on?
+ Creating many fake identities at little cost
- Breaking SHA-256 with a quantum computer now
- Stealing every validator's private key at once
- Flooding the network with very large blocks
=> Open systems can't tell one person from many, which is why participation has to cost something real.

## Exercise

::: law Lab only
Work on local test networks, or on practice games such as Ethernaut. Don't interact with real contracts that hold other people's money.
:::

1. Run a three-node Raft cluster using etcd in Docker. Kill the leader, and watch a new election.
2. Kill two of the three nodes. What happens to writes? Why?
3. Play the first five levels of [Ethernaut](https://ethernaut.openzeppelin.com/) on its test network.
4. Write a small vulnerable contract in Foundry that has a reentrancy flaw in your own test. Fix it with checks-effects-interactions.
5. Run Slither on it before and after.

?! A manager proposes a blockchain for sharing supply chain records between four known companies. Write a reply covering what it would give them, and what a simpler design would.

## Further reading

- [The Byzantine Generals Problem](https://lamport.azurewebsites.net/pubs/byz.pdf).
- [Raft](https://raft.github.io/), with an interactive visualisation.
- [Bitcoin paper](https://bitcoin.org/bitcoin.pdf).
- [SWC Registry](https://swcregistry.io/), a list of smart contract weaknesses.
- [CyBOK Distributed Systems Security](https://www.cybok.org/knowledgebase1_1/).
