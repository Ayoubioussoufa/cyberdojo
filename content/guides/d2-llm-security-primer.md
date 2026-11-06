---
title: LLM and agent security primer
summary: Why prompt injection is so hard, the lethal trifecta, the defences that hold, and how AI red teaming is really done.
group: Working with AI
minutes: 12
source: Simon Willison's writing on prompt injection, the clearest running analysis | https://simonwillison.net/tags/prompt-injection/
---
You'll study this hands-on in [Month 18](/roadmap/18/). This guide gives you the mental model, so you see the risks from your first week of using AI tools.

@term LLM (language model) = An AI model that predicts text, trained on huge amounts of writing.
@term prompt injection = Hiding instructions in text an AI will read, so that it follows the attacker instead of its operator.
@term lethal trifecta = The dangerous combination in an AI system: access to private data, exposure to untrusted content, and a way to send data out.

## Why prompt injection is hard

A language model gets its instructions and its data through **the same channel**. Any content it reads, whether a web page, an email, a PDF, a code comment or a tool result, can contain instructions, and the model has no reliable way to tell "what my operator said" from "what this document said". This isn't a bug to patch. It's how these systems work today. Filters reduce success rates; they don't remove the class.

## The lethal trifecta

[Simon Willison's formulation](https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/): a system is exposed to serious data theft when it combines three things.

@flow Access to private data > Exposure to untrusted content > A way to communicate outwards

Remove any one leg and the attack collapses: scope down the data, isolate the untrusted content, or block the way out. It's the single most useful design rule you can carry into a job.

?? An email assistant reads your inbox and can send mail. Which change best breaks the trifecta?
+ Require human approval for every single outbound email
- Add a sterner warning to its system prompt
- Train it to politely refuse all suspicious emails
- Switch to a newer model with better guardrails
=> Blocking the outward channel removes a leg of the trifecta. Better wording and filters only lower the odds of success.

## The two lists to know by name

| OWASP Top 10 for LLM Applications (2025) | OWASP Top 10 for Agentic Applications (Dec 2025) |
|---|---|
| LLM01 Prompt injection | ASI01 Agent goal hijack |
| LLM02 Sensitive information disclosure | ASI02 Tool misuse and exploitation |
| LLM03 Supply chain | ASI03 Identity and privilege abuse |
| LLM04 Data and model poisoning | ASI04 Agentic supply chain |
| LLM05 Improper output handling | ASI05 Unexpected code execution |
| LLM06 Excessive agency | ASI06 Memory and context poisoning |
| LLM07 System prompt leakage | ASI07 Insecure inter-agent communication |
| LLM08 Vector and embedding weaknesses | ASI08 Cascading failures |
| LLM09 Misinformation | ASI09 Human–agent trust exploitation |
| LLM10 Unbounded consumption | ASI10 Rogue agents |

## Defences that actually hold

- **Least-privilege tools.** An agent's blast radius equals every credential, API and dataset its tools can reach. Scope per user and per task.
- **Authorization outside the model.** Never let the model decide who may do what. Enforce permissions in the application, on every tool call.
- **Human approval** for consequential actions, showing enough context for the approval to mean something.
- **Isolate untrusted content.** Retrieved documents and tool output are data, never instructions.
- **Treat model output as untrusted input.** Encode it, validate it, and never render raw HTML or run generated code without a sandbox.
- **Egress control.** Allow-list outbound domains and disable automatic image or link fetching, the classic exfiltration channel.
- **Supply-chain hygiene.** Pin and verify models and datasets, and check that suggested packages actually exist.
- **Observability.** Log every prompt, tool call and result. Most organisations can't answer "what did the agent do last Tuesday?"
- **Guardrails as defence in depth,** never the primary control: they're probabilistic filters in front of a probabilistic system.
- **Evaluations in CI.** Attack suites on every change, with tracked success rates.

@term blast radius = How much damage is possible if one account, key or tool is compromised.

## Frameworks to read once

[MITRE ATLAS](https://atlas.mitre.org/) (attacks on AI, structured like ATT&CK), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) and its generative-AI profile, [OWASP GenAI](https://genai.owasp.org/), [Google SAIF](https://saif.google/), ISO/IEC 42001 and the EU AI Act.

## How AI red teaming is done

"AI red teaming" covers two jobs. **Safety testing** looks for harmful or policy-violating output. **Security testing** looks for attacker-controlled behaviour: data theft, unauthorised actions, privilege abuse. Say which one you're doing: confusing them loses credibility fast.

| Step | What you do | Output |
|---|---|---|
| 1 · Understand | Map what the model reads, which tools it calls, whose permissions it uses, where output renders | Diagram + trust boundaries |
| 2 · Threat model | STRIDE plus ATLAS/OWASP lists; rank by blast radius, not cleverness | Prioritised abuse cases |
| 3 · Manual probing | Direct and indirect injection, prompt extraction, tool misuse, memory poisoning | Reproducible attack cases |
| 4 · Automated probing | garak, PyRIT or promptfoo for coverage and regression | Attack suite in CI |
| 5 · Measure | Run each case 10+ times, because models are non-deterministic | Metrics table |
| 6 · Report and retest | Severity by impact; fixes that change architecture, not wording | Before/after numbers |

Practice grounds: [Gandalf](https://gandalf.lakera.ai/), [PortSwigger's Web LLM attacks](https://portswigger.net/web-security/llm-attacks), Dreadnode Crucible, the HTB AI Red Teamer path, and best of all, an app you built yourself.

?? Why must an AI attack be run ten or more times before you report it?
+ Model behaviour varies, so one success proves little
- Models need repeated runs before they will answer
- Vendors only accept findings tested exactly ten times
- Each new run makes attacks work more often
=> Models are non-deterministic. A finding needs its exact input, the success rate over N trials, and the conditions.

?! In your own words, why doesn't a better system prompt fix prompt injection?
