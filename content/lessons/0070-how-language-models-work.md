---
title: How language models work
summary: From zero: what an LLM really does, tokens, training, context windows, embeddings, RAG, tool calling and agents, and why each one matters for security.
month: 18
minutes: 55
builds: explain an LLM's moving parts, and compute similarity yourself
source: OWASP GenAI Security Project | https://genai.owasp.org/
words: token, embedding, hallucination
---
You can't secure what you don't understand, and most security advice about AI skips the basics. So we start at the bottom. No maths is needed beyond multiplication, and everything here connects to a security decision you'll make later.

@term token = A small piece of text, often part of a word, that a model reads and writes.
@term training = Adjusting a model's internal numbers, using huge amounts of text, so that its predictions improve.
@term inference = Using a trained model to produce an answer.
@term temperature = A setting controlling how much randomness goes into a model's choices.
@term embedding = A list of numbers that represents the meaning of text.
@term vector database = A store that finds text by closeness of meaning, using embeddings.
@term weights = The numbers inside a model, which were set during training.

## A very good guesser

A language model does one thing: **it predicts the next piece of text**. Type "The capital of France is", and it gives high probability to "Paris". It chooses one, adds it, and predicts again. Everything else, from essays to code, is that step repeated.

It has no database of facts that it looks things up in. During **training**, a program fed it enormous amounts of text and adjusted billions of numbers, called **weights**, so its guesses improved. Using it afterwards is called **inference**.

This explains **hallucination**. The model produces what's likely to come next, not what's true. A fake CVE number looks exactly like a real one, because the pattern is right.

?? Why can a model invent a convincing but fake CVE number?
+ It predicts likely text, without ever checking facts
- It secretly reads a database of false CVEs
- Someone at the provider typed that answer in
- Its hard drive has become partly corrupted somehow
=> The pattern of a CVE number is easy to predict. Nothing in that step checks whether it exists, so you must verify.

## Tokens and context

Models don't read letters. They read **tokens**, which are chunks that are often part of a word. As a rough rule for English, 100 tokens is about 75 words. You pay per token, which makes length a cost, and a cost that attackers can run up.

The **context window** is everything the model can see at once: your instructions, the conversation, retrieved documents and tool results. When it's full, something has to be dropped.

Here's the crucial point. **The model keeps no memory between requests.** An app sends the whole conversation each time. So "memory" is really just text that an app chose to include, and anything that can put text there can influence the model.

?? A chatbot "remembers" what you said earlier. How does that really work?
+ The app resends earlier text with each request
- The model permanently learns from every single user
- A human operator keeps notes on the conversation
- The browser's cookies store all the model's thoughts
=> The model itself is stateless during inference. Memory is an application feature, which makes it something an attacker can poison.

## Why the same question gets different answers

At each step, a model has a range of likely next tokens. **Temperature** controls how adventurous its choice is: low stays close to the most likely word, and high takes more chances. Even at low settings, the results may differ from run to run. That's why one test proves little, and why Month 18's rule exists: a finding isn't a finding until it reproduces.

?? An attack works once, and fails on the second try. What's the best explanation?
+ Model output varies, so it needs repeated measurement
- The attack was permanently blocked by the provider
- The first result must be a screen error
- The model noticed the attack and got angry
=> Variation is normal. So you measure a rate across many trials, rather than judging from one attempt.

## Meaning as numbers

An **embedding** turns text into a list of numbers, so that similar meanings get similar numbers. Words like "refund" and "money back" land close together, and "firewall" lands far away. Closeness can be measured, and this is real, working Python:

```python
import math

def cosine(a, b):
    dot = sum(x * y for x, y in zip(a, b))
    size = lambda v: math.sqrt(sum(x * x for x in v))
    return dot / (size(a) * size(b))

refund = [0.9, 0.1, 0.0]
money_back = [0.8, 0.2, 0.1]
firewall = [0.0, 0.1, 0.9]
print(round(cosine(refund, money_back), 2))   # 0.98
print(round(cosine(refund, firewall), 2))     # 0.01
```

Real embeddings have hundreds of numbers, but the idea is the same. A **vector database** stores them, and finds what's closest to a question.

?? Two texts have a cosine similarity of 0.98. What does that suggest?
+ Their meanings are very close to each other
- One of them was copied word for word
- The first text is 98% longer than that
- One of them is certainly written by AI
=> Close vectors mean similar meaning, even with no shared words. That's what makes search by meaning work.

## RAG: giving the model your documents

Models know nothing about your company. **RAG**, retrieval-augmented generation, fixes that without any retraining:

@flow Question > Embed it > Find the closest documents > Paste them into the prompt > Model answers

Read that flow as a defender. Step four **pastes outside text into the prompt**. If a stored document contains instructions, they arrive in the same stream as yours. That's how a poisoned wiki page or a ticket becomes an attack. And if retrieval ignores permissions, one user's question can pull in another user's documents.

?? Why is RAG a security concern as well as a feature?
+ Retrieved text enters the prompt as instructions might
- Retrieval makes the model's weights change every time
- Vector databases can't be stored on any server
- Embeddings always reveal the user's password in plain
=> The model can't tell retrieved data from instructions. So documents become part of your attack surface.

## Tools and agents

A model on its own only produces text. **Tool calling** lets it request actions.

@flow Model says: call lookup_customer with id 42 > Your code decides whether to run it > Result goes back to the model > Model continues

Remember this forever: **the model doesn't run anything. It asks, and your code runs it.** That gap is where security lives, because your code can say no.

An **agent** puts this in a loop: decide, act, look at the result, repeat. Agents are powerful and hard to predict, because each step's output feeds the next. **MCP**, the Model Context Protocol, is a standard for connecting these tools. You'll build a safe loop in [lesson 72](/courses/0072-building-an-agent-safely/).

?? In tool calling, who actually executes the action?
+ The application's code, which can refuse it
- The language model, inside the provider's servers
- The user's web browser, without any involvement
- Nobody, because tool calls are only theatre
=> The model requests, and your program acts. That's the point where authorization must be enforced.

::: try Run one yourself
You can run a small model on your own laptop with [Ollama](https://ollama.com/), free and offline. Try the same question five times, and compare the answers. Then ask it for three CVEs in a product, and check whether they exist. Log what you find.
:::

## Where each piece goes wrong

| Piece | Security question |
|---|---|
| Training data | Could it have been poisoned? |
| Context window | Who can put text in it? |
| Memory | Could yesterday's text attack today's session? |
| Retrieval | Does it respect each user's permissions? |
| Tools | What's the worst thing it could do? |
| Output | Is it treated as untrusted when it's shown or used? |

?! Explain to a friend, in your own words, why a language model isn't a database of facts, and what that means for trusting its answers.

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [3Blue1Brown: neural networks and transformers, visually](https://www.3blue1brown.com/topics/neural-networks)
- [Vaswani et al., Attention Is All You Need (2017)](https://arxiv.org/abs/1706.03762)
