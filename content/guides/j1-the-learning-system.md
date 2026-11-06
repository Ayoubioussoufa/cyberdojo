---
title: The learning system
summary: How to organise your notes, retain what you learn for years, avoid course-hopping and keep evidence of your growth.
group: Habits
minutes: 8
source: Obsidian, a free local notes app | https://obsidian.md/
---
Two years of study only compounds if it's written down and revisited.

## The vault (Obsidian or Notion; local Markdown is preferred)

| Folder | What goes in it | Rule |
|---|---|---|
| `00-Inbox` | Anything captured in a hurry | Emptied every Sunday |
| `10-Concepts` | One note per concept, like Kerberos or TLS | Your own words, one example, one "how it fails" line |
| `20-Tools` | One note per tool: purpose, install, your 10 commands, gotchas | Only tools you've used |
| `30-Labs` | One note per lab session | Written during the lab, never reconstructed |
| `40-Writeups` | Drafts of public write-ups | One published a month |
| `50-Projects` | Planning, decisions, open questions, evidence | Each project has a decision log |
| `60-Cheatsheets` | Condensed references you maintain | Built from your own mistakes |
| `70-Career` | CVs, applications, contacts, interview answers | Reviewed monthly |
| `80-AI-log` | Claim, source checked, verdict, error type | One line per claim, reviewed quarterly |
| `90-Templates` | [Note templates](/guides/n1-templates/) | Used every time |

## Retention: how to still know this in a year

- **Spaced repetition, sparingly.** Use [the Review page](/review/) here, or Anki with at most 10–15 new cards a day, only for what must be instant: event IDs, ports, ATT&CK tactics, definitions. Cards come from your own mistakes.
- **Active recall over re-reading.** After every session, close everything and write three sentences on what you learned and one question you still have.
- **Teach it.** Explain each month's topic to a peer or a five-minute recording. What you can't explain, you haven't learned.
- **Interleave.** Every unguided lab should include one skill from a previous month.
- **Rebuild from memory.** Once per phase, rebuild a piece of your lab without notes. Painful, fast, and the best diagnostic there is.

@term spaced repetition = Reviewing something just as you're about to forget it, at growing intervals.
@term active recall = Pulling knowledge out of your memory rather than rereading it.

## Rules against course-hopping

- **One primary course or platform per month.** Everything else goes on a "later list".
- **No new course** until this month's milestones and write-up are done.
- **The 2:1 rule.** Two hours of hands-on work for every hour of video. Watching isn't studying.
- **Finish or delete.** A course abandoned twice is deleted, not a debt.
- **One tool at a time.** The transferable knowledge is the log sources and the queries, not the vendor.

## GitHub and your evidence trail

| Repository | Contents |
|---|---|
| `cyber-journey` (public) | A learning log with one entry a week, cheat sheets, retrospectives, links to every project. Many interviewers read it |
| One repo per project | P01–P16 and the capstone, each with README, diagrams, code, reports and limitations. Six pinned |
| `notes` (private) | A Git-synced copy of your vault: backup, history, portability |
| Contribution history | Real commits spread over two years tell a story no CV bullet can fake |

## The four rituals

- **Daily (5 min):** log hours by category and note tomorrow's first task.
- **Weekly (30 min, Sunday):** empty the inbox, update the log, review the AI log, set three priorities.
- **Monthly (60 min):** test against the gate, publish a write-up, write the retrospective, update the CV.
- **Quarterly (2 h):** re-score the skill matrix, review the portfolio as a stranger would, adjust the plan, check the last three months produced artifacts, not just activity.

?? You've just finished a video on DNS. Which step builds memory best?
+ Close everything and write down what you learned
- Watch the same video again at higher speed
- Highlight the transcript in three very different colours
- Bookmark it so you can review it later
=> Pulling knowledge out of memory is what strengthens it. Rereading only feels productive.

?! What's the one rule here you're most likely to break? What will you do when you notice?
