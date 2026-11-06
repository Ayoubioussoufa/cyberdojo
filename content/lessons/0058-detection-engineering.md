---
title: Detection engineering
summary: The detection lifecycle, reading a Sigma rule line by line, detection as code, tuning false positives, and measuring coverage honestly.
month: 11
minutes: 55
builds: write, test and tune a Sigma rule
source: SigmaHQ, rules and specification | https://github.com/SigmaHQ/sigma
words: detection, Sigma, purple team
---
Alerts don't appear by magic. Someone wrote them, and most of the value in a SOC comes from how well. Detection engineering treats detections as software: written, tested, reviewed and measured. In Month 9 you consumed alerts. Now you make them.

@term detection = Logic that identifies a behaviour in telemetry and raises an alert.
@term Sigma = A generic, vendor-neutral format for writing detection rules.
@term purple team = Attackers and defenders working together to test and improve detections.
@term Atomic Red Team = A library of small, safe tests mapped to ATT&CK techniques.
@term telemetry = The data that systems produce about what they're doing.
@term detection as code = Keeping detections in version control, with reviews and automated tests.
@term coverage = The share of relevant attacker behaviours you can actually detect.

## The lifecycle

@flow Hypothesis > Data source > Logic > Test > Tune > Deploy > Measure

Start from a behaviour, not from a tool. A worked example:

| Step | Example |
|---|---|
| **Hypothesis** | Office applications shouldn't start command shells |
| **Data source** | Sysmon event 1 gives parent and child processes |
| **Logic** | Parent is Word or Excel, and child is `cmd` or `powershell` |
| **Test** | Run a safe simulation. Did the rule fire? |
| **Tune** | Exclude the one signed add-in that does this legitimately |
| **Deploy** | Merge it to the rules repository |
| **Measure** | Track how often it fires, and how often it's right |

If you don't have the data, you can't detect the behaviour. So "do we collect this?" is always the second question.

?? You've written a great hypothesis, but no system logs process command lines. What's your next step?
+ Fix the data gap before writing any logic
- Write the rule anyway and hope it fires
- Mark that technique as covered in your report
- Ask attackers to use a different technique instead
=> A rule over missing data never fires, and it looks exactly like a quiet network. Fix the telemetry first.

## A Sigma rule, line by line

```yaml
title: Office Application Spawning a Shell
id: 3e1f8a52-7c1d-4f6e-9a2b-5d0c7e4b1a11
status: experimental
description: Word or Excel started a command shell.
logsource:
  product: windows
  category: process_creation
detection:
  selection:
    ParentImage|endswith:
      - '\WINWORD.EXE'
      - '\EXCEL.EXE'
    Image|endswith:
      - '\cmd.exe'
      - '\powershell.exe'
  condition: selection
falsepositives:
  - Some legitimate add-ins
level: high
tags:
  - attack.execution
  - attack.t1059.001
```

| Part | Meaning |
|---|---|
| `id` | A stable unique ID, so a rule keeps its identity if it's renamed |
| `status` | How mature it is. `experimental` means not yet proven |
| `logsource` | What data this needs |
| `selection` | The fields to match. Items in a list mean **or**, and separate fields mean **and** |
| `\|endswith` | A modifier: match the end of the value |
| `condition` | How selections combine, such as `selection and not filter` |
| `falsepositives` | What you already know can trigger it |
| `level` | How serious a match is |
| `tags` | The ATT&CK mapping |

[Sigma](https://github.com/SigmaHQ/sigma) is vendor-neutral, so tools convert one rule into your SIEM's language. The [sigma-cli](https://github.com/SigmaHQ/sigma-cli) tool does this with a command like `sigma convert -t splunk rule.yml`.

?? In the rule above, how do the two lists under `selection` combine?
+ Any listed parent, and also any listed child
- Either the parent or the child must match
- Both parents must match at the same time
- The rule matches only when nothing else ran
=> Items in a list are alternatives. Separate fields must all be true. So it needs an Office parent AND a shell child.

## Test it, or it isn't a detection

**Atomic Red Team** provides [small tests per technique](https://github.com/redcanaryco/atomic-red-team). Run one in your lab, then check that your rule fired. When attackers and defenders work this way together, it's called **purple teaming**: red meets blue.

::: law
Run atomic tests only in your own lab, on a snapshot. Read each test before you run it.
:::

::: ai Roadmap exercise
Let an LLM draft ten rules. Test each one, and keep only what fires without flooding you. Report drafted, valid and kept. AI drafts, tests decide.
:::

?? A rule has never fired in six months. What does that tell you?
+ Nothing yet, so test whether it really works
- The attacker has been scared off by it
- The rule is working perfectly, so leave it
- It can safely be counted as full coverage
=> A silent rule may be working, or it may be broken. Only a test tells you which.

## Detection as code

Rules are code, so treat them like code. Keep them in Git, with a review for each change and **CI** that checks them automatically:

@flow Write rule > Open pull request > CI checks syntax and runs tests > Reviewer approves > Convert and deploy

This gives you history (who changed what, and why), peer review, and a safe way to roll back a bad rule. It's the gate for [P08](/projects/P08/): 15 or more rules with test evidence, in a repository with CI.

?? Why keep detections in Git rather than editing them directly in the SIEM?
+ Changes get review, history and easy rollback
- Git makes every rule run much faster
- SIEMs can't store rules on their own
- Attackers can't read rules stored in Git
=> It's the same reason software teams use version control: you can see, review and undo every change.

## Tuning

Noise kills detections. Tune by **context**, not by turning a rule off:

- Exclude a specific, known-good parent and path, not a whole product.
- Give every exclusion a reason and an expiry date.
- Measure precision over time.

?? A rule fires 500 times a day on one signed backup tool. What's the best move?
+ Add a narrow, documented exclusion for it
- Disable the rule until the noise stops
- Raise its severity so people notice it
- Delete the logs from that backup tool
=> A narrow exclusion keeps the coverage. Disabling it makes you blind to the real thing.

## Practise

Write a rule, break it with a new test case, fix it, then measure it. A small tool runs your rule against labelled events, the same way CI would.

@range detect

## Coverage, honestly

An [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) layer can show what you detect. Build it from **test results**, not intentions, and remember that one rule for a technique doesn't mean you've covered it. Most techniques have many variations.

?? A slide shows ATT&CK coverage at 80%, based on rule names. Why be sceptical?
+ Nobody proved those rules fire on attacks
- ATT&CK has no more than ten techniques
- Coverage percentages are banned by the framework
- Eighty percent is the highest score possible
=> A colour on a map isn't evidence. Honest coverage comes from tests, with each variation named.

?! Write the hypothesis, data source and known false positives for a detection of a new service being installed.
