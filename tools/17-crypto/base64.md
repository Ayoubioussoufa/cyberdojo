---
title: base64
summary: Encodes binary data as plain text, and decodes it back.
side: both
use: open
docs: https://man7.org/linux/man-pages/man1/base64.1.html
alt: cyberchef, xxd
---
## What it's for
Many systems carry only text: email, JSON, HTTP headers, URLs. Base64 turns any bytes into 64 safe characters (letters, digits, `+` and `/`) so they survive the trip. You meet it in basic authentication headers, JWTs, certificates and email attachments, and often in hidden malicious commands.

## How it works
It takes 3 bytes (24 bits) at a time and writes them as 4 characters of 6 bits each, so the output is a third longer than the input, and `=` at the end pads the last group. It's an **encoding**, not encryption: there's no key, and anyone can decode it. The URL-safe variant swaps `+` and `/` for `-` and `_`.

## Try it
```
echo -n 'admin:secret' | base64
echo 'YWRtaW46c2VjcmV0' | base64 -d
base64 -w0 photo.png > photo.txt
echo 'SQBFAFgA' | base64 -d | iconv -f UTF-16LE -t UTF-8
```

The first line produces exactly what an HTTP Basic authentication header carries, which is why Basic authentication without TLS exposes the password. The last line decodes text in PowerShell's UTF-16 format and prints `IEX`.

## What defenders see
Attackers encode commands so they contain no readable keywords: `powershell -EncodedCommand` followed by a long Base64 string is one of the most watched patterns in Windows logging, and decoding it is routine triage, as above. A long Base64 blob in a URL, a DNS name or a log line deserves decoding. [CyberChef](/tools/cyberchef/) chains this with other decodings when one layer hides another.

?! A log line shows `powershell -enc JABzAD0A...`. How do you read it, and why do the decoded bytes look like letters separated by dots?
