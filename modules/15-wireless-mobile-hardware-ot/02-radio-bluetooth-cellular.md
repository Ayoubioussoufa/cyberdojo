---
title: Radio, Bluetooth and cellular
summary: Security in the air around you. Replay and rolling codes, Bluetooth pairing, software-defined radio, SS7, IMSI catchers and SIM swapping, and what each means for defenders.
level: advanced
side: both
minutes: 45
attack: T1111
needs: 15-01-wifi-security
pair: 15-01-wifi-security
source: NIST SP 800-121, Guide to Bluetooth Security | https://csrc.nist.gov/pubs/sp/800/121/r2/upd1/final
words: software-defined radio, SS7, IMSI catcher
---
Your phone, car key, wireless headset and door badge all talk over radio, and anyone nearby can listen. Cellular networks were also built on trust between operators. This module covers how these systems authenticate, where they fall short, and why SMS isn't a safe second factor.

@term software-defined radio = A radio whose signal processing is done in software, so that it can work with many protocols.
@term rolling code = A remote control scheme in which each transmission uses a new code.
@term SS7 = The signalling system that links telephone networks, designed for trusted operators.
@term IMSI catcher = A fake base station that tricks phones into connecting, to reveal their identity or intercept traffic.
@term SIM swap = Convincing a carrier to move a victim's number to a SIM controlled by an attacker.

## Concept

### Fundamentals: radio has no walls

Radio is a broadcast medium. Listening needs no permission from the system, and it leaves no trace. So everything must be protected by cryptography, and that's expensive for cheap devices, which explains the many weak ones.

**Software-defined radio** made this field accessible. An RTL-SDR dongle costs little, and receives a wide range of signals. HackRF can also transmit. GNU Radio and Universal Radio Hacker help analyse signals.

### Replay and rolling codes

A simple garage remote sends a fixed code, and recording and replaying it opens the door. **Rolling codes** change each time, so a recording is stale. Yet that depends on the design: the receiver has to accept a window of future codes in case the button was pressed out of range. [RollJam](https://www.wired.com/2015/08/hackers-tiny-device-unlocks-cars-opens-garages/) (2015) showed how jamming while recording could capture an unused code. The fix is time-based codes, or a challenge-response design.

### Bluetooth

Bluetooth Classic and Bluetooth Low Energy (BLE) differ. Pairing creates a shared key, and its security depends on the method.

| Method | Protection |
|---|---|
| Just Works | None against an on-path attacker |
| Numeric comparison | Good, as a user confirms |
| Passkey entry | Good, if the passkey is random |
| Out of band | Strong, for example via NFC |

Flaws recur. [KNOB](https://knobattack.com/) (2019) showed that an attacker could negotiate an encryption key down to one byte of entropy. BlueBorne (2017) was a set of remote flaws in Bluetooth stacks. Trackers raise privacy issues, so phones now warn about unknown tags.

### Cellular

**SS7** connects operators worldwide, and it was built when only a few national carriers took part. An attacker with access to it can query a phone's location, or redirect SMS and calls. Its successor, Diameter, has related trust issues. That's the reason [NIST](https://pages.nist.gov/800-63-4/sp800-63b.html) restricts SMS as an authenticator.

**IMSI catchers** pose as a base station. 2G lets the network authenticate the phone without the phone authenticating the network, so a downgrade helps these devices. 3G and later added mutual authentication. **5G** encrypts the subscriber's permanent ID as a SUCI, which addresses simple IMSI capture, though downgrades remain a concern.

**SIM swapping** needs no radio at all. An attacker socially engineers or bribes a carrier's staff, then receives the victim's SMS codes. The [FBI](https://www.ic3.gov/) has warned about it repeatedly.

### Advanced: signal-level attacks

Keyless car entry can be defeated by **relay attacks**, which extend the range between fob and car, so that the car believes the key's nearby. Motion-sensing fobs, and ultra-wideband ranging, measure time of flight to resist it. GPS signals are unauthenticated, so they can be jammed or spoofed. Ships and aircraft in several regions have reported interference, and it's a real safety issue.

?? Why does a rolling code stop simple replay?
+ Each code is accepted only once
- Radio signals can't ever be recorded
- Receivers only work within one metre
- Transmitters change frequency every single day
=> Once used, a code is rejected, so a captured transmission is worthless, provided it was actually used.

## Threat model

Attackers need proximity for radio attacks, and access to signalling networks for SS7, so these are often targeted or high-value cases. SIM swapping is the exception: it's cheap, and it's common against people with cryptocurrency or valuable accounts. It's a form of [MFA interception](https://attack.mitre.org/techniques/T1111/).

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| RTL-SDR | Cheap receiver | Learning, receive-only |
| GNU Radio | Signal processing | Building decoders |
| Universal Radio Hacker | Analyses unknown protocols | Studying your own devices |
| `bluetoothctl`, Wireshark | Bluetooth inspection | Your own devices |
| nRF Connect | BLE scanner | Exploring your BLE devices |
| AIMSICD-style tools | Watch for suspicious cells | Research |

## Defence

- **Don't use SMS for sensitive MFA.** Use [FIDO2](/modules/11-02-authentication-mechanics/).
- **Add carrier protections:** a SIM lock, number-port freeze and account PIN.
- **Disable 2G** on phones that allow it, which modern Android does.
- **Prefer numeric comparison** for Bluetooth pairing, and turn Bluetooth off for high-risk moments.
- **For product designers:** use challenge-response, not fixed codes, and authenticate firmware.
- **Store car keys** away from doors or in a pouch, if your model is vulnerable.

## Pitfalls

- **"It's only local."** A cheap directional antenna extends range a long way.
- **"Encrypted radio is safe."** Bad key exchange undoes good encryption.
- **Assuming that SMS is end-to-end.** It isn't.
- **Transmitting to test something.** Radio is licensed. Even a brief test can break the law, and may interfere with safety services.
- **Equating 5G with safety.** Downgrades and legacy interconnects remain.

?? What does 5G's SUCI conceal?
+ The subscriber's permanent identity over the air
- The phone's battery level from the network
- The content of each cell tower's firmware
- The operator's billing data from the regulator
=> The permanent identifier is encrypted to the home network, so it can't be read by a passive listener.

## Exercise

::: law Lab only
Receive only, and decode only signals that are legal to receive where you live. Don't transmit, jam, or capture anyone else's communications. Laws differ, and this applies to Morocco's telecom regulator as well.
:::

1. Use an RTL-SDR to look at FM radio or ADS-B aircraft signals, if it's legal locally.
2. With `bluetoothctl`, pair two of your own devices. Note which method was used.
3. Look at your own BLE device in nRF Connect. What does it broadcast before pairing?
4. Check your phone for a setting that disables 2G, and enable it.
5. Set a SIM PIN, and ask your carrier about number-port protection.

?! Your CEO's account was reset through an SMS code after a SIM swap. Write down what you'd change in your identity setup, and what you'd ask the carrier.

## Further reading

- [NIST SP 800-121](https://csrc.nist.gov/pubs/sp/800/121/r2/upd1/final).
- [KNOB attack](https://knobattack.com/).
- [NIST SP 800-187](https://csrc.nist.gov/pubs/sp/800/187/final), on LTE security.
- [CyBOK Physical Layer and Telecommunications Security](https://www.cybok.org/knowledgebase1_1/).
- [GNU Radio tutorials](https://wiki.gnuradio.org/index.php/Tutorials).
