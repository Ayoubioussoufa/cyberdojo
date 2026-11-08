---
title: wafw00f
summary: Detects whether a web application firewall protects a site.
side: both
use: own
docs: https://github.com/EnableSecurity/wafw00f
kali: wafw00f
alt: whatweb, nikto
---
## What it's for
wafw00f identifies a web application firewall in front of a site. It's useful for confirming that your WAF is really in the path.

## How it works
It sends a normal request, then some that look malicious, and compares the replies. Each WAF has signs, such as particular headers, cookies or block pages. It only identifies a WAF. It doesn't test how good one is.

## Try it
::: law Your site only
Use it only on your own site.
:::

```
wafw00f https://example.com
```

If it reports nothing on a site you believe is protected, then check whether traffic is reaching your server directly and bypassing the WAF.

## What defenders see
A few requests carrying attack-like strings appear in WAF logs. If attackers can reach your origin server's address directly, then the WAF is useless, so restrict the origin to accept only your WAF provider's traffic.

?! How can a site behind a cloud WAF still be exposed, and how do you check?
