---
title: Android security
summary: The app sandbox, permissions, verified boot and the keystore, why accessibility abuse and sideloading are the real dangers, and how to test your own app.
level: intermediate
side: both
minutes: 45
attack: T1417
needs: 02-03-linux-confinement, 0047-keeping-input-out-of-the-code
pair: 15-04-ios-and-mobile-testing
source: Android Security Overview | https://source.android.com/docs/security/overview
words: application sandbox, intent, accessibility service
---
Android is Linux with a very different security model. Instead of protecting users from each other, it protects each app from every other app. Billions of phones run it, and banking fraud in many countries now starts on one. So the mobile threat model is worth learning properly.

@term application sandbox = The isolation that gives each Android app its own user ID and private data.
@term intent = An Android message that asks another component to act.
@term accessibility service = An Android feature that lets an app read the screen and act for the user, built to help people with disabilities.

## Concept

### Fundamentals: the layers

| Layer | What it does |
|---|---|
| Verified Boot | Each boot stage checks the next |
| Linux kernel | Enforces process separation |
| SELinux | Mandatory policy on all processes |
| App sandbox | One UID per app |
| Permissions | User-granted access |
| App signing | Ties updates to the developer's key |
| Keystore | Hardware-backed keys |
| Play Protect | Scans apps |

Each app runs under its own Linux UID, so a file in `/data/data/<app>/` is private by default. Apps can't read one another's data without an explicit route. This is the [confinement](/modules/02-03-linux-confinement/) you've studied, used at scale.

### Components and intents

An app has four component types: Activities, Services, Broadcast Receivers and Content Providers. They talk through **intents**. The manifest's `exported` flag decides whether another app can reach a component.

Most application-level bugs happen here.

| Weakness | Cause |
|---|---|
| Exported component | Another app can trigger a private action |
| Intent redirection | An app forwards an untrusted intent |
| Content provider exposure | Other apps can read data |
| Insecure WebView | JavaScript bridges or local file access |
| Secrets in the APK | Anyone can decompile it |
| Insecure storage | Sensitive data in shared storage or logs |

An APK is a zip file. Anyone can unpack and decompile it, so **secrets in client code aren't secrets**.

### Advanced: what real mobile malware does

Real Android malware rarely breaks the sandbox. It asks for permission, and tricks people into giving it.

- **Sideloading through social engineering.** A caller or SMS pushes a fake bank or delivery app.
- **Accessibility abuse.** Once granted, an **accessibility service** can read screens and tap buttons, which defeats many in-app protections. Banking trojans use this for on-device fraud.
- **Overlays** draw fake login screens above a real app.
- **SMS stealing** captures one-time codes, one more reason to [drop SMS as a factor](/modules/11-02-authentication-mechanics/).

Google has responded: Restricted Settings limit sideloaded apps from enabling accessibility, and Play Integrity lets a server check whether a device and app are genuine. Android's [developer verification](https://developer.android.com/developer-verification) plans extend identity checks to sideloaded apps.

**Fragmentation** is the hard part. Patches depend on manufacturers and carriers, and older devices stop getting them. So an app can't assume a fully patched OS.

?? How does Android isolate apps from each other?
+ Each app runs under its own UID
- Each app gets its own physical core
- Each app is signed by the operator
- Each app must use the same account
=> The kernel's normal user separation keeps one app's files and processes away from another.

## Threat model

The main mobile threat is the *user* being deceived, with [input capture](https://attack.mitre.org/techniques/T1417/) as a common outcome. Lost or stolen devices come second, and malicious or buggy apps third. Targeted spyware that exploits the OS itself is rare, and it's discussed in [iOS and mobile testing](/modules/15-04-ios-and-mobile-testing/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| `adb` | Talks to a device | Debugging your apps |
| jadx | Decompiles APKs to Java | Reviewing your own app |
| apktool | Unpacks resources | Reading the manifest |
| MobSF | Automated app analysis | A first pass |
| Android Studio emulator | Virtual device | A safe lab |
| Frida | Runtime instrumentation | Testing your own app |

[OWASP's MASVS](https://mas.owasp.org/MASVS/) sets the security requirements, and [MASTG](https://mas.owasp.org/MASTG/) is the testing guide.

## Defence

**For developers:**

- Set `exported="false"` unless you really need it, and require permissions on exported components.
- Keep secrets on your server, and use short-lived tokens.
- Use the Keystore, and EncryptedSharedPreferences or an equivalent.
- Lock down WebViews, and don't expose JavaScript interfaces to untrusted content.
- Use Play Integrity, and treat its result as one signal on your server.
- Use TLS, and consider [pinning](/modules/03-07-pki-in-depth/) with care.

**For organisations:** use Mobile Device Management, keep work profiles separate, block sideloading on managed devices, and require a minimum OS version.

**For users:** only install from trusted stores, and treat a request for accessibility permission as a serious warning.

## Pitfalls

- **"Our API key is hidden in the app."** It isn't.
- **"Root detection protects us."** It can be bypassed, so treat it as a speed bump.
- **Trusting the client.** All authorisation belongs on the server.
- **Logging sensitive data.** `logcat` and crash reports leak.
- **Assuming that Play means safe.** Malicious apps do get through.

?? Why is abuse of the accessibility service so dangerous?
+ It can read screens and perform taps
- It can replace the phone's bootloader remotely
- It can delete Google's whole Play store
- It can change the device's IMEI number
=> With it, malware can see what's displayed and act as the user, including in banking apps.

## Exercise

::: law Lab only
Analyse only apps that you built, or deliberately vulnerable practice apps such as OWASP's UnCrackable series or InsecureBankv2. Reverse engineering other apps may break terms or law.
:::

1. Build a small Android app, or download a practice app. Unpack it with `apktool`, and read `AndroidManifest.xml`.
2. Decompile it with `jadx`, and search for strings such as `key` or `http://`.
3. Run MobSF on it, and read the report. Which findings are real?
4. In an emulator, use `adb shell am start` to launch an exported activity. Then set `exported="false"`, and retry.
5. Check Settings on your own phone: which apps have accessibility access?

?! A bank's customers lose money to a fake app that's pushed by phone call. What can the bank change in its app, its server and its customer messaging?

## Further reading

- [Android Security documentation](https://source.android.com/docs/security/overview).
- [OWASP MASVS](https://mas.owasp.org/MASVS/) and [MASTG](https://mas.owasp.org/MASTG/).
- [Android developer security guidelines](https://developer.android.com/privacy-and-security/security-tips).
- [MobSF](https://github.com/MobSF/Mobile-Security-Framework-MobSF).
- [ATT&CK for Mobile](https://attack.mitre.org/matrices/mobile/).
