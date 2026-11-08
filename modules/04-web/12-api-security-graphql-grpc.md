---
title: API security, GraphQL and gRPC
summary: APIs have replaced pages as the main attack surface. Object-level authorisation, GraphQL's cost and field risks, gRPC's trust assumptions, and how to inventory what you expose.
level: intermediate
side: defence
minutes: 45
attack: T1190
needs: 0049-apis-uploads-and-outbound-requests, 0028-apis-and-secrets
pair: 15-04-ios-and-mobile-testing
source: OWASP API Security Top 10 2023 | https://owasp.org/API-Security/editions/2023/en/0x11-t10/
words: BOLA, introspection, shadow API
---
Your mobile app, single-page front end and partners all talk to APIs, and those APIs are a direct line to your data. There's no page layout to hide behind, so attackers just call them. Lesson 49 taught the API Top 10. This module goes further, into design, GraphQL and gRPC, where familiar risks take new shapes.

@term introspection = A GraphQL feature that lets a client ask for the whole schema.
@term shadow API = An API endpoint that's running, but isn't documented or monitored.

## Concept

### Fundamentals: authorisation is the main event

**BOLA** has been first on the [OWASP API list](https://owasp.org/API-Security/editions/2023/en/0x11-t10/) since it began. A client asks for `/orders/1234`, and the server checks that the user's logged in, but not that order 1234 is theirs. Authentication works, whereas authorisation doesn't.

The fix must sit at the object level, on every route, and it should be hard to forget.

```python
order = Order.query.filter_by(id=order_id, owner_id=user.id).first_or_404()
```

Scoping the query by owner makes the safe path the default. Using random IDs helps a little, yet it isn't authorisation. Lesson 48 covered this in depth.

### Other API habits

| Risk | Cause | Fix |
|---|---|---|
| Excessive data exposure | Returning the whole object | Explicit response schemas |
| Mass assignment | Binding all input fields | Allow-list input fields |
| No limits | Unbounded page sizes | Rate limits and quotas |
| Broken function auth | Admin routes open to users | Deny by default |
| Unsafe consumption | Trusting third-party APIs | Validate their responses too |
| Inventory gaps | Old versions still running | Discovery and retirement |

An **inventory** deserves emphasis. `/v1` often lives on after `/v2` ships, with weaker checks. These forgotten **shadow APIs** cause real breaches, and in 2022 Optus reportedly lost customer data through an exposed unauthenticated API.

### GraphQL

GraphQL exposes one endpoint and lets clients shape their own queries. That changes the risks.

| Issue | Why | Control |
|---|---|---|
| Authorisation | Each field can be reached by many paths | Enforce in the business layer, for each resolver |
| Query cost | Deep nesting can be huge | Depth and cost limits |
| Batching and aliases | One request can hold many attempts | Count operations, not requests |
| Introspection | Maps your whole API | Disable in production, if not public |
| Field suggestions | Leak names even when introspection is off | Disable them |

Traditional WAFs and rate limits don't fit well: every request is a `POST` to `/graphql`. **Persisted queries**, in which only pre-approved queries run, remove much of this risk for first-party clients.

### gRPC

gRPC uses HTTP/2 and Protobuf for internal service calls. Binary framing doesn't equal security.

- **TLS isn't automatic.** Use mTLS between services.
- **Authorisation** must happen per method, through interceptors.
- **Server reflection** reveals the API, so turn it off in production.
- **Message size and streaming** need limits.
- **"Internal" isn't a control.** See [Zero Trust](/modules/07-07-zero-trust-in-depth/).

### Advanced: gateways and design

An **API gateway** can centralise authentication, rate limits and logging, yet it can't check object-level rules, as it doesn't know your data. So it complements application checks.

**Schema-first design** with OpenAPI or Protobuf lets you validate requests and responses automatically, then generate tests. **Contract tests** catch accidental exposure of new fields.

?? Where must GraphQL authorisation be enforced?
+ At each resolver, for every field requested
- In the browser's JavaScript, before each query
- In the schema's documentation for all developers
- At the CDN, using a long cache
=> One object can be reached by many query paths, so the check has to sit beside the data.

## Threat model

Attackers read your mobile app or web client to find endpoints, then call them directly to [exploit public applications](https://attack.mitre.org/techniques/T1190/). Automation walks through IDs. Since each call looks valid, abuse often shows up only as unusual volume per user.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| OpenAPI, Schemathesis | Schemas and fuzz testing | Testing your own API |
| Postman, Bruno | Manual requests | Exploring |
| Burp with InQL | Tests GraphQL | Authorised tests, labs |
| `grpcurl` | Calls gRPC | Your own services |
| API gateways | Central control | Production |
| [Web Security Academy](https://portswigger.net/web-security/graphql) | Free labs | Legal practice |

## Defence

- **Check ownership on every object,** with tests for it.
- **Use response schemas.** Never return raw database rows.
- **Allow-list writable fields.**
- **Rate limit per user and per operation,** using cost for GraphQL.
- **Keep an inventory,** and retire old versions.
- **Disable introspection and reflection** where they aren't needed.
- **Use mTLS internally.**
- **Log user, object and action,** so that you can detect enumeration.

**Detection.** One user touching many object IDs in sequence is the classic BOLA signal.

## Pitfalls

- **Hidden means safe.** Obscure endpoints get found.
- **Trusting the mobile app.** Anyone can call the API directly.
- **Authorising in the gateway only.**
- **Returning everything,** and letting the client filter.
- **Rate limiting GraphQL per request.**

?? Why limit GraphQL query depth and cost?
+ Nested queries can exhaust the server cheaply
- Long queries leak each user's stored password
- Deep queries disable TLS on the connection
- Browsers can't parse any long JSON reply
=> One small request can expand into huge amounts of work, so cost must be measured, not just requests counted.

## Exercise

::: law Lab only
Use your own API, or practice targets such as OWASP crAPI and Juice Shop. Don't enumerate IDs on real services.
:::

1. Run [crAPI](https://github.com/OWASP/crAPI) in Docker, and find one BOLA flaw, following its guide.
2. In your own Flask API, scope a query by owner, and write a test showing that another user gets 404.
3. Add a response schema, then show that a new database column isn't exposed.
4. Build a tiny GraphQL server with depth limiting.
5. Run Schemathesis against your OpenAPI spec, and read the failures.

?! You inherit an API with no documentation. How would you build an inventory, and find what's exposed?

## Further reading

- [OWASP API Security Top 10](https://owasp.org/API-Security/editions/2023/en/0x11-t10/).
- [OWASP GraphQL Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/GraphQL_Cheat_Sheet.html).
- [gRPC authentication guide](https://grpc.io/docs/guides/auth/).
- [OWASP crAPI](https://github.com/OWASP/crAPI).
- [Web Security Academy on APIs](https://portswigger.net/web-security/api-testing).
