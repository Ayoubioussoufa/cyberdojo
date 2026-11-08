---
title: mitmproxy
summary: A scriptable HTTPS proxy with a terminal interface.
side: both
use: own
docs: https://docs.mitmproxy.org/stable/
kali: mitmproxy
aka: mitmweb, mitmdump
alt: burp-suite
---
## What it's for
mitmproxy intercepts and alters HTTP and HTTPS traffic, and you can script it in Python. Developers use it to debug apps and APIs, including mobile ones.

## How it works
Like Burp, it presents its own certificate for each site, signed by a CA that you've chosen to trust. So it terminates TLS, reads the request, then opens its own TLS connection onward. Three front ends share one core: `mitmproxy` in the terminal, `mitmweb` in the browser, and `mitmdump` for scripts.

## Try it
::: law Your traffic only
Intercept only your own devices and test apps. Reading other people's traffic is illegal.
:::

```
mitmweb -p 8080
curl -x http://127.0.0.1:8080 -k https://example.com
```

Open the web interface, and read the captured request. `-k` skips certificate checks, so only use it on this test.

## What defenders see
Apps that pin certificates refuse its certificate, and that's the point of pinning. Corporate TLS inspection works the same way, so unknown root CAs on a device are worth an audit, since they allow this kind of interception. See [Sensors and TLS inspection](/modules/07-03-sensors-and-tls-inspection/).

?! How would you check a laptop for a root certificate that shouldn't be there?
