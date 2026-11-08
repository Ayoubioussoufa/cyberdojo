---
title: Sector compliance and vendor risk
summary: PCI DSS for card data, HIPAA for health data, and how to judge a supplier's security. Scope reduction, SOC 2 reports, and why your vendors are part of your attack surface.
level: intermediate
side: defence
minutes: 45
attack: T1199, T1195
needs: 0061-frameworks, 0062-policy-privacy-and-the-midpoint
pair: 12-04-nist-rmf-and-controls, 12-05-eu-regulation
source: PCI Security Standards Council | https://www.pcisecuritystandards.org/standards/pci-dss/
words: cardholder data environment, business associate, third-party risk
---
Some rules come from a sector rather than a government. If you take card payments, you answer to PCI DSS, whichever country you're in. If you treat American patients, HIPAA applies. Almost every company also depends on suppliers whose failures become its own. This module covers the practical skills: reduce your scope, and judge others by evidence.

@term cardholder data environment = The people, processes and systems that store, process or transmit card data.
@term business associate = Under HIPAA, a vendor that handles protected health information for a covered entity.
@term third-party risk management = Assessing and controlling the risks that come from suppliers.

## Concept

### Fundamentals: PCI DSS

[PCI DSS](https://www.pcisecuritystandards.org/standards/pci-dss/) is a contractual standard from the card brands, enforced through banks. It isn't a law, but losing the right to take cards can end a business. Version 4.0.1 is current, and it has 12 requirements under six goals, covering network security, protecting account data, vulnerability management, access control, monitoring, and policy.

Key points:

- **Never store sensitive authentication data**, such as the CVV, after authorisation.
- **Render the card number unreadable** if stored, by truncation, tokenisation or strong encryption.
- **Merchant levels** decide whether you complete a self-assessment or get an external audit.

### Scope is the real game

Everything that touches card data is in scope, along with whatever is connected to it. So the best strategy is to have **less of it**.

| Design | Scope |
|---|---|
| Card numbers on your servers | Very large |
| Your site hosts the form, and posts to a processor | Medium |
| A hosted payment page, or iframe | Small |
| Tokenisation, no card data on your systems | Smallest |

Segmentation can shrink scope, if it's properly tested. Client-side rules were added for payment pages, in response to Magecart-style skimming, in which attackers inject scripts that steal cards in the browser. You must keep an inventory of payment page scripts, and detect tampering.

### HIPAA

The US [HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html) protects electronic health information. It covers **covered entities**, such as providers and insurers, and their **business associates**, under a formal agreement. It requires a risk analysis, along with administrative, physical and technical safeguards. It's deliberately flexible, using "required" and "addressable" specifications. The breach rule requires notice without unreasonable delay, and within 60 days. HHS proposed a major update to the Security Rule in early 2025, so check its current status.

### Third-party risk

Your suppliers hold your data and connect to your systems. So assess them in proportion to the risk.

@flow Inventory vendors > Tier by data and access > Assess > Contract > Monitor > Offboard

| Evidence | What it tells you |
|---|---|
| Questionnaire (SIG, CAIQ) | What they claim |
| SOC 2 Type I | Controls were designed well, on one date |
| SOC 2 Type II | Controls operated over a period |
| ISO 27001 certificate | A management system exists, for a stated scope |
| Penetration test summary | What a tester found, at a point in time |
| External ratings | An outside-in view, often shallow |

### Advanced: reading a SOC 2 properly

Don't stop at "they have one". Check the following:

- **Scope.** Does it cover the product you're buying?
- **Period.** Is it recent, and without gaps?
- **Exceptions.** Read the auditor's test results.
- **Subservice organisations.** Are their cloud provider's controls carved out?
- **Complementary user entity controls.** What must *you* do for this to hold?

Fourth parties matter as well: your vendor's vendor. [The 2023 MOVEit breach](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a) hit thousands of organisations through one file transfer product, many indirectly. So concentration risk is real: if everyone relies on one provider, one outage hits everyone. Contracts should give you notification deadlines, audit rights, and a clean exit.

?? What's the best way to reduce PCI DSS effort?
+ Keep card data off most systems
- Encrypt the audit report before sending
- Run one extra scan each year
- Buy a larger annual cyber policy
=> Scope drives cost. Using a hosted payment page or tokenisation removes systems from the assessment altogether.

## Threat model

| Technique | ATT&CK |
|---|---|
| Trusted relationship | [T1199](https://attack.mitre.org/techniques/T1199/) |
| Supply chain compromise | [T1195](https://attack.mitre.org/techniques/T1195/) |

Attackers often target a managed service provider, because one foothold reaches many clients. Vendor VPNs and remote support tools are a favourite path. See [Network architecture](/modules/07-04-network-architecture/) on limiting such access.

## Tools

| Tool | What it does | Reach for it when |
|---|---|---|
| PCI Self-Assessment Questionnaires | Self-evaluation | Smaller merchants |
| [CSA CAIQ](https://cloudsecurityalliance.org/research/cloud-controls-matrix) | Cloud vendor questionnaire | Assessing SaaS |
| SIG questionnaire | Standard vendor questions | Procurement |
| Content Security Policy, SRI | Control page scripts | Payment pages |
| Vendor inventory | Who holds what | The foundation |

## Defence

- **Design scope away** before you build controls.
- **Test segmentation** regularly, as PCI requires for those using it.
- **Tier vendors,** and spend effort where the risk is.
- **Use least privilege for vendor access,** with MFA, time limits and logging.
- **Write incident clauses** with short notification deadlines.
- **Plan for exit**, covering data return and deletion.
- **Keep watching.** Annual questionnaires go stale.

## Pitfalls

- **"Our payment provider is PCI compliant, so we are."** Their compliance doesn't cover your own side.
- **Storing CVVs in logs.** A debug log can put you out of compliance overnight.
- **Accepting a certificate without reading its scope.**
- **Questionnaire theatre.** Long forms with no follow-up prove little.
- **HIPAA as "encrypt and done".** Encryption matters, but the risk analysis is required.
- **Forgetting offboarding.** Old vendor accounts are a classic way in.

?? A vendor sends a clean SOC 2 Type II report. What should you still check?
+ Its scope, dates, exceptions and user controls
- Its logo, font and page numbering style
- Its auditor's favourite framework and home country
- Its price compared with the market average
=> A report only covers a defined system, period and set of tests, and it may rely on controls that you have to operate.

## Exercise

::: law Lab only
Use public documents and a fictional company. Don't send questionnaires to, or test, real vendors for this exercise.
:::

1. Read the PCI DSS quick reference guide. Sketch how a fictional shop could use a hosted payment page.
2. Draw the cardholder data flow for two designs. Mark which systems are in scope.
3. Add a Content Security Policy to a lab checkout page that allows only one script origin. Inject a test script, and watch it get blocked.
4. Write a five-tier vendor risk model, with what evidence you'd ask from each tier.
5. Find a public SOC 2 report or trust page. List what it does and doesn't tell you.

?! A critical SaaS vendor refuses to share a SOC 2 report. What are your options, and what would make you walk away?

## Further reading

- [PCI DSS document library](https://www.pcisecuritystandards.org/document_library/).
- [HHS HIPAA Security Rule](https://www.hhs.gov/hipaa/for-professionals/security/index.html).
- [NIST SP 800-161r1](https://csrc.nist.gov/pubs/sp/800/161/r1/final), on supply chain risk management.
- [CISA advisory on MOVEit](https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-158a).
- [Shared Assessments](https://sharedassessments.org/), the home of the SIG questionnaire.
