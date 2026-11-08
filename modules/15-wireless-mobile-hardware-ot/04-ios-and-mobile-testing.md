---
title: iOS and mobile assurance
summary: How iOS enforces its walled garden, what the Secure Enclave protects, how spyware cases changed the threat model, and how to run a proper mobile assessment.
level: advanced
side: defence
minutes: 45
attack: T1404
needs: 15-03-android-security
pair: 15-03-android-security, 04-12-api-security-graphql-grpc
source: Apple Platform Security Guide | https://support.apple.com/guide/security/welcome/web
words: Secure Enclave, Data Protection, mercenary spyware
---
iOS takes a different approach to Android: one vendor controls the hardware, the OS and the App Store. That gives it strong defaults, and it also means researchers and defenders see less. This module covers those defences, what high-end spyware has shown about their limits, and how a mobile assessment works on both platforms.

@term Secure Enclave = A separate security processor in Apple devices, which handles keys and biometrics.
@term Data Protection = The iOS system that ties file encryption to the device passcode and hardware.
@term mercenary spyware = Commercial surveillance tools sold to governments, and used against chosen individuals.
@term mobile device management = Remote configuration and control of a company's phones and tablets.

## Concept

### Fundamentals: the iOS model

| Layer | Purpose |
|---|---|
| Secure Boot chain | Each stage verifies the next, from Boot ROM |
| Code signing | All code must carry a valid signature |
| App sandbox | Each app is confined to its container |
| Secure Enclave | Keys never leave it, and it throttles passcode tries |
| Data Protection | File keys derive from the passcode and a device key |
| App Store review | Screening before distribution |

**Mandatory code signing** is the central rule: memory can't simply be made executable by an ordinary app, which raises the cost of exploitation. The [Apple Platform Security guide](https://support.apple.com/guide/security/welcome/web) documents this in detail.

**Data Protection** means that a locked phone's files are cryptographically protected. The **Secure Enclave** enforces increasing delays between passcode attempts, so a stolen phone resists brute force. Biometrics unlock a key inside the Enclave, and the biometric data itself never leaves it.

### Keychain and app security

Keychain stores secrets, with options for when they're readable, such as "only when unlocked, this device only". **App Attest** lets a server check that a request comes from a genuine app on a genuine device. **App Transport Security** pushes apps toward TLS. Despite all this, developers can still make errors: secrets in the bundle, data in unprotected files, logs, screenshots in the app switcher, or weak custom URL schemes.

### Jailbreaking and its meaning

A jailbreak removes these protections, usually by exploiting a flaw. Testers use jailbroken devices so that they can inspect apps. For a company, a jailbroken device is one whose guarantees are gone, so MDM often blocks it.

### Advanced: the spyware problem

Spyware changed assumptions about iPhone safety. Citizen Lab's [FORCEDENTRY report](https://citizenlab.ca/2021/09/forcedentry-nso-group-imessage-zero-click-exploit-captured-in-the-wild/) in 2021 described a zero-click exploit used against a Saudi activist's phone, attributed to NSO Group's Pegasus. No tap was needed. Such chains sell for very high prices, so they're aimed at journalists, activists and politicians rather than at the public.

Apple's response includes **Lockdown Mode**, which sharply reduces attack surface for at-risk people, and **BlastDoor**, a sandbox for parsing messages. Apple also sends threat notifications. **Memory Integrity Enforcement**, which Apple announced in 2025, builds on memory tagging. See [Exploit mitigations](/modules/05-06-exploit-mitigations/).

The [Mobile Verification Toolkit](https://github.com/mvt-project/mvt), from Amnesty International's Security Lab, helps investigators find traces of this spyware in backups. Few organisations need it, but those who do need it very much.

### Mobile assessments

A good assessment follows [OWASP MASTG](https://mas.owasp.org/MASTG/), on both platforms.

| Phase | Checks |
|---|---|
| Static | Bundle contents, permissions, embedded secrets, configuration |
| Dynamic | Runtime behaviour, storage, logs, inter-process communication |
| Network | API calls, TLS use, certificate handling |
| Backend | The API, usually where the serious flaws are |
| Resilience | Anti-tampering, only where the threat justifies it |

Pinning complicates testing, so testers use builds with it disabled, or instrument their own builds. Most serious findings end up being [API flaws](/modules/04-12-api-security-graphql-grpc/), so test the server as thoroughly as the app.

?? What does mandatory code signing on iOS prevent?
+ Running code outside Apple's chain of trust
- Reading the phone's own display brightness setting
- Installing any update from Apple at all
- Making phone calls while connected to Wi-Fi
=> Only signed code runs, so unknown binaries can't simply be started, which forces attackers to find deeper flaws.

## Threat model

For most people, the risks are lost devices, phishing, risky apps and account takeover. For a small group, it's mercenary spyware using [privilege escalation exploits](https://attack.mitre.org/techniques/T1404/). Know which group you're in. Advice differs a lot: a journalist in a dangerous place needs Lockdown Mode, and most people don't.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Xcode, simulators | Build and test | Your own apps |
| OWASP MASTG, MASVS | Test guide and requirements | Scoping an assessment |
| MobSF | Static analysis | A first pass |
| Burp or mitmproxy | Inspect app traffic | Your own test build |
| MDM platforms | Manage fleets | Corporate devices |
| MVT | Finds spyware traces | Authorised investigation |

## Defence

**For developers:** use Keychain with strict accessibility classes, don't store secrets in the bundle, exclude sensitive data from backups and app switcher snapshots, validate deep links, and use App Attest.

**For organisations:** enrol devices in MDM, enforce OS versions and passcodes, separate work data, and offer high-risk staff extra help.

**For at-risk individuals:** enable Lockdown Mode, reboot regularly, keep updated, and seek specialist help such as [Access Now's helpline](https://www.accessnow.org/help/).

## Pitfalls

- **"iPhones can't be hacked."** Rare and costly isn't the same as impossible.
- **"Apple reviewed it, so it's safe."** Reviews miss things.
- **Testing the app, and ignoring the API.**
- **Over-investing in anti-tamper code.** It delays attackers, and it doesn't fix server trust.
- **Assuming a backup is private.** Check how backups are encrypted.

?? Who is Lockdown Mode designed for?
+ People at risk of targeted spyware
- Children using a shared family tablet
- Developers testing an app's first build
- Travellers switching between mobile data plans
=> It's an optional, extreme setting that trades features for a smaller attack surface.

## Exercise

::: law Lab only
Test only apps you built or practice apps made for this. Scanning someone else's phone needs their informed consent.
:::

1. Build a small iOS app in the simulator if you've got a Mac, or read a practice app's bundle otherwise.
2. Store a value in `UserDefaults` and another in Keychain. Show where each lives in the simulator's file system.
3. Proxy your own test app through mitmproxy, and read its API calls.
4. Use MASVS to write a one-page checklist for a banking app.
5. Read the Citizen Lab FORCEDENTRY report, and summarise the chain in five lines, at the level of concepts.

?! Compare what a stolen, locked iPhone and an unpatched Android phone would mean for a company's data. What would change your answer?

## Further reading

- [Apple Platform Security](https://support.apple.com/guide/security/welcome/web).
- [OWASP MASTG](https://mas.owasp.org/MASTG/).
- [Citizen Lab's FORCEDENTRY report](https://citizenlab.ca/2021/09/forcedentry-nso-group-imessage-zero-click-exploit-captured-in-the-wild/).
- [Mobile Verification Toolkit](https://docs.mvt.re/).
- [About Lockdown Mode](https://support.apple.com/en-us/105120).
