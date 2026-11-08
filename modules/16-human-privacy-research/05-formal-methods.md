---
title: Formal methods for security
summary: Proving properties instead of testing for bugs. Protocol verification with ProVerif and Tamarin, design checking with TLA+, verified systems such as seL4, and the limits of a proof.
level: advanced
side: defence
minutes: 45
attack: none
needs: 03-08-tls-internals
pair: 03-08-tls-internals, 16-06-distributed-systems-and-blockchain
source: CyBOK Formal Methods for Security | https://www.cybok.org/knowledgebase1_1/
words: Dolev-Yao model, model checking, theorem proving
---
Testing shows that bugs exist. It can't show that they're absent. Formal methods try to do the second: describe a system mathematically, state a property, and let a tool prove it or produce a counterexample. It sounds academic, yet TLS 1.3, AWS, and parts of the operating systems around you have been shaped by it.

@term Dolev-Yao model = An attacker model in which the adversary controls the network but can't break the cryptography.
@term model checking = Automatically exploring a system's possible states, to check a property or find a counterexample.
@term theorem proving = Building a machine-checked mathematical proof that a property holds.
@term invariant = A property that must stay true in every reachable state.

## Concept

### Fundamentals: what you're doing

There are three parts: a **model** of the system, a **property** you want, and a **method** to check one against the other.

| Property type | Meaning | Example |
|---|---|---|
| Safety | Nothing bad ever happens | A session key never leaks |
| Liveness | Something good eventually happens | A request gets an answer |

| Method | How it works | Trade-off |
|---|---|---|
| Model checking | Explores states automatically | Automatic, limited by state space |
| Theorem proving | Humans guide a proof | Strong, needs experts |
| Symbolic analysis | Treats crypto as perfect | Finds logic flaws, ignores bits |
| Computational proof | Reduces to hard problems | Stronger, harder |

### Verifying protocols

Protocol designers assume the **Dolev-Yao** attacker: it can read, drop, reorder and forge any message, but it can't break primitives. Surprisingly, many short protocols fail against this attacker. The Needham-Schroeder public-key protocol from 1978 was [found flawed in 1995](https://doi.org/10.1016/0020-0190%2895%2900144-2) by Gavin Lowe, using a model checker, 17 years later.

**ProVerif** and **Tamarin** are the main tools. You describe the messages, then ask whether a secret can leak, or whether authentication holds. Tamarin was used in analysing [TLS 1.3 during its design](https://tls13tamarin.github.io/TLS13Tamarin/), and analyses of 5G AKA and WPA2 have used similar methods. So the design changed before deployment.

### Design checking with TLA+

Security bugs often live in concurrency and in failure handling. **TLA+**, by Leslie Lamport, models distributed algorithms. Engineers at [AWS reported](https://cacm.acm.org/research/how-amazon-web-services-uses-formal-methods/) finding subtle design bugs in core services with it, including some that testing had missed. You write the states and transitions, and the TLC model checker tries interleavings that a human would never imagine.

### Advanced: verified systems

Some projects prove the code itself.

| Project | What's proved |
|---|---|
| [seL4](https://sel4.systems/) | A microkernel, with functional correctness down to binary |
| CompCert | A C compiler that preserves meaning |
| HACL*, EverCrypt | Crypto code, used in Firefox and Linux |
| miTLS | A verified TLS implementation |

**AWS** also uses automated reasoning in [Zelkova](https://aws.amazon.com/blogs/security/protect-sensitive-data-in-the-cloud-with-automated-reasoning-zelkova/), to answer questions about IAM policies, such as "can anyone outside this account reach this bucket?"

**A proof is only as good as its assumptions.** It covers the model, not reality. Common gaps are side channels, a wrong specification, and the tool itself. KRACK (2017) attacked WPA2, whose handshake had a security proof: the proof didn't model the state machine that implementations used. So formal methods make you state assumptions, and the attacks then move to what you left out.

?? What does the Dolev-Yao model assume about the attacker?
+ They control the network, not the cryptography
- They can break any cipher with time
- They can only read passing network traffic
- They already hold every party's private key
=> That focus finds logic flaws in protocols: the attacker can do anything to messages, except break the primitives themselves.

## Threat model

Formal methods target design-level threats: flaws that survive code review because each step looks correct alone. They're most valuable for protocols, kernels, crypto and access control, where one mistake is very costly and testing can't reach every path.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Tamarin | Symbolic protocol prover | Key exchange protocols |
| ProVerif | Automatic protocol verifier | Secrecy and authentication |
| TLA+ with TLC | Models concurrent designs | Distributed systems |
| Alloy | Lightweight relational modelling | Access control, data models |
| Coq (Rocq), Isabelle | Interactive theorem provers | Deep proofs |
| Dafny, F* | Verification-aware languages | Verified code |

## Defence

- **Apply it where failure is catastrophic,** rather than everywhere.
- **Start lightweight.** A small TLA+ or Alloy model of the tricky part pays off fast.
- **Use verified components:** libraries such as HACL* give you the benefit, with no need to write proofs.
- **Write assumptions down,** and review them as hard as you review the proof.
- **Combine it with testing and fuzzing,** which reach what the model doesn't.

## Pitfalls

- **"Verified means secure."** Verified against a stated property, under stated assumptions.
- **Modelling the ideal system, not the real one.** Attacks live in that gap.
- **Forgetting side channels.** A symbolic proof says nothing about timing.
- **Over-scoping.** Proving everything takes years. Choose a critical core.
- **Trusting a specification that nobody reviewed.** A proof of the wrong property proves nothing useful.

?? What can a verified protocol model still miss?
+ Bugs in the real implementation of it
- Any logical flaw in the message flow
- Attacks that the model explicitly includes anyway
- Mistakes that the proof tool has checked
=> A proof covers the model. Real code can differ, and memory bugs or timing leaks sit outside it.

## Exercise

::: law Lab only
Model only protocols of your own or textbook ones. No live system is involved.
:::

1. Install TLA+ tools, and work through the first chapters of Lamport's [TLA+ Video Course](https://lamport.azurewebsites.net/video/videos.html) or a tutorial.
2. Model a simple bank transfer between two accounts, with the invariant that total money stays the same. Add concurrency, and let TLC find the race.
3. Install Tamarin, and run the bundled Needham-Schroeder example. Read the attack trace.
4. Fix the protocol as Lowe did, and rerun.
5. Write in plain words what your model assumes, and what it doesn't cover.

?! Choose a security-critical part of a system you've built. Say whether formal methods would be worth it there, and which property you'd try to prove.

## Further reading

- [CyBOK Formal Methods for Security](https://www.cybok.org/knowledgebase1_1/).
- Newcombe and others, [How Amazon Web Services Uses Formal Methods](https://cacm.acm.org/research/how-amazon-web-services-uses-formal-methods/).
- [Tamarin Prover manual](https://tamarin-prover.com/manual/).
- [seL4](https://sel4.systems/).
- Hillel Wayne, [Learn TLA+](https://learntla.com/).
