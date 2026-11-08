---
title: Sherlock
summary: Checks which websites have an account with a given username.
side: both
use: own
docs: https://github.com/sherlock-project/sherlock
kali: sherlock
alt: theharvester
---
## What it's for
People reuse usernames. Sherlock checks hundreds of websites for one name, so an investigator can find someone's other accounts. Fraud investigators, journalists and security teams use it, and so do attackers planning social engineering.

## How it works
Each site has a known profile URL pattern, stored in a JSON file. Sherlock requests each URL and decides whether the account exists from the status code or from text on the page. So it's only as good as those rules, and false positives are common when sites change. A match means that a name exists there, not that it's the same person.

## Try it
::: law Your own name only
Search your own username. Profiling other people can be stalking, harassment or a privacy offence, whatever tool you use.
:::

```
sherlock your_username --print-found
```

See what's there, and close any old accounts.

## What defenders see
A site sees ordinary requests. The defence is personal: use different usernames for separate parts of your life, close old accounts, and add this to staff awareness training, since it's how attackers build believable pretexts.

?! Why can't a Sherlock result alone prove that two accounts belong to one person?
