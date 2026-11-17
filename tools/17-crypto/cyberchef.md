---
title: CyberChef
summary: A browser toolbox of hundreds of operations to decode, decrypt and analyse data.
side: defence
use: open
docs: https://gchq.github.io/CyberChef/
alt: base64, xxd
---
## What it's for
CyberChef, published as open source by the UK's GCHQ, calls itself "the Cyber Swiss Army Knife": you paste data, drag in operations such as From Base64, Gunzip, XOR or Extract URLs, and watch the result update. Analysts use it to unwrap disguised scripts, decode traffic and make sense of strange strings.

## How it works
Operations form a *recipe*, applied to the input in order, and each step's output feeds the next, so layers of encoding come off one by one. The **Magic** operation tries likely decodings for you, and a recipe can be saved as a link and shared. It runs entirely in your browser, and you can download it to run offline, which matters when the data is sensitive.

## Try it
Open CyberChef, paste the line below as input, and drag **From Base64** into the recipe. Then try **Magic** on the same input and see whether it finds the same answer.

```
SGVsbG8sIGRlZmVuZGVyIQ==
```

Next, paste an encoded PowerShell command from your lab, add **From Base64** and then **Decode text** with UTF-16LE, and read the command.

## What defenders see
For data from a real incident, use a downloaded copy of CyberChef rather than a website, so nothing sensitive leaves your machine. Recipes make good documentation: save the one that decoded a sample in your incident notes, so others can repeat each step. When the same disguise keeps coming back, turn what you learned into a [YARA](/tools/yara/) rule or a detection.

?! Why should you run CyberChef offline for data from a real incident, when the website version works the same way?
