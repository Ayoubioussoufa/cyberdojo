---
title: CALDERA
summary: Runs automated, ATT&CK-based adversary emulation for defenders.
side: defence
use: own
docs: https://caldera.readthedocs.io/
alt: atomic-red-team
---
## What it's for
CALDERA, from MITRE, automates adversary emulation. Where Atomic Red Team runs single tests, CALDERA chains techniques into a sequence that resembles a real intrusion, so you can test detection across a whole attack path.

## How it works
A central server directs agents on test machines through a plan built from ATT&CK techniques. It can chain steps, using what one step learns to choose the next, which produces a realistic sequence rather than isolated actions. This exercises not just single detections but whether your team can follow an intrusion as it moves.

## Try it
::: law Your lab only
Run it only within an isolated lab you own, and understand each ability before you use it.
:::

Set up CALDERA with one agent on a lab VM, run a short built-in operation with your monitoring active, and trace the sequence of techniques in your logs afterwards.

## What defenders see
This supports serious purple-team exercises and tabletop follow-ups. Keep it strictly in a lab, since it's an automation framework for offensive techniques. Use the results to improve detection and response, and to show, with evidence, where the gaps are.

?! What can chaining techniques together test that running each one separately cannot?
