---
title: Securing AI applications
summary: How LLM apps work, why instructions and data mix, and the architectural defences that hold, measured properly.
month: 18
minutes: 40
builds: a threat model of an AI app, and a defence plan
source: OWASP GenAI Security Project | https://genai.owasp.org/
words: RAG, system prompt, tool calling
---
Everyone is shipping AI features, and someone has to answer "is this safe to ship?" The [LLM security primer](/guides/d2-llm-security-primer/) gave you the theory. This lesson is about building one safely.

@term system prompt = The hidden instructions an operator gives a language model.
@term context window = The amount of text a model can consider at once.
@term RAG (retrieval-augmented generation) = Fetching relevant documents and giving them to a model to answer from.
@term embedding = A list of numbers that represents the meaning of text.
@term tool calling = Letting a model request actions such as searching or sending a message.
@term MCP (Model Context Protocol) = An open protocol connecting AI applications to tools and data.
@term guardrail = A filter that checks a model's inputs or outputs.

## How an LLM app is built

@flow User input > App adds system prompt and retrieved documents > Model > Tool calls or answer > Rendered to user

Each arrow is a place to think about trust. The model sees everything as one stream of text, which is the root of the problem.

## Map the trust

For any AI feature, answer the [trifecta](/guides/d2-llm-security-primer/) questions:

| Question | Example |
|---|---|
| What private data can it reach? | Customer records |
| What untrusted content does it read? | Emails, web pages, uploaded files |
| How can data leave? | Sending mail, rendering images, calling APIs |

If all three are present, you've got a serious design problem, and no prompt will fix it.

?? A support bot reads tickets from the public and can query all customer records. What's the strongest fix?
+ Limit its data access to the user
- Add stronger wording to the system prompt
- Tell customers to behave politely in tickets
- Switch to a model with higher accuracy
=> Authorization outside the model limits the damage whatever the model is persuaded to do.

## Defences by design

- **Scope tools per user and per task.**
- **Enforce authorization in your code,** on each tool call.
- **Require human approval** for consequential actions.
- **Treat retrieved content as data,** never as instructions.
- **Encode model output** before rendering it.
- **Allow-list outbound destinations.**
- **Log every prompt and tool call.**

@drill llm-risk

## Measure, don't hope

Models are non-deterministic. Treat this like testing: define the test cases, run each many times on your own app, and report rates before and after a change. Tools such as [promptfoo](https://www.promptfoo.dev/) put this in CI. Remember the roadmap's rule: a finding isn't a finding until it reproduces.

## Governance

Know the names: [MITRE ATLAS](https://atlas.mitre.org/), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework), ISO/IEC 42001 and the EU AI Act.

::: try Commit to a track
At the end of this month, write your track commitment memo. See [choosing your track](/guides/c2-choosing-your-track/).
:::

?! Pick an AI tool you use. Answer the three trifecta questions for it. What would you change?
