---
title: Wi-Fi security
summary: How WPA2 and WPA3 protect a wireless network, why a shared password limits you, what evil twins exploit, and how to design and monitor Wi-Fi properly.
level: intermediate
side: both
minutes: 45
attack: T1669, T1040
needs: 01-04-layer-2-attacks, 03-03-block-ciphers-and-modes
pair: 15-02-radio-bluetooth-cellular
source: Wi-Fi Alliance, Wi-Fi Security | https://www.wi-fi.org/discover-wi-fi/security
words: four-way handshake, SAE, evil twin
---
A wired network has a useful property: you need to be inside the building to touch it. Wi-Fi leaks through walls into the car park. So everything depends on cryptography and on how devices decide what to trust. This module explains those decisions, and how to design around their limits.

@term four-way handshake = The Wi-Fi exchange that proves both sides hold the master key, and creates session keys.
@term SAE (Simultaneous Authentication of Equals) = The WPA3 handshake, which resists offline password guessing.
@term evil twin = A rogue access point that imitates a legitimate network.
@term PMF (protected management frames) = Encryption and authentication of Wi-Fi control frames, such as disconnections.

## Concept

### Fundamentals: how WPA2 works

**WPA2-Personal** derives a pairwise master key from the passphrase and the SSID, using PBKDF2. Then client and access point run the **four-way handshake**: they swap random nonces, derive session keys, and prove that they hold the master key, without sending it. Traffic is then encrypted using AES-CCMP.

Two consequences matter.

1. **A captured handshake can be attacked offline.** It contains enough to test a guess. So the security of WPA2-Personal equals the strength of the passphrase, and no rate limit applies.
2. **Everyone shares one key.** Anyone with the passphrase who sees a client's handshake can derive its session keys.

### Enterprise Wi-Fi

**WPA2/3-Enterprise** uses [802.1X](/modules/07-04-network-architecture/) and RADIUS, so each user or device authenticates separately, and gets unique keys. EAP-TLS with device certificates is the strongest option. PEAP and similar password-based methods depend on the client verifying the server's certificate. If it doesn't, a rogue access point can harvest credentials.

### WPA3

| Change | Benefit |
|---|---|
| **SAE** replaces the PSK handshake | Each guess needs a live exchange, and past traffic stays safe if the password leaks later |
| **PMF** mandatory | Forged disconnections stop working |
| 192-bit mode | For high-security enterprise networks |
| OWE | Encrypts open networks, with no authentication |

Research such as [Dragonblood](https://wpa3.mathyvanhoef.com/) found side channels in early SAE implementations, and transition mode can allow downgrades, so details still matter.

### Attacks that don't break crypto

**Evil twins.** Devices remember network names, not identities. A rogue access point with a familiar SSID may attract clients, especially on open networks. Forged **deauthentication** frames, on networks with no PMF, can push clients off their real network and onto the rogue.

**Protocol flaws** appear even in sound designs. [KRACK](https://www.krackattacks.com/) (2017), by Mathy Vanhoef and Frank Piessens, showed that replaying a handshake message could force nonce reuse, despite a formal proof of the handshake. That's the gap discussed in [Formal methods](/modules/16-05-formal-methods/). [FragAttacks](https://www.fragattacks.com/) (2021) found design flaws dating back to the original standard.

### Advanced: designing and monitoring

Separate networks by trust: corporate, guest, and IoT, each with its own VLAN and firewall rules. **Client isolation** stops guests reaching each other. **Rogue detection** uses wireless intrusion detection, which compares what's in the air with your inventory. Physical placement and transmit power affect how far signal leaks, but they aren't a security control.

Public Wi-Fi risk is lower than it was, as TLS protects most traffic. The bigger risks are captive portals that collect credentials, and devices auto-joining known names.

?? Why can a captured WPA2-PSK handshake be attacked offline?
+ It lets guesses be checked without connecting
- It contains the passphrase in plain text
- It discloses the router's own administrator password
- It disables encryption for all later traffic
=> The handshake holds values derived from the key, so an attacker can test candidates locally, with no limit.

## Threat model

Attackers need radio range, and that may include the car park. Techniques include [Wi-Fi as an entry point](https://attack.mitre.org/techniques/T1669/), and [sniffing](https://attack.mitre.org/techniques/T1040/). A neighbouring compromised network may also become a stepping stone, as in the 2024 ["nearest neighbor" attack](https://www.volexity.com/blog/2024/11/22/the-nearest-neighbor-attack-how-a-russian-apt-weaponized-nearby-wi-fi-networks-for-covert-access/) that Volexity documented.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Wireshark | Decodes 802.11 | Studying handshakes |
| Kismet | Passive wireless monitor | Surveying your own network |
| `wavemon`, `iw` | Show local radio details | Checking your setup |
| aircrack-ng suite | Wi-Fi audit tools | Testing your own network |
| hostapd | Software access point | Lab networks |
| WIDS features | Detect rogues | Enterprise monitoring |

## Defence

- **Use WPA3 where you can,** and otherwise WPA2 with a long random passphrase.
- **Use Enterprise with EAP-TLS** for corporate networks.
- **Enable PMF.**
- **Validate server certificates** on all clients, by policy.
- **Separate guest and IoT** onto their own networks.
- **Disable WPS,** whose PIN design is weak.
- **Watch for rogues** with WIDS, and keep an inventory.
- **Patch access points and clients.** Many flaws are in firmware.

## Pitfalls

- **"Hidden SSIDs are safer."** They're still visible in traffic, and clients leak the name while searching.
- **"MAC filtering protects us."** Addresses are visible and can be copied.
- **Shared PSK in a company.** When someone leaves, you can't revoke only them.
- **PEAP with no certificate checks.** It hands credentials to a rogue.
- **Assuming a strong passphrase fixes everything.** It doesn't stop deauthentication, or evil twins.

?? What does WPA3's SAE change?
+ Each guess needs a fresh live exchange
- Passwords can be shorter than before safely
- Access points no longer need any key
- Clients never broadcast any frames on air
=> A captured exchange no longer allows offline guessing, so attackers must try each guess against the real network.

## Exercise

::: law Lab only
Only monitor and test a network that you own, using your own devices. Capturing others' Wi-Fi or sending deauthentication frames can be illegal, and it disrupts people nearby. Use a shielded setup if you can.
:::

1. Set up a test network on an old router or with `hostapd`, away from anyone else's traffic.
2. Use `iw dev` to identify your adapter, and capture your own client joining. Find the four messages in Wireshark.
3. Configure WPA3-SAE if your hardware supports it, and compare the frames.
4. Check whether PMF is enabled on your access point.
5. Write a Wi-Fi policy for a small office: networks, authentication, guests, rogue detection.

?! An office uses one WPA2 password shared by 80 staff. Write the risks, and a migration plan that doesn't disrupt printers.

## Further reading

- [KRACK](https://www.krackattacks.com/).
- [Dragonblood](https://wpa3.mathyvanhoef.com/).
- [FragAttacks](https://www.fragattacks.com/).
- [NIST SP 800-153](https://csrc.nist.gov/pubs/sp/800/153/final), on securing WLANs.
- [Wi-Fi Alliance security overview](https://www.wi-fi.org/discover-wi-fi/security).
