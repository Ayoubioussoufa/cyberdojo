---
title: sqlmap
summary: Automates finding and exploiting SQL injection.
side: attack
use: know
docs: https://github.com/sqlmapproject/sqlmap/wiki
kali: sqlmap
alt: burp-suite, zap
---
## What it's for
sqlmap is the best-known SQL injection tool, and it's in Kali's top 10. Testers use it to confirm a flaw during an authorised assessment, and attackers use it to pull data from vulnerable sites.

## How it works
It sends many variations of a request, then compares responses to infer how the database reacts. Depending on the app, it may use visible errors, changes in page content, or differences in response time. Given a real flaw, it then works out the database type and reads its structure. The underlying problem is mixing user data with query text, and [SQL injection in depth](/modules/04-02-sql-injection-in-depth/) explains it.

## Practise safely
Learn the flaw by hand first, in [PortSwigger's free SQL injection labs](https://portswigger.net/web-security/sql-injection), which are built for that. If you use sqlmap, do it only on lab targets you run yourself, such as DVWA in a VM, or inside those labs where allowed. Then fix the lab's code with a parameterised query, and show that the flaw has gone.

## What defenders see
It's noisy. Logs show hundreds of requests to one parameter with SQL keywords, and time-based tests appear as many slow responses. The default user agent names the tool. WAF rules help, and the real fix is parameterised queries, plus a database account with few privileges.

?! A WAF blocks sqlmap's default requests. Why is the application still at risk, and what's the proper fix?
