---
title: Purple teaming
summary: Prove that your detections work, instead of hoping. How red and blue collaborate, how Atomic Red Team and Caldera test coverage, and how to turn results into honest metrics.
level: intermediate
side: defence
minutes: 45
attack: T1059
needs: 0058-detection-engineering, 0056-how-a-pentest-works
pair: 08-02-threat-hunting
source: MITRE Center for Threat-Informed Defense, Adversary Emulation Library | https://github.com/center-for-threat-informed-defense/adversary_emulation_library
words: purple team, adversary emulation, detection coverage
---
A SIEM rule that's never been tested is a guess. Purple teaming replaces the guess with evidence: someone safely performs a technique, the defenders watch what fires, and both sit together to close the gap. It's among the most valuable things a security team can do, and it doesn't need any exotic skill.

@term adversary emulation = Reproducing a known threat group's techniques, in order, to test defences against them.

## Concept

### Fundamentals: three kinds of test

| Exercise | Goal | Who knows | Output |
|---|---|---|---|
| Penetration test | Find vulnerabilities | Usually the defenders | List of findings |
| Red team | Test detection and response | Few people | Whether you'd notice |
| Purple team | Improve detection together | Everyone | Detections that work |

A red team exercise tells you *whether* you missed something, weeks later. A purple session tells you *why*, in minutes, and fixes it the same day.

### The loop

@flow Pick a technique > Run it safely > Check telemetry > Check the alert > Tune or build > Retest

Every test has four possible results, and each needs a different fix.

| Result | Meaning | Next step |
|---|---|---|
| Blocked and alerted | Working well | Keep as a regression test |
| Alerted only | Detection works | Consider prevention |
| Logged, no alert | Data's there | Write the detection |
| Nothing logged | Blind | Fix the telemetry first |

The important distinction is between logged and alerted. Many teams discover they've been collecting the right event for years, with nobody watching it.

### Tools

**[Atomic Red Team](https://github.com/redcanaryco/atomic-red-team)** is a library of small tests, each mapped to an ATT&CK technique, and most can be run from one command. **[Caldera](https://caldera.mitre.org/)**, from MITRE, automates chains of techniques with agents. **[Stratus Red Team](https://github.com/DataDog/stratus-red-team)** does the same for cloud. **VECTR** tracks results over time.

Atomics test one technique, while an **adversary emulation plan** follows a real group's behaviour from start to finish. The [Center for Threat-Informed Defense](https://github.com/center-for-threat-informed-defense/adversary_emulation_library) publishes such plans, based on public intelligence.

### Advanced: running it well

**Choose by threat.** Use threat intelligence to pick the groups that target your sector, then map their techniques. Don't try to cover all of ATT&CK.

**Test procedures, not just techniques.** There are many ways to perform one technique, so one passing test doesn't mean you're covered. That's why lesson 58 calls coverage something to report honestly. Vary the tool and the command line.

**Automate regression.** Detections rot. A log format changes, or a parser update drops a field. Rerun your tests on a schedule, and alert when one stops firing. That's continuous security validation.

**Measure honestly.** Useful numbers include the percentage of tested procedures detected, time to detect, and telemetry gaps closed. A green ATT&CK heat map can mislead, so note the test behind each cell.

**Safety.** Tests run on real systems, so agree a scope. Avoid production at first, have a rollback, run cleanup commands, and tell whoever is on call.

?? What makes purple teaming differ from a normal red team?
+ Both teams work together, testing detections live
- The red team receives no written authorisation
- The blue team is never told anything
- The exercise always targets production customer data
=> Sharing what's being run, and when, means gaps are found and fixed on the spot rather than reported later.

## Threat model

Purple teaming tests your own defences against the behaviours attackers actually use, such as [command interpreters](https://attack.mitre.org/techniques/T1059/). Its main risk is self-inflicted: a test can trip EDR, disrupt a service, or leave a change behind. A second risk is false comfort, when a green dashboard hides shallow tests.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Atomic Red Team | Small technique tests | Getting started |
| Invoke-AtomicRedTeam | Runs atomics and cleanup | Windows testing |
| Caldera | Automated adversary emulation | Testing chains |
| Stratus Red Team | Cloud attack techniques | Testing AWS, Azure, GCP detections |
| VECTR | Tracks campaigns and results | Reporting over time |
| ATT&CK Navigator | Heat maps | Showing coverage |

## Defence

1. **Start with five techniques** that matter to you, and do them well.
2. **Book the people.** A detection engineer and someone who can run the tests, in one room.
3. **Record each test:** what ran, the time, what was expected, what happened.
4. **Fix on the spot** when you can. Add a Sigma rule to version control.
5. **Add it to regression**, so that next quarter proves it still works.
6. **Report by risk,** not by count of tests.

## Pitfalls

- **Testing only one procedure.** A rule for one command line fails on the next.
- **Confusing logged with alerted.** Check that someone actually gets told.
- **Forgetting to clean up.** Atomics create accounts and files.
- **Testing on production on day one.** Start in a lab.
- **Excluding the tester's machine.** An allow-list made for testing can hide real attacks. Keep the setup close to normal.
- **Treating it as a one-off.** Detection decays. Repeat it.

?? An Atomic test runs, and no alert fires. What's next?
+ Check whether the telemetry arrived at all
- Mark that technique as fully covered now
- Delete the test from the test library
- Block the testing tool across the company
=> You need to know which layer failed. If the event never arrived, no rule can help, so fix collection first.

## Exercise

::: law Lab only
Run these tests only in your own lab. Atomic tests really do perform attacker-like actions, so never run them on someone else's system or on production without written approval.
:::

1. Install Sysmon and Invoke-AtomicRedTeam on a Windows lab VM, with a snapshot taken.
2. List the tests for a technique such as [T1053.005](https://attack.mitre.org/techniques/T1053/005/), and read what each does, before running one.
3. Run one test. Find the telemetry in Sysmon or your SIEM, and note the time.
4. Did an alert fire? If not, write a Sigma rule, deploy it, and rerun.
5. Run a second procedure for the same technique. Does your rule catch it?
6. Run the cleanup, and confirm that it worked.
7. Record all this in a simple table: technique, procedure, logged, alerted, fix.

?! Using a threat report for your sector, choose five techniques to test first, and explain each choice. Say how you'd report the results to a non-technical manager.

## Further reading

- [Atomic Red Team](https://github.com/redcanaryco/atomic-red-team).
- [MITRE Caldera](https://caldera.mitre.org/).
- [Adversary Emulation Library](https://github.com/center-for-threat-informed-defense/adversary_emulation_library).
- [ATT&CK Evaluations](https://evals.mitre.org/), to see how products are tested.
- [Stratus Red Team](https://github.com/DataDog/stratus-red-team).
