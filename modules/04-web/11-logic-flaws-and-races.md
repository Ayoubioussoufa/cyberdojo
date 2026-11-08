---
title: Business logic and race conditions
summary: Flaws no scanner can see, because the code works as written. How to find broken assumptions, why concurrency turns one check into a gap, and how transactions close it.
level: advanced
side: defence
minutes: 40
attack: T1657
needs: 0048-access-control-that-holds, 0037-databases-and-sql
pair: 04-10-desync-and-cache-attacks
source: OWASP Web Security Testing Guide, Business Logic Testing | https://owasp.org/www-project-web-security-testing-guide/
words: business logic flaw, race condition, idempotency key
---
A scanner looks for known bad patterns. It can't know that a coupon should work only once, that an order's quantity shouldn't be negative, or that step 3 needs step 2. These flaws live in what the business meant, so finding them takes a person who understands the application.

@term business logic flaw = A weakness in how an application's rules were designed, rather than in a coding pattern.
@term race condition = A bug that depends on the timing of concurrent operations.
@term idempotency key = A unique value that makes repeating a request safe, by ensuring that it only takes effect once.

## Concept

### Fundamentals: assumptions are the attack surface

Developers imagine how a feature gets used. Logic flaws appear when reality differs.

| Assumption | Reality |
|---|---|
| Users follow the steps in order | They can call step 4 directly |
| Quantities are positive | The API accepts `-1` |
| Prices come from our page | The client sends them |
| A coupon is applied once | Nothing stops a second try |
| The discount can't exceed the price | Stacked discounts make it negative |
| A free trial is for new users | An email alias makes another |
| Currency stays the same | Rounding across currencies leaves a profit |

OWASP's **Insecure Design** category sits here: no patch can fix a design that never considered abuse. [Threat modelling](/modules/09-02-threat-modelling-methods/) and abuse cases are the main defence.

### Reviewing for logic

Ask questions like these:

- What's the most valuable action here, and what stops someone doing it twice?
- Can any step be skipped, repeated, or reordered?
- Which values does the client control, that only the server should decide?
- What happens at the limits: zero, negative, huge, or empty?
- What happens to a half-finished process?

### Race conditions

A check and an action aren't one step. If two requests run at once, both can pass the check before either updates the state.

@flow Request A reads balance 100 > Request B reads balance 100 > A spends 100 > B spends 100

That's **TOCTOU** at the application level: time of check, then time of use. It's behind double spending, reusing single-use codes, and beating rate limits. These were thought to be hard to hit over a network until [Smashing the State Machine](https://portswigger.net/research/smashing-the-state-machine) (2023), which showed that requests can be made to arrive nearly at once, reducing timing noise. So treat them as practical.

### Advanced: fixing concurrency

| Technique | How it helps |
|---|---|
| Atomic update | `UPDATE ... SET balance = balance - 100 WHERE balance >= 100` |
| Row locks | `SELECT ... FOR UPDATE` in a transaction |
| Unique constraints | The database refuses a second row |
| Isolation levels | `SERIALIZABLE` catches conflicts |
| Idempotency keys | A repeat of one request has no extra effect |
| Queues | Handle one operation at a time |

Let the database enforce the rule, as a unique index can't be raced. Application-level checks alone can. **Idempotency keys**, as used by [Stripe](https://docs.stripe.com/api/idempotent_requests), also make retries safe, which is good for reliability as well.

**Multi-step state.** Keep workflow state on the server, and check that each step is valid from the current state. Treat the flow as a state machine, with allowed transitions listed.

**Limits and fraud.** Some logic abuse can't be coded away. Monitoring, velocity limits and manual review are valid parts of the design.

?? Why can't scanners find most logic flaws?
+ They don't know what the business intended
- Logic flaws only exist in compiled binaries
- Scanners refuse to test any login page
- Logic flaws appear only on mobile apps
=> The request looks valid, so only someone who knows the rule can tell that the result is wrong.

## Threat model

Attackers include fraudsters, customers gaming a promotion, and insiders. Impact is often direct [financial theft](https://attack.mitre.org/techniques/T1657/). Logic abuse looks like normal traffic, so WAFs don't catch it, and it can run for months.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Threat modelling | Finds assumptions | During design |
| Unit and property tests | Check rules | Each change |
| Burp Repeater and Turbo Intruder | Test sequences and races | Authorised tests, labs |
| Database constraints | Enforce rules | Always |
| Fraud analytics | Spot abuse | Production |
| [Web Security Academy](https://portswigger.net/web-security/race-conditions) | Free labs | Legal practice |

## Defence

- **Compute prices and totals on the server.**
- **Validate ranges** for every number.
- **Model workflows as state machines.**
- **Use transactions and constraints** for anything that counts.
- **Add idempotency keys** to payment-like endpoints.
- **Write abuse cases as tests.**
- **Monitor business metrics:** unusual refunds, coupons, or negative totals.

## Pitfalls

- **Checking in the UI only.**
- **`SELECT` then `UPDATE` with no lock.**
- **Assuming a single server means no races.** Async code and multiple workers interleave.
- **Treating fraud as someone else's job.**
- **Testing only happy paths.** Tests rarely try the same action twice at once.

?? Which control fixes a double-spend race?
+ An atomic database transaction using row locks
- A longer delay before showing the page
- A stronger TLS cipher on the server
- A better error message for all users
=> The check and the update must happen as one indivisible step.

## Exercise

::: law Lab only
Use your own app, and PortSwigger's labs. Abusing a real shop's logic is fraud, whatever you call it.
:::

1. Build a small "redeem coupon" endpoint that checks, then updates. Fire 50 concurrent requests at it with `hey` on your own machine. How many succeed?
2. Fix it with a unique constraint, and repeat.
3. Add an idempotency key to a fake payment endpoint.
4. Write a test that sends a negative quantity.
5. Draw a checkout as a state machine, and reject illegal transitions.
6. Complete a race conditions lab on Web Security Academy.

?! Pick an application that you use. List five assumptions its designers probably made, and how you'd test each in a lab copy.

## Further reading

- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/).
- [Smashing the State Machine](https://portswigger.net/research/smashing-the-state-machine).
- [OWASP A06:2025 Insecure Design](https://top10.owasp.org/2025/A06_2025-Insecure_Design/).
- [Web Security Academy on logic flaws](https://portswigger.net/web-security/logic-flaws).
- Martin Kleppmann, *Designing Data-Intensive Applications*, on isolation levels.
