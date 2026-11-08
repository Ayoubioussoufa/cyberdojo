---
title: Proxmark3
summary: A specialist device for researching RFID and NFC systems.
side: both
use: own
docs: https://github.com/RfidResearchGroup/proxmark3
kali: proxmark3
alt: flipper-zero
---
## What it's for
The Proxmark3 is the serious tool for RFID and NFC research, used by security researchers and access-control professionals. Where the Flipper is a friendly multi-tool, the Proxmark goes deep into card protocols.

## How it works
It can act as a reader or as a card, across both low and high frequency, and it exposes the low-level exchange between card and reader. That depth is what lets researchers study a card's security properly, including the weaknesses in older systems such as some early MIFARE cards, whose flaws are well documented and taught as cautionary tales.

## Try it
::: law Your cards only
Work only with cards and systems you own or are authorised to test.
:::

Read one of your own access cards, and identify its type and the protocol it uses. Compare an old card with a modern one, and note which protects the exchange with cryptography.

## What defenders see
For anyone running access control, the lesson is to choose cards with real cryptographic protection and to keep systems updated, since the weaknesses in old cards are public. For researchers, the Proxmark is how those weaknesses were found and demonstrated responsibly. [Hardware attacks and TEEs](/modules/15-07-hardware-attacks-and-tees/) gives the context.

?! Why is being able to see the low-level exchange between card and reader necessary for studying a card's security?
