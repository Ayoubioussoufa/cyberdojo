---
title: Writing IDS rules
summary: From reading a Suricata rule to writing and testing your own. Signature anatomy, performance, false positives, Snort and Suricata differences, and Zeek's different approach.
level: intermediate
side: defence
minutes: 55
attack: T1046, T1095, T1071
needs: 0023-ids-and-network-monitoring, 01-06-packet-analysis-in-depth
pair: 01-01-netcat-and-socat, 01-03-tcp-internals, 01-07-scanning-in-depth
source: Suricata Rules documentation | https://docs.suricata.io/en/latest/rules/index.html
words: signature, flowbits, threshold
---
A network sensor is only as good as its rules. Vendors ship tens of thousands of them, but the alert that catches your specific threat is often one that you write yourself. Lesson 23 taught you to read a rule. Now you'll write, test and tune one, and learn when a signature is the wrong tool altogether.

@term flowbits = Markers set by one rule and read by another, used to detect multi-stage behaviour in a flow.

## Concept

### Fundamentals: anatomy of a rule

```
alert http $HOME_NET any -> $EXTERNAL_NET any (
    msg:"LAB Suspicious user agent seen";
    flow:established,to_server;
    http.user_agent; content:"BadBot/1.0"; nocase;
    classtype:trojan-activity;
    sid:1000001; rev:1;)
```

It's wrapped here to read easily. In a rules file, keep one rule on one line, or end each wrapped line with a backslash.

| Part | Meaning |
|---|---|
| Action | `alert`, or `drop` in IPS mode |
| Protocol | `tcp`, `udp`, or an app layer such as `http`, `tls`, `dns` |
| Header | Source, port, direction, destination, port |
| `msg` | What the analyst reads |
| `flow` | Direction and state, which avoids matching random packets |
| Sticky buffer | `http.user_agent` limits the match to one parsed field |
| `content` | Bytes to match |
| `sid`, `rev` | Unique ID and version. Use 1000000 and up for your own |

Three principles lead to good rules. Match the **most specific buffer**, so that you avoid scanning the whole payload. Use **`flow`**, because a rule that lacks direction is both noisier and slower. And put in a **`metadata`** field with the ATT&CK ID, so an analyst knows why it exists.

### What to match

Go for what the attacker can't change cheaply, as the Pyramid of Pain taught in lesson 53.

| Weak match | Better match |
|---|---|
| One IP address | A protocol anomaly |
| One file hash | A behaviour across the flow |
| A tool's default string | The structure it has to use |

Suricata can also match TLS and DNS fields, such as `tls.sni`, `dns.query`, and JA3 or JA4 where enabled. This still works on encrypted sessions, because the handshake is visible.

```
alert dns $HOME_NET any -> any any (
    msg:"LAB Very long DNS label, possible tunnelling";
    dns.query; content:"."; pcre:"/^[a-z0-9]{40,}\./i";
    threshold:type limit, track by_src, count 1, seconds 60;
    classtype:bad-unknown; sid:1000002; rev:1;)
```

`threshold` limits alert floods, and it's a basic courtesy to whoever reads the queue.

### Stateful detection

`flowbits` let one rule mark a flow and another act on that mark, so you can alert only if a suspicious download follows a suspicious login, on the same flow. Datasets match against large lists of values, such as bad domains. Suricata can also run [Lua scripts](https://docs.suricata.io/en/latest/rules/lua-detection.html) for logic that rules can't express.

### Advanced: performance, Snort, and Zeek

Every packet meets your rules, so a rule's cost matters. The engine picks a **fast pattern**, one content string per rule, and it evaluates the rest only if that matches. So a short or common `content` makes a slow rule. An unanchored `pcre` is expensive: always add a `content` to go with it.

**Snort and Suricata** share a rule language with differences. Suricata has been multi-threaded from the start, parses protocols on any port, and logs rich JSON (EVE). Snort 3 was rewritten, with a multi-threaded design and different syntax in places. Rule sets such as Emerging Threats serve Suricata, and Cisco Talos's serve Snort, and they aren't always interchangeable.

**Zeek** isn't a signature engine. It parses traffic into structured logs and runs scripts on events, so you can ask "show me any host with 100 failed SMB logins". It suits questions about behaviour over time, and it's a very good partner for Suricata. Detection on [long connections](/modules/01-10-proxies-pivoting-and-tunnels/) is one thing that Zeek does more naturally.

| | Suricata or Snort | Zeek |
|---|---|---|
| Model | Match signatures | Log and script events |
| Output | Alerts | Rich connection logs |
| Good at | Known patterns | Behaviour, hunting, forensics |
| Weak at | The unknown | Inline blocking |

?? Why does a rule need `flow:established,to_server`?
+ It limits matching to the relevant direction
- It decrypts the TLS session before matching
- It tells sensors to block the sender
- It raises the priority of each alert
=> It skips packets that can't possibly be relevant, which saves CPU, and it prevents matches on stray or forged packets.

## Threat model

Attackers have three ways around your signatures: **encryption**, **change** (a new string, a new tool) and **evasion** by fragmentation or encoding, as in [the IP layer module](/modules/01-02-ip-layer-and-icmp/). So signatures work best against commodity tools and known behaviours, such as scanning ([T1046](https://attack.mitre.org/techniques/T1046/)), raw-socket shells ([T1095](https://attack.mitre.org/techniques/T1095/)) and application-layer C2 ([T1071](https://attack.mitre.org/techniques/T1071/)). The rest needs metadata and behaviour.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `suricata -T -S rule.rules` | Tests rule syntax | Before any deployment |
| `suricata -r lab.pcap` | Runs rules over a capture | Regression testing |
| `suricata-update` | Manages rule sets | Keeping feeds current |
| Emerging Threats Open | Free rule set | Baseline coverage |
| Zeek, `zeek-cut` | Logs and field extraction | Behaviour questions |
| `tcpreplay` | Replays a capture onto an interface | Load and inline tests |

## Defence

Treat rules like code, as [lesson 58](/courses/0058-detection-engineering/) does for Sigma.

@flow Write the rule > Test on a malicious pcap > Test on clean traffic > Deploy in alert mode > Tune > Consider blocking

- **Keep a pcap with every rule**, as a regression test.
- **Run against clean traffic.** A rule that alerts on an hour of normal traffic isn't ready.
- **Start in alert mode.** Move to `drop` only after a quiet period.
- **Measure.** Suricata's rule profiling shows which rules cost the most.
- **Retire rules** when the threat no longer applies.

## Pitfalls

- **`content` alone with a short string.** It'll match everywhere and slow the engine.
- **Matching case-sensitively on HTTP.** Header names vary, so add `nocase`, or use parsed buffers.
- **Writing rules for one sample.** Attackers change a byte, and your rule is dead.
- **No `threshold`.** An alert storm hides the real problem.
- **Ignoring where the sensor sits.** A sensor behind NAT or a proxy sees different addresses.

?? Which rule design makes the engine work hardest?
+ A lone `pcre` with no `content` anchor
- A `content` limited to the `tls.sni` buffer
- A `dns.query` match on one known domain
- A `flow` keyword with a sticky buffer
=> Without a fast pattern, the regular expression has to run on far more traffic. Anchoring it with `content` filters first.

## Exercise

::: law Lab only
Capture only your own lab traffic. Download sample pcaps from sites made for training, such as Malware-Traffic-Analysis.net, and open them only in an isolated VM.
:::

1. Install Suricata on a lab VM. Use `curl -A "BadBot/1.0"` to generate a request, capture it, and write the rule above.
2. Test it: `suricata -r lab.pcap -S my.rules -l out/`. Read `out/eve.json` with `jq`.
3. Change the user agent's case. Does it still match? Fix the rule.
4. Write a rule that fires on a `nc` session sending the word `password` in clear text to port 49201. Add `flow` and a threshold.
5. Run Zeek on the same pcap, and answer "who talked longest?" using `zeek-cut`.
6. Run your rules on an hour of normal lab traffic, and count the false positives.

?! Choose a threat that you care about. Decide whether a Suricata rule, a Zeek script or a SIEM query is the best tool, and defend that choice.

## Further reading

- [Suricata Rules documentation](https://docs.suricata.io/en/latest/rules/index.html).
- [Suricata performance guide](https://docs.suricata.io/en/latest/performance/index.html).
- [Snort 3 documentation](https://www.snort.org/documents).
- [Zeek documentation](https://docs.zeek.org/en/master/).
- [Malware-Traffic-Analysis.net](https://www.malware-traffic-analysis.net/), for practice captures.
