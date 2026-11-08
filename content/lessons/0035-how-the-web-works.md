---
title: How the web works
summary: HTTP in depth: requests, responses, methods, status codes and headers, seen with curl and browser DevTools.
month: 6
minutes: 35
builds: read and craft raw HTTP requests by hand
source: MDN, An overview of HTTP | https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview
words: HTTP request, status code, reverse proxy
---
The web is the largest attack surface there is. This month you learn how it works by building it correctly. In Month 8 you'll learn how it fails, and how to fix it. If you skip this, web hacking becomes a list of tricks you don't really understand.

@term HTTP request = A message from a client asking a server to do something.
@term HTTP response = A server's reply, with a status code, headers and usually a body.
@term URL = A web address naming a protocol, host, path and optional parameters.
@term HTTP method = The action a request asks for, such as GET or POST.
@term HTTP header = A named piece of metadata on a request or response.
@term status code = A three-digit number saying how a request went.
@term query string = The part of a URL after the ?, carrying parameters.
@term cookie = A small value a server asks the browser to store and send back.
@term web server = Software that accepts HTTP requests and returns responses.
@term reverse proxy = A server in front of an application that receives requests and forwards them.
@term REST = A common style for web APIs, using URLs for resources and HTTP methods for actions.
@term WAF (web application firewall) = A filter that inspects HTTP traffic for attacks.

## HTTP is just text

A browser and a server exchange plain, readable messages. See one yourself:

```
curl -v https://example.com/
```

```http
> GET / HTTP/1.1
> Host: example.com
> User-Agent: curl/8.5.0
> Accept: */*

< HTTP/1.1 200 OK
< Content-Type: text/html
< Content-Length: 1256
<
< <!doctype html>...
```

Lines with `>` are the request, and lines with `<` are the response. The [MDN overview](https://developer.mozilla.org/en-US/docs/Web/HTTP/Overview) covers it all.

Anatomy of a request:

```
POST /login?next=/home HTTP/1.1          method, path, query string, version
Host: shop.example                       headers
Content-Type: application/x-www-form-urlencoded
Cookie: session=abc123

username=ana&password=hunter2            body
```

::: key The client can't be trusted
Every part of that request is under the sender's control: the method, the headers, the cookies, the body. Your browser's forms are only one way of sending it. Tools like `curl` and Burp can send anything. Nearly all of web security follows from that one fact.
:::

?? Which part of a request does the sender control?
+ All of it, headers too
- Only the form's body text
- Only the web address itself
- None, as browsers control it
=> Tools can send anything, which is why the server must never trust the client.

## Methods

| Method | Purpose | Has a body? |
|---|---|---|
| `GET` | Read something | No |
| `POST` | Submit or create | Yes |
| `PUT` | Replace | Yes |
| `PATCH` | Change part of it | Yes |
| `DELETE` | Remove | Usually not |
| `OPTIONS` | Ask what's allowed | No |

GET should never change anything. Values in a URL also end up in logs and browser history, so secrets never belong there.

?? Why shouldn't secrets go in a URL?
+ URLs end up in logs and history
- URLs can't safely contain letters or numbers
- GET requests are always encrypted twice over
- Browsers refuse to load such long addresses
=> Even over HTTPS, a URL gets written to server logs and browser history.

## Status codes

| Range | Meaning | Examples |
|---|---|---|
| 2xx | Success | 200 OK, 201 Created |
| 3xx | Redirect | 301, 302 |
| 4xx | Your request has a problem | 400, 401, 403, 404, 429 |
| 5xx | The server has a problem | 500, 502, 503 |

Remember: **401** means "who are you?" and **403** means "I know who you are, and no".

@drill http-status

?? A web form hides the price field and uses JavaScript to stop edits. Can the price still be changed?
+ Yes, anyone can craft the request directly
- No, hidden fields can't be sent back
- No, the browser enforces all JavaScript rules
- Only if the site uses plain HTTP
=> Browser checks are a convenience. The server has to validate everything, because the client is under the attacker's control.

## The path of a request

Real sites have layers, and each one writes its own logs:

@flow Browser > CDN or WAF > Reverse proxy > App server > Database

A **reverse proxy** like nginx terminates TLS and passes requests to the app. One catch: the app often sees the proxy's IP, so the real client's IP arrives in a header like `X-Forwarded-For`, which a client can forge if the proxy isn't set up carefully.

?? Why can `X-Forwarded-For` mislead an investigator?
+ A client can forge that header
- It only shows your own address
- It's encrypted, so nobody reads it
- Proxies always delete it from logs
=> Trust it only if your own proxy sets it, and strips what clients send.

## Try it

::: try In your VM
```
curl -i https://example.com/                     include response headers
curl -X POST -d "a=1" https://httpbin.org/post   send a POST
curl -H "User-Agent: test" https://httpbin.org/headers
```
Then open your browser's DevTools (F12), go to the Network tab, and load any site. Click a request and read its headers.
:::

?? In the request above, what does the server learn from `Host: shop.example`?
+ Which website on that server
- Which user is logged in
- Which OS the client uses
- Which database stores shop data
=> One server can host many sites, so the `Host` header says which one. It's required in HTTP/1.1.

?! Why can't a server trust the `User-Agent` header? What does that imply for any security check based on it?

### Go further

Primary sources and the best free material on this topic, all checked in November 2026:

- [RFC 9110: HTTP Semantics, the standard itself](https://www.rfc-editor.org/rfc/rfc9110)
- [High Performance Browser Networking, free online book](https://hpbn.co/)
