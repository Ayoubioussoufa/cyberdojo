---
title: File handling security
summary: Paths and uploads look simple and go wrong often. Why path checks must happen after resolution, how to store untrusted files safely, and how web shells get detected.
level: intermediate
side: defence
minutes: 40
attack: T1505.003, T1083
needs: 0047-keeping-input-out-of-the-code, 0049-apis-uploads-and-outbound-requests
pair: 04-03-injection-beyond-sql
source: OWASP File Upload Cheat Sheet | https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html
words: path traversal, canonicalisation, content sniffing
---
Handling a file looks like the easiest job in a web application: read one, save one. Yet CWE-22 and CWE-434 both sit in the 2025 Top 25. The reason is the same as injection: a filename and a file's content are both attacker-controlled data that other parts of the system will interpret.

@term path canonicalisation = Resolving a path to its one final absolute form.
@term content sniffing = A browser guessing a file's type from its content, rather than from its declared type.

## Concept

### Fundamentals: paths

If an application joins a base folder and a user-supplied name, the name might contain parent directory references or absolute paths. Those can lead outside the folder. Encodings add to the trouble, since a filter may look at one form, and the filesystem acts on another.

The safe logic is short, and the order matters: **resolve first, then compare**.

```python
base = Path("/srv/app/files").resolve()
target = (base / user_name).resolve()
if not target.is_relative_to(base):
    abort(404)
```

**Better still, don't use names from users at all.** Store files under random IDs, and keep the display name in a database. Then there's no path for anyone to attack.

**Symlinks** can defeat a check if an attacker can create links, and race conditions can sit between check and use. **Local file inclusion** is the dangerous cousin: when a language includes a file as code, then choosing the file means choosing what runs, as in old PHP `include`. Never include paths from input.

### Uploads

An upload combines four risks.

| Risk | Example | Control |
|---|---|---|
| Executable content | A script placed under the web root | Store outside it, with no execution |
| Overwrite | A name clash with a real file | Generate names |
| Served as active content | HTML or SVG runs in your origin | Separate domain, `Content-Disposition`, `nosniff` |
| Parser attacks | Image or document libraries have bugs | Sandbox processing, keep them patched |
| Resource abuse | Huge files, or decompression bombs | Size and ratio limits |

**Don't trust the client.** The `Content-Type` header and the extension are attacker-supplied. So check the real type by content, and keep an allow-list. Yet content checks can also be fooled, as a file can be valid in two formats at once. So the true control is **where and how it's served**, not only how it's validated.

### Advanced: safe storage design

@flow Upload > Size and type check > Random name > Isolated scan > Object storage > Serve from a separate domain

**Object storage** such as S3 removes server-side execution. Serving from a separate origin, such as `usercontent.example`, stops an uploaded HTML file running in your application's origin. That's why large sites use a different domain for user content. Signed, short-lived URLs give access with no need for your server to proxy the data.

**Processing** is the hidden risk. Image and document conversion libraries have a long history of flaws, so run them in a sandbox with no network access. Re-encoding images strips metadata and many hidden payloads.

**Web shells** are the outcome of a failed upload defence: a script that gives command execution through ordinary HTTP. Detect them by behaviour: new script files in a web root, a web server spawning shells, or a page visited by only one client. Read-only deployments make this much harder for an attacker.

?? Where should uploaded files be stored?
+ Outside the web root, under random names
- Inside the application's own source code folder
- In the same directory as its scripts
- On the administrator's desktop for later review
=> With no path to run them and no user-chosen names, an uploaded file stays just data.

## Threat model

Attackers use traversal for [file discovery](https://attack.mitre.org/techniques/T1083/) and for reading secrets: configuration, keys and source code. Uploads can lead to [web shells](https://attack.mitre.org/techniques/T1505/003/). Edge devices have seen serious flaws of exactly this type, which is one reason CISA's KEV list includes so many.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Object storage, signed URLs | Safe hosting | Default design |
| ClamAV | Scans uploads | Baseline malware check |
| `python-magic`, `file` | Identify types by content | Validation |
| gVisor, seccomp | Sandbox converters | Processing files |
| Semgrep | Finds unsafe path joins | Code review |
| [Web Security Academy](https://portswigger.net/web-security/file-upload) | Free labs | Legal practice |

## Defence

- **Use generated IDs,** not user filenames.
- **Resolve, then compare** with the base path.
- **Store outside the web root,** or in object storage.
- **Serve from a separate domain,** with `nosniff` and `Content-Disposition: attachment`.
- **Allow-list types,** and limit sizes.
- **Sandbox conversion,** and disable network access there.
- **Mount web roots read-only.**

**Detection.** Alert on file changes in web roots, on web processes spawning shells, and on repeated `../` patterns in access logs.

## Pitfalls

- **Filtering `../` by removing it.** Nested sequences can rebuild what you stripped.
- **Checking before decoding.** Check the final form.
- **Trusting extensions.** `.jpg.php`, and server configuration quirks, have caught many sites.
- **SVG as a safe image.** It can contain script.
- **Forgetting archive extraction.** Zip entries can hold traversal paths, a bug known as Zip Slip.

?? Why must you check the resolved path?
+ Encodings and `../` can escape the folder
- Long filenames always crash the operating system
- Browsers refuse any path containing a slash
- Disks store every file in alphabetical order
=> Only the final, canonical path shows where the file truly is.

## Exercise

::: law Lab only
Build this in your own app, and practise on PortSwigger's labs. Don't upload test files to real sites.
:::

1. Write a Flask endpoint that serves files by name. Write unit tests with tricky names.
2. Fix it using the resolve-then-compare pattern, and watch your tests pass.
3. Replace names with random IDs and a database table.
4. Build an upload that stores to a local S3-compatible service such as MinIO, with an allow-list and a size limit.
5. Serve an uploaded HTML file with and without `Content-Disposition: attachment`, and compare.
6. Write a rule that alerts on new `.php` or `.jsp` files in a web root.

?! Design a CV upload feature for a recruitment site. Cover storage, serving, scanning and what an HR user's browser will do with the file.

## Further reading

- [OWASP File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- [CWE-22](https://cwe.mitre.org/data/definitions/22.html) and [CWE-434](https://cwe.mitre.org/data/definitions/434.html).
- [Web Security Academy on path traversal](https://portswigger.net/web-security/file-path-traversal).
- [NSA and CISA on web shells](https://media.defense.gov/2020/Jun/09/2002313081/-1/-1/0/CSI-DETECT-AND-PREVENT-WEB-SHELL-MALWARE-20200422.PDF).
- [ATT&CK T1505.003](https://attack.mitre.org/techniques/T1505/003/).
