---
title: Hydra and the online guessers
summary: Tools that guess logins against live services, and the controls that stop them.
side: both
use: know
docs: https://github.com/vanhauser-thc/thc-hydra
kali: hydra
aka: thc-hydra
alt: medusa, ncrack
---
## What it's for

Hydra, and the similar Medusa and Ncrack, guess credentials against live services such as SSH, web logins, databases and remote desktop. Unlike the offline tools, these talk to a running service, so the defender can see and stop them. Studying them shows exactly which controls defeat online guessing, which is one of the most common routes into an organisation.

## How it works

The tool connects to a service and tries username and password combinations, one after another, watching for a successful response. It's limited by the service's speed and by any protections in front of it, which is the important point: every guess is a real login attempt that your systems can observe, rate-limit and block. Where offline cracking is invisible, online guessing is noisy by nature.

## Practise safely

Study the defences on your own services. On a lab SSH server or web app, turn on account lockout, rate limiting and [Fail2ban](/tools/fail2ban/), then watch in the logs how repeated failed logins are slowed and blocked. The instructive exercise is to confirm that key-only SSH, or multi-factor on a web login, makes password guessing pointless regardless of how many attempts are made.

## What defenders see

Online guessing is one of the clearest things to detect: many failed logins for one account or from one source, in a short time. Defences stack well: multi-factor authentication, which makes a guessed password insufficient; account lockout and rate limiting; key-only SSH; blocking breached and default passwords; and alerting on failed-login bursts. A single success after many failures, a classic sign of a hit, deserves immediate investigation. [Authentication mechanics](/modules/11-02-authentication-mechanics/) and the SIEM material cover both the controls and the detection.

?! Online guessing is noisy and offline cracking is silent. How does that difference change where you put your defensive effort for each?
