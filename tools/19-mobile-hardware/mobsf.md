---
title: MobSF
summary: Analyses mobile apps for security problems, automatically.
side: both
use: own
docs: https://mobsf.github.io/docs/
aka: Mobile Security Framework
alt: apktool, frida
---
## What it's for
MobSF, the Mobile Security Framework, analyses Android and iOS apps for security issues. Upload an app package and it produces a report covering permissions, secrets, insecure settings and more. It's a common first tool for mobile app assessment.

## How it works
Its static analysis unpacks the app, reads the manifest and code, and flags problems: dangerous permissions, hard-coded keys, weak cryptography, insecure network settings. A dynamic mode runs the app on an instrumented device to watch its behaviour. So it combines, in one place, the checks you'd otherwise run several tools for.

## Try it
::: law Your apps only
Analyse apps you own or are authorised to test.
:::

Run MobSF from its Docker image, upload a deliberately vulnerable practice app such as a test APK, and read the report. Pick one finding, such as a hard-coded key, and locate it in the decompiled code.

## What defenders see
For a developer, running MobSF before release catches common mistakes early. For a defender assessing third-party apps, it reveals what an app does with data and where it sends it. [Android security](/modules/15-03-android-security/) and the mobile testing module give the deeper picture.

?! Why does analysing a mobile app need both a static pass over the code and a dynamic run on a device?
