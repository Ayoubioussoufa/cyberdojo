---
title: Insecure deserialization
summary: Some data formats can rebuild live objects, and that's what makes them dangerous. Why native serialization leads to code execution, what Log4Shell shared with it, and how to design it out.
level: advanced
side: defence
minutes: 40
attack: T1190
needs: 0049-apis-uploads-and-outbound-requests, 04-03-injection-beyond-sql
pair: 04-03-injection-beyond-sql
source: OWASP Deserialization Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html
words: serialization, gadget chain, data-only format
---
JSON carries data. Formats like Java serialization and Python pickle carry *objects*, which means that reading them can run code. So a blob that looks like harmless bytes in a cookie might control what a server does. CWE-502 is in the 2025 Top 25, and this class caused some of the most serious enterprise flaws of the last decade.

@term serialization = Turning an in-memory object into bytes, to store or send it.
@term gadget chain = A series of existing methods that run in sequence as an object is rebuilt.
@term data-only format = A format, such as JSON, which describes values and can't describe behaviour.

## Concept

### Fundamentals: why rebuilding objects is dangerous

Native serializers aim to restore an object exactly, including its class. To do that, they construct objects from a type named *in the data*, and they may call methods during that process: constructors, `readObject`, `__reduce__`, `__wakeup`. The input therefore chooses which code runs.

| Language | Native mechanism | Note |
|---|---|---|
| Python | `pickle`, `yaml.load` | [The docs warn](https://docs.python.org/3/library/pickle.html) that pickle can run arbitrary code |
| Java | `ObjectInputStream` | The classic case |
| .NET | `BinaryFormatter` | [Microsoft removed it](https://learn.microsoft.com/en-us/dotnet/standard/serialization/binaryformatter-security-guide) in .NET 9 |
| PHP | `unserialize` | Magic methods |
| Ruby | `Marshal` | Similar |

### Gadget chains

An attacker often can't add new code. They don't have to. Your application's libraries already contain thousands of classes. A **gadget chain** links existing methods, so that a crafted object graph triggers a dangerous action when it's rebuilt. Each step is innocent code doing what it's meant to.

So a flaw can exist simply because a library sits on the classpath, even if your own code never uses it. That's what [Frohoff and Lawrence's](https://frohoff.github.io/appseccali-marshalling-pickles/) 2015 research made clear, leading to a wave of Java flaws, including the [Apache Commons Collections](https://nvd.nist.gov/vuln/detail/CVE-2015-7501) issue that affected many products.

### Log4Shell's relation

Log4Shell wasn't classic deserialization, yet it rhymes: a string in a log message triggered a lookup that could load remote data, with code as the result. The shared lesson is that **data processed by a powerful feature can become code**. See [Dependency risk](/modules/13-01-dependency-attacks/).

### Advanced: designing it out

**Use data-only formats.** JSON, or Protobuf, with a schema. They have no way to name a class to run, as long as you don't add polymorphic type features. Jackson's default typing is the classic example of making JSON dangerous again.

**If you can't avoid a native format:**

| Control | Limits |
|---|---|
| Sign the data with HMAC | Works only if the key is safe, and you verify before parsing |
| Class allow-lists | Java's [serialization filters](https://docs.oracle.com/en/java/javase/21/core/serialization-filtering1.html) |
| Remove gadget libraries | You can't remove them all |
| Sandbox the parser | Limits the damage |

**Safe loaders.** `yaml.safe_load` rather than `yaml.load`. For ML models, `safetensors` rather than pickle, as [Adversarial ML](/modules/14-01-adversarial-ml/) explains.

**Where to look.** Base64 blobs in cookies, hidden fields, message queues, caches and internal RPC. "Internal" data isn't safe if an attacker can reach the queue.

?? What's the safest fix for insecure deserialization?
+ Use a data-only format with a schema
- Hide the serialized blob inside a cookie
- Compress the object before sending it back
- Rename the class before every new release
=> A format that can't express objects leaves nothing for an attacker to abuse.

## Threat model

Attackers look for serialized data in anything that a client controls, or in a queue they can write to, then use known gadget chains to [exploit a public application](https://attack.mitre.org/techniques/T1190/). The result is often remote code execution. Internal services are at risk too, if an attacker has already gained a foothold.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Semgrep, CodeQL | Find `pickle.loads`, `ObjectInputStream` | Review |
| Bandit | Flags Python pickle | Python projects |
| Java serialization filters | Allow-list classes | Legacy Java |
| Dependency scanners | Find gadget libraries | Reducing exposure |
| [Web Security Academy](https://portswigger.net/web-security/deserialization) | Free labs | Legal practice |

## Defence

- **Never deserialize untrusted data** with a native format.
- **Replace it** with JSON, plus a schema.
- **Use safe loaders** in YAML and similar.
- **Authenticate data** before parsing, if you must keep a format.
- **Allow-list classes.**
- **Run services with low privilege,** with restricted egress.

**Detection.** Watch for application servers spawning shells, unexpected outbound connections and deserialization errors in logs. Look for `rO0AB` (base64 for Java serialized data) in traffic, as an indicator of where serialization is in use.

## Pitfalls

- **"It's encrypted, so it's safe."** Encryption without authentication doesn't stop tampering, and keys leak.
- **"We don't use those classes."** Gadgets need only be on the classpath.
- **Blocking known gadgets.** New chains appear.
- **Treating internal queues as trusted.**
- **Downloading models or caches as pickles** from strangers.

?? What's a gadget in this context?
+ Existing code that a crafted object reaches
- A small device plugged into a server
- A browser plugin that reads JSON files
- A test account used by the developers
=> Gadgets are ordinary methods in libraries, chained so that rebuilding an object triggers something harmful.

## Exercise

::: law Lab only
Use your own code in a disposable VM, and PortSwigger's labs. Never send serialized test data to a system you don't own.
:::

1. Read Python's warning at the top of the `pickle` docs. Explain it in your own words.
2. Search a project for `pickle`, `yaml.load`, `ObjectInputStream` and `unserialize`.
3. Rewrite a small cache that uses pickle to use JSON with a Pydantic model. Show that malformed data is rejected.
4. Add a Bandit or Semgrep rule to CI.
5. Sign a cookie with HMAC, and show that a changed cookie is rejected before parsing.
6. Complete a Web Security Academy lab on deserialization.

?! An old Java app stores session objects in a cookie, and rewriting it would take months. Write your interim risk reduction plan.

## Further reading

- [OWASP Deserialization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Deserialization_Cheat_Sheet.html).
- [CWE-502](https://cwe.mitre.org/data/definitions/502.html).
- [Marshalling Pickles](https://frohoff.github.io/appseccali-marshalling-pickles/).
- [Microsoft's BinaryFormatter guide](https://learn.microsoft.com/en-us/dotnet/standard/serialization/binaryformatter-security-guide).
- [Web Security Academy on deserialization](https://portswigger.net/web-security/deserialization).
