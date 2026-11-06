---
title: Detection engineering
summary: The detection lifecycle, Sigma rules, tuning false positives, and measuring coverage honestly.
month: 11
minutes: 40
builds: write, test and tune a Sigma rule
source: SigmaHQ, rules and specification | https://github.com/SigmaHQ/sigma
words: detection, Sigma, purple team
---
Alerts don't appear by magic. Someone wrote them, and most of the value in a SOC comes from how well. Detection engineering treats detections as software: written, tested, reviewed and measured.

@term detection = Logic that identifies a behaviour in telemetry and raises an alert.
@term Sigma = A generic, vendor-neutral format for writing detection rules.
@term purple team = Attackers and defenders working together to test and improve detections.
@term Atomic Red Team = A library of small, safe tests mapped to ATT&CK techniques.
@term telemetry = The data that systems produce about what they're doing.
@term detection as code = Keeping detections in version control, with reviews and automated tests.

## The lifecycle

@flow Hypothesis > Data source > Logic > Test > Tune > Deploy > Measure

Start from a behaviour: "Office applications shouldn't start command shells." Then ask: do I have the data? Sysmon event 1 gives parent and child processes.

## A Sigma rule

```yaml
title: Office Application Spawning a Shell
status: experimental
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
```

[Sigma](https://github.com/SigmaHQ/sigma) is vendor-neutral, and tools convert it into your SIEM's language.

## Test it, or it isn't a detection

**Atomic Red Team** provides [small tests per technique](https://github.com/redcanaryco/atomic-red-team). Run one in your lab, then check that your rule fired.

::: law
Run atomic tests only in your own lab, on a snapshot. Read each test before you run it.
:::

::: ai Roadmap exercise
Let an LLM draft ten rules. Test each one, and keep only what fires without flooding you. Report drafted, valid and kept. AI drafts, tests decide.
:::

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

## Coverage, honestly

An [ATT&CK Navigator](https://mitre-attack.github.io/attack-navigator/) layer can show what you detect. Build it from **test results**, not intentions, and remember that one rule for a technique doesn't mean you've covered it.

?! Write the hypothesis, data source and known false positives for a detection of a new service being installed.
