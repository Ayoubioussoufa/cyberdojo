---
title: Apktool
summary: Unpacks and repacks Android apps to inspect their contents.
side: both
use: own
docs: https://apktool.org/
kali: apktool
alt: mobsf, jadx
---
## What it's for
An Android APK is an archive, but its code and resources are compiled. Apktool decodes them into a readable form, so you can inspect how an app works, then rebuild it. It's a staple of Android analysis.

## How it works
It decodes the app's resources and manifest from their binary form back to readable XML, and disassembles the compiled code into smali, a readable form of the bytecode. You can then study the manifest, the strings and the logic. Rebuilding is used in legitimate research and testing, and understanding it also explains how attackers create tampered copies of apps.

## Try it
::: law Your apps only
Decode apps you own or are authorised to analyse. Repackaging others' apps can breach copyright and law.
:::

```
apktool d app.apk -o app_src
```

Decode a debug build of your own app, read its `AndroidManifest.xml`, and list the permissions it requests. For readable Java, `jadx` decompiles further.

## What defenders see
For defenders, this shows what permissions an app really requests and what it embeds. The ease of repackaging is why app signing matters: a tampered app has a different signature, and checks such as Google Play Integrity exist to catch modified copies. Install apps only from trusted sources.

?! Since any app can be decoded and repackaged, what stops a tampered copy from passing as the real one?
