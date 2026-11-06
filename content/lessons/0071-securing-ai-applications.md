---
title: Securing AI applications
summary: How LLM apps are built, why instructions and data mix, the lethal trifecta in real incidents, and the architectural defences that hold, measured properly.
month: 18
minutes: 60
builds: a threat model of an AI app, and a defence plan
source: OWASP GenAI Security Project | https://genai.owasp.org/
words: RAG, system prompt, tool calling
---
Everyone is shipping AI features, and someone has to answer "is this safe to ship?" [Lesson 70](/courses/0070-how-language-models-work/) showed you how the model works, and the [LLM security primer](/guides/d2-llm-security-primer/) gave you the theory. This lesson is about building one safely.

@term system prompt = The hidden instructions an operator gives a language model.
@term context window = The amount of text a model can consider at once.
@term RAG (retrieval-augmented generation) = Fetching relevant documents and giving them to a model to answer from.
@term tool calling = Letting a model request actions such as searching or sending a message.
@term MCP (Model Context Protocol) = An open protocol connecting AI applications to tools and data.
@term guardrail = A filter that checks a model's inputs or outputs.
@term direct prompt injection = A user typing instructions meant to override the system's rules.
@term indirect prompt injection = Instructions hidden in content that the model reads, such as a web page or a ticket.
@term excessive agency = Giving an AI system more power than its task needs.

## How an LLM app is built

@flow User input > App adds system prompt and retrieved documents > Model > Tool calls or answer > Rendered to user

Each arrow is a place to think about trust. The model sees everything as one stream of text, which is the root of the problem.

Compare it with a database. In Month 6 you learned that a parameterised query keeps code and data separate, so input can't become a command. **Language models have no equivalent.** Your instructions and an attacker's text arrive in the same stream, and the model can't reliably tell them apart. That's why prompt injection isn't a bug that one patch will close.

?? Why can't prompt injection simply be fixed the way SQL injection was?
+ Models have no separate channel for their instructions
- Language models are written in an unsafe language
- Nobody has tried to filter the input yet
- Prompts are always encrypted before reaching the model
=> SQL got parameters: a hard split between code and data. A model reads everything as text, so there's no such split to enforce.

## Direct and indirect

| Type | Who writes it | Example |
|---|---|---|
| **Direct** | The user | Telling a chatbot to ignore its rules |
| **Indirect** | A third party | A web page, ticket or PDF the assistant later reads |

Indirect is the dangerous one. The victim is using the assistant normally, and the attacker never touched it. In 2025, [EchoLeak (CVE-2025-32711)](https://msrc.microsoft.com/update-guide/vulnerability/CVE-2025-32711) showed this pattern at scale: a crafted email could make an AI assistant leak data, with no click from the user.

?? A summariser reads a web page containing hidden text that tells it to reveal the user's notes. Which type is that?
+ Indirect, because a third party wrote it
- Direct, because the user opened the page
- Neither, because web pages can't hold text
- Direct, because the model read the instruction
=> The instruction came from content, not the user. That's what makes it so hard to spot.

## Map the trust

For any AI feature, answer the [trifecta](/guides/d2-llm-security-primer/) questions:

| Question | Example |
|---|---|
| What private data can it reach? | Customer records |
| What untrusted content does it read? | Emails, web pages, uploaded files |
| How can data leave? | Sending mail, rendering images, calling APIs |

If all three are present, you've got a serious design problem, and no prompt will fix it. Don't forget quiet exits: a model that outputs a markdown image makes the browser fetch a URL, and that URL can carry data.

@drill trifecta

?? A support bot reads tickets from the public and can query all customer records. What's the strongest fix?
+ Limit its data access to the user
- Add stronger wording to the system prompt
- Tell customers to behave politely in tickets
- Switch to a model with higher accuracy
=> Authorization outside the model limits the damage whatever the model is persuaded to do.

## Defences by design

- **Scope tools per user and per task.** A bot that reads one customer's order shouldn't hold a tool that reads all of them.
- **Enforce authorization in your code,** on each tool call. The model asks, your code decides.
- **Require human approval** for consequential actions.
- **Treat retrieved content as data,** never as instructions.
- **Encode model output** before rendering it.
- **Allow-list outbound destinations.**
- **Log every prompt and tool call.**

Notice that none of these depend on the model behaving. **Guardrails** help as an extra layer, but anything that filters text can be bypassed by rewording. Assume the model will be fooled, and limit what happens next.

@drill llm-risk

?? Which control still works even if an attacker fully controls the model's output?
+ A permission check in code per call
- A firmly worded rule in a prompt
- A request that the model stay honest
- A filter that looks for suspicious sentences
=> Code outside the model doesn't negotiate. That's the test of a real control.

## Investigate one

An assistant sent an email nobody asked for. Find out what happened from its logs.

@range aiops

## Measure, don't hope

Models are non-deterministic. Treat this like testing: define the test cases, run each many times on your own app, and report rates before and after a change. Tools such as [promptfoo](https://www.promptfoo.dev/) put this in CI. Remember the roadmap's rule: a finding isn't a finding until it reproduces.

?? An attack worked once in one attempt. What should your report say?
+ Nothing final, until it repeats over many trials
- That the system is proven broken for everyone
- That the model is safe, as it's rare
- That the attack is impossible to ever repeat
=> Models vary between runs. A success rate over N trials, with the exact conditions, is what makes it a finding.

## Governance

Know the names: [MITRE ATLAS](https://atlas.mitre.org/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), ISO/IEC 42001 and the EU AI Act.

| Name | What it is |
|---|---|
| OWASP LLM Top 10 (2025) | The common risks in LLM applications |
| OWASP Agentic Top 10 (Dec 2025) | The risks specific to agents |
| MITRE ATLAS | ATT&CK-style knowledge base for attacks on AI |
| NIST AI RMF | A voluntary framework for managing AI risk |
| ISO/IEC 42001 | A certifiable AI management system standard |
| EU AI Act | EU law setting duties according to AI risk |

::: try Commit to a track
At the end of this month, write your track commitment memo. See [choosing your track](/guides/c2-choosing-your-track/). Then fix a real system on the [Parrot machine](/machines/parrot/).
:::

?! Pick an AI tool you use. Answer the three trifecta questions for it. What would you change?
