---
title: Zero Trust in depth
summary: What Zero Trust really means once you strip away the marketing. NIST's model, policy engines, ZTNA, SASE and service meshes, plus how to get there in stages.
level: advanced
side: defence
minutes: 50
attack: T1078, T1133, T1021
needs: 0074-kubernetes-and-zero-trust, 0041-identity-and-access, 07-04-network-architecture
pair: 07-06-vpn-internals, 11-05-hybrid-and-workload-identity
source: NIST SP 800-207, Zero Trust Architecture | https://csrc.nist.gov/pubs/sp/800/207/final
words: policy enforcement point, ZTNA, implicit trust
---
Zero Trust is the most over-marketed term in security, and there's a serious idea under it. Old networks had a hard shell and a soft centre: once inside, you were trusted. Zero Trust removes location from the decision. No request is trusted because of where it came from. Each one is judged on who's asking, from what device, for which resource, and right now.

@term implicit trust = Allowing access because of where a request comes from, rather than who and what it is.
@term policy decision point = The component that decides whether a request is allowed.
@term policy enforcement point = The component that allows, monitors and ends a connection, following that decision.
@term ZTNA (Zero Trust Network Access) = Remote access that connects a user to one application, rather than to a network.
@term SASE (secure access service edge) = Cloud-delivered network and security functions combined at the edge.
@term service mesh = An infrastructure layer that handles identity, encryption and policy for traffic between services.

## Concept

### Fundamentals: the idea

[NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final) describes Zero Trust as moving defences from static network perimeters to users, assets and resources. Its core tenets, in short:

1. All data sources and services count as resources.
2. All communication is secured, regardless of network location.
3. Access is granted per session.
4. Access is decided by dynamic policy: identity, device state, behaviour.
5. The organisation monitors the integrity of all assets.
6. Authentication and authorisation are enforced before access.
7. Collect as much as possible about asset and traffic state, then use it.

So **assume breach**. Being on the office network earns nothing.

### The logical model

@flow Subject > Policy enforcement point > Resource

Behind the enforcement point sits the **policy decision point**, made of a *policy engine* that decides, and a *policy administrator* that acts on the decision. The engine draws on signals: identity provider, device management, threat intelligence, activity logs, and data classification.

A request such as "Ana, on her managed laptop, wants the payroll app" yields a decision per session, and that can be withdrawn if her device's risk changes mid-session.

### The Google example

[BeyondCorp](https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/) came out of Google's response to the 2009 Aurora attacks. Google removed the privileged internal network: employees reach internal apps through an internet-facing proxy that checks user and device. It's the best-documented large deployment, and it took years.

### Pillars

CISA's [Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model) groups the work into five pillars: identity, devices, networks, applications and workloads, and data. Each moves through traditional, initial, advanced and optimal stages. That's useful, because Zero Trust isn't a product you buy. It's a direction that you move in.

### Products in the space

**ZTNA** replaces the VPN: the user reaches one application through a broker, and the application's address is never exposed. **Identity-aware proxies** do this for web apps. **SASE** bundles ZTNA, a secure web gateway, a firewall service and SD-WAN in the cloud, and SSE is the security part alone.

### Advanced: services and limits

Between services, a **service mesh** such as Istio or Linkerd gives each workload a cryptographic identity, encrypts traffic with mutual TLS through a sidecar or node proxy, and enforces which service may call which. SPIFFE standardises those identities. See [Workload identity](/modules/11-05-hybrid-and-workload-identity/).

Zero Trust moves risk rather than abolishing it.

- **The policy engine is a single point of failure, and a target.** If it's down, no one works. If it's compromised, everything falls.
- **Identity becomes the perimeter.** So session theft and token replay, which pass every check, are the natural attack. See [Authentication mechanics](/modules/11-02-authentication-mechanics/).
- **Legacy systems don't fit.** A mainframe can't check a device posture, so it needs a gateway in front.
- **Vendor dependence.** Policies, data and signals may sit in one provider's cloud.

?? In NIST's model, what does the policy enforcement point do?
+ It allows or ends the actual session
- It stores every user's password in plaintext
- It writes the organisation's security policy documents
- It scans the Internet for exposed ports
=> The decision point decides, and the enforcement point carries it out on the connection.

## Threat model

Zero Trust is designed against assumed compromise, including [valid accounts](https://attack.mitre.org/techniques/T1078/), abuse of [remote services](https://attack.mitre.org/techniques/T1021/) inside the network, and [external remote access](https://attack.mitre.org/techniques/T1133/). A stolen password alone should fail on device checks, and a compromised laptop should reach only what that user needs. The attacks that remain target the session and the control plane.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| Pomerium, OAuth2 Proxy | Identity-aware proxies | Self-hosted lab |
| Tailscale, Netbird | Identity-based overlays | Small teams |
| Entra Conditional Access | Policy decisions | Microsoft estates |
| Istio, Linkerd, Cilium | Service mesh and policy | Kubernetes |
| Open Policy Agent | Policy engine | Decisions as code |
| SPIRE | Workload identity | Issuing SPIFFE IDs |

## Defence

A practical order of work:

1. **Know your assets and data.** You can't protect what you haven't listed.
2. **Strong identity first.** Single sign-on and phishing-resistant MFA everywhere.
3. **Device trust.** Managed devices, and health signals fed into access decisions.
4. **Move one app** behind an identity-aware proxy, then repeat.
5. **Segment workloads**, as in [Network architecture](/modules/07-04-network-architecture/).
6. **Log every decision**, and alert on anomalies.

Keep a break-glass path that survives an identity provider outage.

## Pitfalls

- **"We bought Zero Trust."** No product delivers it. It's an architecture and a programme.
- **"VPN plus MFA is Zero Trust."** That still gives a network, and trusts it afterwards.
- **"It removes the need for a firewall."** Network controls remain a useful layer.
- **Forgetting availability.** Everything now depends on the identity and policy services.
- **Policy nobody can read.** Thousands of unclear rules recreate the trouble you started with.

?? What's the key difference between a VPN and ZTNA?
+ ZTNA grants one application, not a network
- ZTNA only works on IPv6 networks today
- ZTNA encrypts traffic, and VPNs never do
- ZTNA removes all need for user identity
=> A VPN puts you on a network, then filters. ZTNA starts from nothing and gives you one app.

## Exercise

::: law Lab only
Use your own VMs and test accounts.
:::

1. Put Pomerium or `oauth2-proxy` in front of a small internal web app in your lab. Authenticate through a free identity provider.
2. Remove the app's public route, so that only the proxy reaches it.
3. Add a policy based on group membership, and test it with two users.
4. Run two services in `kind` with Linkerd or Istio. Confirm mTLS by capturing traffic between pods, and add a rule that denies one service.
5. Score your lab against CISA's five pillars, and pick the next step.

?! Your company has 2,000 staff, one VPN, and an old ERP. Write the three-year Zero Trust roadmap. Include what you'd do in the first 90 days, and what wouldn't change.

## Further reading

- [NIST SP 800-207](https://csrc.nist.gov/pubs/sp/800/207/final).
- [CISA Zero Trust Maturity Model](https://www.cisa.gov/zero-trust-maturity-model).
- [BeyondCorp: A New Approach to Enterprise Security](https://research.google/pubs/beyondcorp-a-new-approach-to-enterprise-security/).
- [NIST SP 800-207A](https://csrc.nist.gov/pubs/sp/800/207/a/final), on cloud-native access control.
- [SPIFFE](https://spiffe.io/docs/latest/spiffe-about/overview/).
