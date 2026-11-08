---
title: BloodHound
summary: Maps the hidden paths through an Active Directory that lead to full control.
side: both
use: know
docs: https://bloodhound.readthedocs.io/
aka: sharphound
alt: pingcastle, purple-knight
---
## What it's for

BloodHound reveals something administrators rarely see: the chains of permissions and sessions that let one ordinary account reach domain-wide control. Attackers use it to find the shortest path to the top; defenders use it to find and cut those same paths first. Learning to read its graphs is a genuinely valuable blue-team skill.

## How it works

A collector gathers data from the directory, such as group memberships, permissions, and where users are logged in. BloodHound loads this into a graph database and draws the relationships, then answers questions like "what's the shortest path from this account to a domain administrator?" The insight is that control in AD is transitive: a harmless-looking permission, chained through others, can lead somewhere dangerous, and only a graph makes that visible.

## Practise safely

::: law Your domain only
Collect from a domain you administer or are authorised to assess. The collection generates directory queries, so treat it as an assessment activity with permission.
:::

In a lab domain, run the collection, load it into BloodHound, and explore the paths to high privilege. The defensive exercise is to pick one path and work out which single permission or group membership to remove to break it.

## What defenders see

Used defensively, BloodHound turns AD hardening from guesswork into graph analysis: find the paths, cut the riskiest edges, and re-run to confirm. The collection itself is detectable as a burst of directory queries, which is worth alerting on when it comes from an unexpected host. [Windows defences](/modules/02-09-windows-defences/) and the identity modules cover reducing these paths.

?! Why does control in Active Directory need a graph to understand, rather than a list of who's an administrator?
