---
title: Purple Knight
summary: Assesses Active Directory and Entra ID for security weaknesses.
side: defence
use: open
docs: https://www.purple-knight.com/
aka: semperis
alt: pingcastle, bloodhound
---
## What it's for

Purple Knight, from Semperis, is a free assessment tool for Active Directory and Entra ID. Like [PingCastle](/tools/pingcastle/), it scans for known weaknesses and reports them, and it extends the review into cloud identity, which most organisations now run alongside on-premises AD.

## How it works

It runs a large set of indicators of exposure and indicators of compromise across the directory, grouped by category such as account security, delegation and credential hygiene. Each finding comes with an explanation and remediation guidance. Covering both the on-premises directory and the cloud identity service matters, because the two are usually linked, and a weakness in one can reach the other.

## Try it

::: law Your tenant only
Assess a directory and tenant you administer or are authorised to review.
:::

In a lab with AD, and a test Entra tenant if you have one, run Purple Knight and read the categorised findings. Compare them with PingCastle's on the same domain, and note where the two tools agree and differ.

## What defenders see

Use it as a recurring assessment and to brief leadership, since its output is readable. The hybrid coverage makes it especially useful as organisations move to cloud identity, which [hybrid and workload identity](/modules/11-05-hybrid-and-workload-identity/) covers. Fix the indicators of exposure before an attacker finds them, and investigate any indicator of compromise at once.

?! Why does assessing on-premises AD and cloud identity together matter more than checking either alone?
