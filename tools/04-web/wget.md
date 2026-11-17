---
title: wget
summary: Downloads files and whole sites over HTTP, HTTPS and FTP, without a browser.
side: both
use: open
docs: https://www.gnu.org/software/wget/manual/wget.html
alt: curl
---
## What it's for
`wget` fetches files from the web. Where [curl](/tools/curl/) is built to craft one request and show the answer, `wget` is built to download: it resumes broken transfers, retries on its own, and can follow links to copy a whole site.

## How it works
Give it a URL and it saves the response to a file named after the URL's last part. It follows redirects, checks TLS certificates by default, and with `-c` continues a partial download where it stopped. With `-r` (recursive) it reads each HTML page it saves and fetches the links inside, down to the depth you allow, staying on the same host unless told otherwise.

## Try it
```
wget https://example.com/
wget -O page.html https://example.com/
wget -c https://example.com/big.iso
wget --spider https://example.com/
wget -q -O - https://example.com/ | head
```

`--spider` only checks that a page exists, without saving it. `-O -` writes to the screen instead of a file. Download a file, then check it against its published SHA-256 with [sha256sum](/tools/sha256sum/).

## What defenders see
On a server, `wget` or `curl` fetching a script from an unknown address is a classic first step after an intrusion: the attacker downloads their tools. Process logging (auditd on Linux, [Sysmon](/tools/sysmon/) on Windows) records it, and egress rules that stop servers reaching arbitrary sites block it. Never pipe a downloaded script straight into a shell before reading it.

?! A web server's logs show the user `www-data` ran `wget` to an IP address abroad. Why is that alarming, and what do you check next?
