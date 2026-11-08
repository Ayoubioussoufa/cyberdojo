---
title: Atomic Red Team
summary: Small, scripted tests mapped to ATT&CK, to check your detection.
side: defence
use: own
docs: https://www.atomicredteam.io/
alt: caldera, sigma
---
## What it's for
You've written detection rules, but do they fire? Atomic Red Team, from Red Canary, is a library of small, well-documented tests, each matching an ATT&CK technique, so you can safely trigger a behaviour and check that you catch it.

## How it works
Each "atomic" is a precise, minimal action for one technique, such as creating a scheduled task for persistence, with exact commands and cleanup steps. You run one on a test machine and confirm your monitoring recorded it. This is the heart of [purple teaming](/modules/08-03-purple-teaming/): test one technique, find the gap, improve the detection, repeat.

## Try it
::: law Your lab only
Run these only on test machines you own, read each test first, and run the cleanup afterwards.
:::

Pick an atomic for a technique you believe you detect, run it on a lab host with your monitoring on, and confirm the alert. If nothing fires, you've found a gap worth fixing.

## What defenders see
This is a defender's tool for measuring coverage honestly. Work technique by technique, record which ones you detect, and map the results against ATT&CK to see your blind spots. It makes detection engineering a measurable practice rather than a hopeful one.

?! Why is actually triggering a technique a better test of your detection than reviewing the rule by hand?
