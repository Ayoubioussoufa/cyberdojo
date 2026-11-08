---
title: Nikto
summary: Checks a web server for dangerous files and outdated software.
side: both
use: own
docs: https://github.com/sullo/nikto/wiki
kali: nikto
alt: nuclei, zap
---
## What it's for
Nikto scans a web server for thousands of known problems: default files, old versions and risky settings. It's old and very noisy, and it's a good quick check of a server you own.

## How it works
It holds a database of known paths and server fingerprints. For each one it makes a request, then checks the response. It makes no attempt to hide, as its purpose is a thorough check. Its results include plenty of informational items, so you need to judge what matters.

## Try it
::: law Lab only
Run it only on your own server.
:::

```
nikto -h http://192.168.56.10:3000 -o report.html -Format htm
```

Read the report, then confirm a finding by hand before you act on it.

## What defenders see
Nikto is one of the noisiest scanners, so it's a great test of your logging and WAF. If you run it on your server and no alert fires, then your monitoring has a gap. Hide version banners, remove default files, and patch.

?! Use Nikto as a detection test. What would you run, and what would you expect to see in your SIEM?
