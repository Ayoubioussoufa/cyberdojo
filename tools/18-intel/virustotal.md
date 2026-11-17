---
title: VirusTotal
summary: Checks a file, hash, URL, domain or IP against dozens of antivirus engines and threat data.
side: defence
use: open
docs: https://docs.virustotal.com/
alt: yara, misp, sha256sum
---
## What it's for
VirusTotal, run by Google, scans a file or a URL with around seventy antivirus engines and URL scanners at once, and keeps what the world has seen about it: when it first appeared, its names, what it did in sandboxes, and which domains and addresses relate to it. In triage it answers "is this known to be bad?" in seconds.

## How it works
Every file is identified by its hash, and searching a hash shows the existing report without uploading anything. Uploading a file adds it, contents and all, to VirusTotal's collection, where subscribers to its paid service can search for it and download it. Relations link files to domains, addresses and other files, which helps map a campaign. A free API lets scripts look up hashes, within a small daily quota.

## Try it
```
sha256sum suspicious.bin
curl -s -H "x-apikey: $VT_API_KEY" https://www.virustotal.com/api/v3/files/HASH
```

Look the hash up first, on the website or through the API. Try the hash of the EICAR test file, which every engine flags on purpose: `275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f`.

## What defenders see
Search by hash, and upload only when you're sure the file holds nothing private: an internal document becomes visible to others, and an uploaded targeted sample tells its author it was found. Zero detections doesn't mean safe, since new or targeted malware is often unknown at first. A detection count is a lead, so read which engines fired and what the sandboxes saw, then feed what you learn into [MISP](/tools/misp/) or [YARA](/tools/yara/) rules.

?! A colleague wants to upload a suspicious Word document from the finance team to VirusTotal. What do you suggest they do first, and why?
