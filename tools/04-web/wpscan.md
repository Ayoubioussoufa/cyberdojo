---
title: WPScan
summary: Audits WordPress sites for vulnerable plugins and weak settings.
side: both
use: own
docs: https://github.com/wpscanteam/wpscan/wiki
kali: wpscan
alt: nikto, nuclei
---
## What it's for
WordPress runs a large part of the web, and most of its security problems come from plugins. WPScan audits a site for them.

## How it works
It fingerprints the WordPress version, then finds plugins and themes from page content and known paths. It compares those with a vulnerability database, for which you need a free API token. It's a focused scanner for one platform, so it finds much more there than a general one would.

## Try it
::: law Your site only
Run it on your own WordPress site or a lab copy.
:::

```
wpscan --url http://192.168.56.10:8080 --enumerate vp,vt --api-token YOUR_TOKEN
```

`vp` lists vulnerable plugins, and `vt` lists vulnerable themes. Update or remove what it flags.

## What defenders see
Many requests for plugin paths are a clear signature. Keep WordPress, plugins and themes updated, delete the ones you don't use, protect the login with MFA, and turn off user enumeration.

?! Why do plugins, rather than WordPress itself, cause most compromises?
