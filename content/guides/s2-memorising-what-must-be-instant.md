---
title: Memorising what must be instant
summary: Which security facts deserve memorising, how to write flashcards that work, how to set up Anki, and three memory techniques with evidence behind them.
group: Study skills
minutes: 15
source: Piotr Wozniak, Twenty rules of formulating knowledge | https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge
---
Most of cybersecurity is understanding: why a protocol fails, how an attack chain fits together. You can't flashcard your way to that. But some facts have to be *instant*. In an interview, during an incident or in an exam, nobody waits while you look up what port 445 is or what event 4625 means. This guide is about that small, important layer.

## What deserves a flashcard

Memorise a fact only if all three are true:

1. **You'll need it without warning**, and looking it up would break your flow or look bad.
2. **It's stable.** Port 22 won't change. A vendor's menu layout will.
3. **You already understand it.** A card should hold something you've learned, not replace learning it.

| Good candidates | Poor candidates |
|---|---|
| Common ports and their services | Every flag of every tool (that's what `man` and [tldr](https://tldr.sh/) are for) |
| Windows event IDs: 4624, 4625, 4688, 4720, 4769 | Whole RFC sections |
| ATT&CK tactic names and their order | Long lists you'd never recite at work |
| Linux permission bits (`rwx` = 4, 2, 1) | Facts you've only read about, never used |
| HTTP status classes, common headers | Anything a calculator does better, like subnet arithmetic |
| Glossary terms from your lessons | Vendor-specific screens and versions |

::: trap The common failure
People download a deck of 3,000 cards, add 100 a day, and quit by week three under a pile of reviews. Small and steady wins: 10 to 15 new cards a day is plenty. Write your own cards from your own lessons and mistakes. Writing them is half the learning.
:::

?? Which fact is the best candidate for a flashcard?
+ Event 4625 means a failed logon on Windows
- The exact menu path in this year's firewall
- Every single command-line option that nmap supports today
- A whole RFC section, copied word for word
=> Event 4625 is stable, needed without warning in a SOC, and short. Menus change, tool options belong in man pages, and long passages make poor cards.

## Writing cards that work

Piotr Wozniak, who created the first spaced repetition software, wrote twenty rules for formulating knowledge ([SuperMemo](https://www.supermemo.com/en/blog/twenty-rules-of-formulating-knowledge)). These are the ones that matter most for security:

- **Understand first, then memorise.** If you can't explain it, don't make a card yet.
- **The minimum information principle.** One card, one fact. "What does Kerberos do?" is a bad card. "Which Kerberos ticket does a client present to a service?" is a good one.
- **Use cloze deletions.** Take a true sentence and blank one word: "Event ID [...] records a successful logon." These are quick to write and quick to review.
- **Avoid sets.** "List all seven OSI layers" fails because you'll always miss one. Split it into ordered pairs: "Which layer sits above the transport layer?"
- **Fight interference.** Similar facts get confused, like 4624 and 4625. Make a card about the *difference*: "4624 is success; what is 4625?"
- **Add context.** A card about port 3389 is easier with a cue: "Remote access to Windows desktops: port?"

@term minimum information principle = Wozniak's rule that each flashcard should test one small fact, so it's quick to answer and easy to schedule.
@term cloze deletion = A flashcard made by blanking one word in a true sentence.

| Bad card | Better card |
|---|---|
| Q: Explain TLS 1.3 | Q: How many round trips does a full TLS 1.3 handshake take? A: One |
| Q: List the ATT&CK tactics | Q: Which ATT&CK tactic comes right after Initial Access? A: Execution |
| Q: What are SUID files? | Q: An `s` in the owner's execute slot means the file runs as …? A: Its owner |
| Q: Ports? | Q: SMB runs on TCP port …? A: 445 |

?? Why is "List all seven OSI layers" a poor flashcard?
+ It tests a whole set, so recall fails
- Nobody needs to know the OSI layers now
- Cards should never ask about networking at all
- It's far too short to be worth reviewing
=> Sets break the minimum information principle: you'll miss one item and fail the whole card. Several small cards about neighbouring layers work far better.

## Spaced repetition software

A spaced repetition program schedules each card just before you'd forget it. Get it right and the next gap grows; get it wrong and it comes back soon.

- **On this site**, every multiple-choice question you answer goes into [Review](/review/), and [Flashcards](/practice/flashcards/) turns the glossary of each lesson you've finished into recall cards on the same schedule.
- **[Anki](https://docs.ankiweb.net/)** is free on Windows, macOS, Linux and Android, and is the standard tool for your own cards. Recent versions include **FSRS**, a modern scheduling algorithm ([FSRS project](https://github.com/open-spaced-repetition/fsrs4anki)); you can turn it on in the [deck options](https://docs.ankiweb.net/deck-options.html).

Setup that works for most learners:

1. One deck, called something like *Security*, with tags per topic. Many small decks become a chore.
2. 10 to 15 new cards a day at most.
3. Review every day, ideally at the same time, for example with your morning coffee. It takes 10 to 15 minutes.
4. Be honest when grading. Pressing "Good" on a card you half-remembered only hurts you.
5. Suspend a card that keeps failing ("a leech"), then rewrite it smaller.

::: tip Make cards from mistakes
Every time you get a question wrong here, or need to look something up twice, write one card for it. Cards built from your own mistakes are the most valuable ones you'll ever have.
:::

## Three memory techniques with evidence

### Chunking

Working memory holds only a few items at once, but a *chunk* counts as one item. Group facts that belong together:

- **Ports by family**: mail is 25, 110, 143 and their secure versions 465 or 587, 995, 993. Web is 80 and 443, with 8080 and 8443 as their alternates.
- **Event IDs by series**: 4624 to 4634 are about logons and logoffs; 4720 to 4738 are about account changes; 4768 to 4776 are about Kerberos and NTLM authentication.

@term chunking = Grouping related items so that working memory treats them as one unit.

### Mnemonics

A memorable phrase can hold an ordered list. A common one for the OSI layers, from 1 up to 7, is "**P**lease **D**o **N**ot **T**hrow **S**ausage **P**izza **A**way": physical, data link, network, transport, session, presentation, application. Mnemonics are good for order and for arbitrary lists. They don't give understanding, so build the understanding first.

### The method of loci

The "memory palace": you imagine walking through a place you know well and leave each item to remember at a spot along the way. In a 2017 study, people with no memory training practised this method for six weeks. Their recall of word lists improved strongly, and four months later it was still well above where they started ([Dresler et al., 2017](https://doi.org/10.1016/j.neuron.2017.02.003)). It's worth trying for long ordered lists, like the 15 ATT&CK Enterprise tactics or the steps of an incident response plan.

@term method of loci = A memory technique in which items are placed at familiar locations along an imagined route, then recalled by walking it again.

?? You keep confusing events 4624 and 4625. Which fix follows Wozniak's rules?
+ Write one card that asks about their difference
- Delete both cards and stop studying Windows events
- Read the Microsoft page about each event repeatedly
- Put both events, every field, on one card
=> Similar facts interfere with each other. A card that targets the difference ("4624 is success; 4625 is…?") resolves the confusion. Big multi-fact cards make it worse.

## What not to memorise

Understanding beats recall wherever you can work something out. Don't memorise subnet tables: learn the method in [the subnetting lesson](/courses/0016-subnetting/) and practise the drill until it's fast. Don't memorise tool syntax you use daily; it sticks by itself. Don't memorise what you'll always have a reference for. That's what [the printable sheets](/sheets/) are for.

?! Write five flashcards from the last lesson you finished, following the rules above. Paste them into your AI tutor and ask it to criticise each one for the minimum information principle and for interference.

## Go further

- [Anki manual](https://docs.ankiweb.net/): the official documentation, short and readable.
- [Nicky Case, *How to Remember Anything Forever-ish*](https://ncase.me/remember/): an interactive explainer of spaced repetition.
- [Gwern, *Spaced repetition for efficient learning*](https://gwern.net/spaced-repetition): a long, heavily referenced essay.
- Previous: [How memory works](/guides/s1-how-memory-works/). Next: [Studying hands-on](/guides/s3-studying-hands-on/).
