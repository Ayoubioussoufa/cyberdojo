---
title: What security actually protects
summary: Three promises every system makes, and how to name which one broke in any incident you read about.
month: 0
minutes: 15
builds: classify real incidents the way a professional does
source: NIST glossary, the legal definitions of confidentiality, integrity and availability | https://csrc.nist.gov/glossary/term/confidentiality
words: confidentiality, integrity, availability
---
Before tools, before hacking, before a single command, there's one question: **what are we trying to protect?** Everything in this 24-month course hangs on the answer, so we start here.

@term information security (cybersecurity) = Keeping information and the systems that handle it safe from unauthorised access, change or disruption.
@term confidentiality = The promise that information is seen only by people allowed to see it.
@term integrity = The promise that information hasn't been changed without authorisation, and can be trusted.
@term availability = The promise that information and services work when the right people need them.
@term CIA triad (CIA) = The three core security promises: confidentiality, integrity and availability. Nothing to do with the American agency.

## Think of a bank account

Forget computers for a minute. You trust your bank to do three things:

1. **Nobody else can see your balance.** If a stranger can read it, the bank failed.
2. **The number is correct.** If someone quietly changed €1,000 to €10, the bank failed, even though nobody "saw" anything secret.
3. **You can get your money when you need it.** If the app is down on rent day, the bank failed, even though your money is safe and correct.

These are three different failures with three different fixes. Security professionals give them names:

| Promise | Everyday meaning | Broken when… |
|---|---|---|
| **Confidentiality** | Only the right people can **see** it | Medical records leak online |
| **Integrity** | Nobody can **change** it improperly | An invoice's bank details are altered |
| **Availability** | It **works** when needed | Ransomware locks a hospital's files |

Together they're called the **CIA triad**. The official US definitions say almost exactly this: [confidentiality](https://csrc.nist.gov/glossary/term/confidentiality) is "preserving authorized restrictions on information access and disclosure", [integrity](https://csrc.nist.gov/glossary/term/integrity) is "guarding against improper information modification or destruction", and [availability](https://csrc.nist.gov/glossary/term/availability) is "ensuring timely and reliable access to and use of information".

::: key
Every security incident breaks at least one of these three promises. When you read about an attack, your first question is always: **which promise broke?**
:::

?? A student changes their exam mark in the university database. Which promise broke?
+ Integrity, because the data was changed
- Confidentiality, because the data was seen
- Availability, because the data went away
- None, because nobody lost any money
=> The mark was altered without authorisation, so the data can no longer be trusted. The student probably saw it too, but the harm is the change.

## One incident can break several

Real attacks rarely stay in one box. Take ransomware, a program that locks your files and demands payment to unlock them. At first glance it's an availability attack: nobody can open their files. But modern ransomware gangs usually copy the data first and threaten to publish it. That's confidentiality as well.

So don't look for "the" answer. Look for the **main harm**, and name the others too. That habit is what makes your incident reports precise later.

@term ransomware = Malicious software that locks a victim's files or systems and demands payment, often after also stealing the data.

::: trap
Availability doesn't need an attacker. A power cut, a failed disk or a bad software update all break availability. Security isn't only about villains: it's about the promise being kept.
:::

@drill cia

?? A hospital's scheduling system is flooded with fake traffic and nobody can book appointments. No data was read or changed. What broke?
+ Availability, because nobody could use the service
- Integrity, because the traffic itself was fake
- Confidentiality, because attackers reached the whole system
- Integrity, because the bookings became wrong instantly
=> The data is intact and private, but the service doesn't work when needed. This kind of flood is called a denial-of-service attack.

@term denial of service (DoS) = An attack that makes a service unusable, for example by flooding it with traffic.

## Three more words you'll need

Knowing *what* to protect leads straight to *how*. When you log in to anything, three separate things happen:

- **Authentication**: proving who you are. "I'm Ana, here's my password."
- **Authorization**: deciding what you may do. "Ana can read this file but not delete it."
- **Accounting**: recording what you did. "Ana opened this file at 09:14."

@term authentication (authN) = Proving who you are, for example with a password or a security key.
@term authorization (authZ) = Deciding what an authenticated person is allowed to do.
@term accounting = Recording who did what and when, usually in logs.

Think of a hotel. Showing your passport at reception is authentication. Your key card opening only your own room is authorization. The door's record of when it was opened is accounting.

::: why
Mixing these up causes real breaches. Many web apps check that you're logged in (authentication) and forget to check that the invoice you asked for is really yours (authorization). In Month 8 you'll learn to find and fix exactly that mistake, called an IDOR.
:::

?? A website lets any logged-in user open any other user's invoice by changing a number in the URL. What's missing?
+ Authorization, because ownership is never checked
- Authentication, because the login seems weak
- Accounting, because nobody saves the visits
- Availability, because other invoices can load
=> The user proved who they are, so authentication worked. The site never asked "is this invoice yours?", and that's an authorization failure.

?! In your own words, why can a system be perfectly available and confidential and still be badly broken?

## What you can do now

You can read any security headline and say which promise broke. Try it on the next news story you see. That single habit puts you ahead of most people who talk about security.

Next, before we touch anything technical, we cover the rules that keep you out of prison.
