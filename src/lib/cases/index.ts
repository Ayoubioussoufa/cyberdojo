/** Branching cases. Each decision changes the story, and each one is explained. */
import type { CaseFile } from "./types";

export type { CaseFile, CaseNode, Choice } from "./types";

const HOSTS = ["FIN-LAP-03", "HR-LAP-12", "ENG-LAP-41", "OPS-LAP-07"];
const PEOPLE = ["Sara", "Omar", "Lina", "Youssef", "Nadia", "Karim"];
const IPS = ["203.0.113.7", "198.51.100.77", "192.0.2.150"];

export const CASES: CaseFile[] = [
  {
    id: "night-shift",
    title: "The 3 a.m. login",
    role: "SOC analyst, night shift",
    blurb: "An admin account has just logged in from another country. It could be nothing, or it could be the start of your worst week.",
    month: 9,
    minutes: 8,
    lesson: "0051-how-a-soc-works",
    vars: { person: PEOPLE, ip: IPS, host: ["SRV-FILE-01", "SRV-DB-01"] },
    start: "alert",
    debrief: "Experts gather context first, and act fast once the evidence is clear. The login alone proved little. The failures before it, the new account after it, and {person}'s own word made it a true positive. Disabling the account quickly mattered, but so did keeping the evidence, and escalating with a clear summary.",
    nodes: [
      {
        id: "alert",
        text: "03:12. An alert fires: admin account `{person}.admin` logged in to {host} from {ip}, an address in a country where you have no staff. It's quiet, and you're alone on shift.",
        evidence: "ALERT  Admin logon from unusual country\nUser: {person}.admin   Host: {host}   Source: {ip}   Time: 03:11:48 UTC",
        choices: [
          { label: "Look at what else this account and address have done", to: "context", score: 2, note: "Good. One alert is a claim, and you need evidence before you act. A few minutes of context changes everything." },
          { label: "Disable the account straight away", to: "disabled-early", score: 0, note: "Fast, but you've acted blind. If this is a real admin fixing a production issue, you've just caused an outage at 3 a.m." },
          { label: "Close it: admins travel", to: "closed", score: -3, note: "That's a guess, not a verdict. Closing an alert with no evidence is how real intrusions are missed." },
        ],
      },
      {
        id: "disabled-early",
        text: "You disable the account. Two minutes later, the phone rings. It's the on-call engineer, furious: was that you? They weren't using that account, but they need to know why it's disabled. You still don't know whether this was an attack.",
        choices: [
          { label: "Ask them to wait, and go and find the evidence now", to: "context", score: 1, note: "Good recovery. You've bought yourself safety, so now do the investigation you skipped." },
          { label: "Re-enable the account, to keep them happy", to: "reenabled", score: -2, note: "You've reversed a safety step with no evidence either way. If this was an attacker, they're back in." },
        ],
      },
      {
        id: "reenabled",
        text: "The account is live again. An hour later, the alert queue fills: a new account, then a large transfer out of {host}. It was real.",
        choices: [{ label: "Now escalate everything you've got", to: "late", score: 0, note: "Right, though much later than it needed to be." }],
      },
      {
        id: "closed",
        text: "You close it, and go back to the queue. At 04:40, a second alert: a new local admin account on {host}. Then a third: 3 GB leaving for {ip}. The first alert was the warning.",
        choices: [{ label: "Reopen it, and escalate now", to: "late", score: 0, note: "Correct, and it's never too late to escalate. Your note on the first alert will be read closely tomorrow." }],
      },
      {
        id: "context",
        text: "You query the SIEM for that address and that account over the last 24 hours.",
        evidence: "03:02  4625 failed logon   {person}.admin   {ip}   (x61)\n03:11  4624 logon success   {person}.admin   {ip}\n03:14  4720 new user created: backup_svc2   by {person}.admin\n03:15  4732 backup_svc2 added to Administrators on {host}",
        choices: [
          { label: "Disable both accounts, and escalate to Tier 2 with this evidence", to: "contained", score: 3, note: "Exactly. Failures, then a success, then a new admin: that's a chain, not a coincidence. Now you act, and you escalate with the proof." },
          { label: "Message {person} on chat to ask whether it was them", to: "chat", score: 1, note: "Worth checking, but if the account is compromised, so might be their chat. Use a phone number that you trust, and don't wait to contain." },
          { label: "Watch for an hour, to learn more about the attacker", to: "watched", score: -2, note: "Watching can be a valid choice, but it's a decision for a manager, not one analyst at 3 a.m. Meanwhile they've got admin rights." },
        ],
      },
      {
        id: "chat",
        text: "You get a reply within seconds: \"yes that was me, all good, don't worry about it :)\". But it's 3 a.m. where {person} lives, and they never use smileys.",
        choices: [
          { label: "Phone them on the number in the staff directory", to: "phone", score: 2, note: "Good instinct. If a channel could be compromised, verify through a different one." },
          { label: "Accept that, and close the alert", to: "closed", score: -3, note: "The reply came from the same identity that you're investigating. It proves nothing." },
        ],
      },
      {
        id: "phone",
        text: "{person} answers, half asleep. They've been in bed for hours, and they've sent no messages. Their account is compromised, and the attacker has just talked to you.",
        choices: [{ label: "Disable both accounts, and escalate at once", to: "contained", score: 2, note: "Yes. And note the chat message in your report: it shows that the attacker controls more than one system." }],
      },
      {
        id: "watched",
        text: "While you watch, the account connects to two more servers, and 3 GB leaves for {ip}. Your manager asks who decided to wait.",
        choices: [{ label: "Disable the accounts and escalate now", to: "late", score: 0, note: "Right. The lesson is who makes that call: containment trade-offs belong to a manager, and to a written plan." }],
      },
      {
        id: "contained",
        text: "Tier 2 picks it up within minutes, with your evidence attached. They isolate {host}, and find the attacker's tools, already in place but not yet used. Nothing has left the network. In the morning, your manager reads your notes and asks you to present them to the team.",
        end: "good",
      },
      {
        id: "late",
        text: "The incident is contained by dawn, but 3 GB of data has left, and legal has to get involved. In the review, the timeline shows that the first alert came 90 minutes before the data left.",
        end: "bad",
      },
    ],
  },
  {
    id: "invoice",
    title: "The urgent invoice",
    role: "Security analyst",
    blurb: "A finance clerk forwards a strange email. It looks perfectly written. The money is due to go out at noon.",
    month: 9,
    minutes: 7,
    lesson: "0054-phishing-analysis",
    vars: { person: PEOPLE, amount: ["84,500", "126,000", "47,900"], domain: ["oasis-group.example", "oasis-finance.example"] },
    start: "report",
    debrief: "This was business email compromise: no malware and no link, only a plausible request. Authentication results and the Reply-To gave it away, but the check that truly mattered was a phone call on a known number. Then scoping found the others.",
    nodes: [
      {
        id: "report",
        text: "11:05. {person} in finance forwards an email from the CEO, asking for {amount} € to be paid to a new supplier before noon. {person} thinks it's odd, but the writing is flawless, and the CEO is travelling.",
        evidence: "From: \"CEO\" <ceo@{domain}>\nReply-To: ceo.private@mailbox.example\nSubject: Confidential: payment needed before noon\nAuthentication-Results: spf=pass dkim=pass dmarc=pass header.from={domain}",
        choices: [
          { label: "Compare the sender's domain with your real one", to: "domain", score: 2, note: "Yes. All three checks passed, but passing only proves that this domain sent it. Which domain is it?" },
          { label: "Tell {person} that it's safe, since DMARC passed", to: "paid", score: -3, note: "The most common mistake. Authentication says who sent it, not that they're honest. A lookalike domain passes everything." },
          { label: "Reply to the email and ask the CEO to confirm", to: "replied", score: -2, note: "A reply goes to the Reply-To address, straight to the fraudster. They'll happily confirm." },
        ],
      },
      {
        id: "replied",
        text: "Within minutes: \"Yes, please proceed, I'm boarding a flight and can't talk. Keep this confidential.\" {person} is now under pressure to pay.",
        choices: [
          { label: "Stop the payment, and phone the CEO's assistant", to: "phone", score: 2, note: "Good recovery. Urgency and secrecy together are the signature of this fraud." },
          { label: "Let the payment go: the CEO confirmed", to: "paid", score: -3, note: "The confirmation came through the attacker's own channel. It's worth nothing." },
        ],
      },
      {
        id: "domain",
        text: "Your company's real domain is `oasis.example`. This one is `{domain}`, registered nine days ago.",
        choices: [
          { label: "Have {person} hold the payment, and check through a known phone number", to: "phone", score: 3, note: "Exactly. A separate, trusted channel defeats a convincing message." },
          { label: "Block the domain, and consider it finished", to: "blocked-only", score: 1, note: "Useful, but who else got this? And is the payment still going out?" },
        ],
      },
      {
        id: "blocked-only",
        text: "You block the domain. At 11:50, {person} asks: \"so should I still pay it?\" You hadn't told them to stop.",
        choices: [{ label: "Tell them to stop, and phone the CEO's assistant", to: "phone", score: 1, note: "Close call. When money's moving, stopping it comes first." }],
      },
      {
        id: "phone",
        text: "The CEO's assistant confirms that no such payment exists. The money stays put. {person} did exactly the right thing by reporting it.",
        choices: [
          { label: "Search the mail logs for everyone who received mail from that domain", to: "scope", score: 3, note: "The step that people forget. One report usually means many recipients." },
          { label: "Close the ticket: the payment was stopped", to: "unscoped", score: -1, note: "This one was stopped, but you don't know about the others." },
        ],
      },
      {
        id: "unscoped",
        text: "Two days later, accounts payable finds a second email in a colleague's inbox, from the same domain. That one was paid: 31,200 €.",
        end: "mixed",
      },
      {
        id: "scope",
        text: "Three other people got the same email. One had already started a transfer, which the bank recalls in time. You pull all the messages, block the domain, and thank {person} publicly for reporting it.",
        end: "good",
      },
      {
        id: "paid",
        text: "{person} sends {amount} €. At 14:00, the CEO lands, and asks what that payment was. The bank says that it might recover part of it, if you move fast. You should have called.",
        end: "bad",
      },
    ],
  },
  {
    id: "ransom",
    title: "The locked file server",
    role: "Incident responder",
    blurb: "Staff can't open their files, and a note has appeared. The director wants answers, and your choices decide what's left to save.",
    month: 11,
    minutes: 10,
    lesson: "0059-incident-response",
    vars: { host: ["SRV-FILE-01", "SRV-FILE-02"], person: PEOPLE, deadline: ["48 hours", "72 hours"] },
    start: "calls",
    debrief: "Good responders protect what's left before fixing what's broken: isolate, protect backups, keep evidence, and get the right people involved. Rebuilding from a tested backup, after finding how they got in, is what ends an incident. Wiping early or paying first both leave you blind.",
    nodes: [
      {
        id: "calls",
        text: "08:30. The help desk has 14 calls: nobody can open files on {host}. Each folder now holds a note saying that data will be published in {deadline} unless you pay.",
        choices: [
          { label: "Disconnect {host} from the network, but leave it powered on", to: "isolated", score: 3, note: "Right. It stops the spread, and keeps memory intact, which may hold keys and evidence." },
          { label: "Power {host} off immediately", to: "poweroff", score: 0, note: "It stops the encryption, but memory is lost, and memory might have held the attacker's tools or even keys." },
          { label: "Restore last night's backup over it, right now", to: "restore-now", score: -3, note: "You don't yet know how they got in, or if the backup is clean. You may be restoring onto a machine that they still control." },
        ],
      },
      {
        id: "restore-now",
        text: "The restore starts. An hour in, files start locking again: the attacker is still inside, and their tools are still running. You've also overwritten evidence.",
        choices: [{ label: "Stop, and isolate the server now", to: "isolated-late", score: 1, note: "Right, though a good deal has been lost by now." }],
      },
      {
        id: "poweroff",
        text: "The server is off, and the spread has stopped there. You can't get its memory back, but the disk is intact.",
        choices: [{ label: "Check the backups next", to: "backups", score: 1, note: "Good. Ransomware crews go after backups first, so make sure they're safe." }],
      },
      {
        id: "isolated",
        text: "{host} is off the network, and running. Your phone rings: the director wants to know what happened. Meanwhile, you've got a decision to make about the backups, which sit on a server joined to the same domain.",
        choices: [
          { label: "Take the backup server off the network too", to: "backups", score: 3, note: "Yes. If they've got domain admin, they can reach a domain-joined backup server. Protect it before anything else." },
          { label: "Spend ten minutes briefing the director first", to: "backups-hit", score: -1, note: "Communication matters, but seconds matter more here. A brief can wait for what's about to be lost." },
        ],
      },
      {
        id: "isolated-late",
        text: "It's contained now, but the attacker saw you coming. You check the backups, and the newest two copies have been deleted.",
        choices: [{ label: "Bring in legal and leadership", to: "leadership", score: 1, note: "Yes. This is now a business decision as well as a technical one." }],
      },
      {
        id: "backups-hit",
        text: "As you hang up, the backup server starts deleting its copies. You pull it off the network, but the last week's backups have gone. There's an older offline copy, 9 days old.",
        choices: [{ label: "Bring in legal and leadership", to: "leadership", score: 1, note: "Right. Nine days of lost work is a business decision, not an IT one." }],
      },
      {
        id: "backups",
        text: "The backups are safe. Then the event logs show the entry point: a VPN login for `{person}` from an unknown address, three weeks ago. The attacker has been inside for 21 days.",
        evidence: "Oct 06 02:14  VPN login     {person}   203.0.113.7   no MFA on this account\nOct 06 02:31  RDP to SRV-APP-02\nOct 21 01:07  New domain admin: helpdesk3\nOct 27 05:50  Mass file changes on {host}",
        choices: [
          { label: "Bring in legal and leadership, then plan a full recovery", to: "leadership", score: 3, note: "Exactly. Three weeks inside means that this is far larger than one server, and personal data may be involved." },
          { label: "Just reset {person}'s password and rebuild {host}", to: "partial", score: -2, note: "That removes one door. There's a new domain admin that you haven't touched." },
        ],
      },
      {
        id: "partial",
        text: "{host} is back by evening, and everyone relaxes. A week later, a second server locks. `helpdesk3` was never removed.",
        end: "bad",
      },
      {
        id: "leadership",
        text: "Legal asks whether personal data was touched, because the GDPR may give you 72 hours to notify. The director asks: \"should we just pay?\"",
        choices: [
          { label: "Lay out the facts and options, and let leadership and legal decide", to: "decide", score: 3, note: "Right. Paying is a business and legal decision. Your job is to give them accurate facts: it doesn't guarantee recovery, and it may be unlawful for some groups." },
          { label: "Say firmly that you should pay, to end it quickly", to: "pay", score: -2, note: "That's not your decision, and paying doesn't guarantee a working key, or that the data gets deleted." },
        ],
      },
      {
        id: "pay",
        text: "They pay. The key works on some files, and fails on others. Two weeks later, part of the data appears online anyway.",
        end: "bad",
      },
      {
        id: "decide",
        text: "Leadership decides not to pay. You remove the attacker's accounts, reset credentials across the domain, rebuild from a backup you've tested, and enforce MFA on the VPN. Legal notifies the regulator on time. In the review, nobody is blamed, and four actions get owners and dates.",
        end: "good",
      },
    ],
  },
  {
    id: "leaked-key",
    title: "A key on GitHub",
    role: "Cloud security engineer",
    blurb: "A stranger emails to say that your company's cloud key is in a public repository. Every minute counts, but so does the order.",
    month: 14,
    minutes: 7,
    lesson: "0064-cloud-detection-and-posture",
    vars: { person: PEOPLE, repo: ["acme-scripts", "ops-helpers"], key: ["AKIAEXAMPLE7Q2", "AKIAEXAMPLE9LM"] },
    start: "email",
    debrief: "Stop the access first, keep the evidence, look for what was created while it was live, then fix why it happened. Bots find keys in minutes, so assume that it was used. Deleting the repository hides the problem from you, not from them.",
    nodes: [
      {
        id: "email",
        text: "10:40. A researcher emails: `{key}` has been in a public repository, `{repo}`, for six hours. It belongs to `ci-bot`, which {person} set up. It has admin rights.",
        choices: [
          { label: "Deactivate the key now", to: "deactivated", score: 3, note: "Right. Stop the bleeding first. Deactivating keeps the key's record, so you can still investigate." },
          { label: "Ask {person} to delete the repository", to: "repo-deleted", score: -2, note: "Bots copy keys within minutes, so that's useless. And the key still works." },
          { label: "Open a ticket for the next maintenance window", to: "waited", score: -3, note: "An admin key has been public for six hours. This isn't a maintenance task." },
        ],
      },
      {
        id: "repo-deleted",
        text: "The repository is gone, and {person} is relieved. But the key still works, and the logs show that it was used from an unknown address only minutes ago.",
        choices: [{ label: "Deactivate the key now", to: "deactivated", score: 1, note: "Yes. You've lost some time, but this was the step that mattered." }],
      },
      {
        id: "waited",
        text: "By the afternoon, your bill alert fires: 40 large servers have started in a region that you don't use. Somebody's mining with your key.",
        choices: [{ label: "Deactivate the key, and start the incident process", to: "deactivated", score: 0, note: "Correct, and costly. Cost alerts are security alerts." }],
      },
      {
        id: "deactivated",
        text: "The key is off. Nothing that your company runs has broken yet. Now you open CloudTrail.",
        evidence: "04:48  GetCallerIdentity   ci-bot   203.0.113.7\n04:51  CreateUser          ci-bot   203.0.113.7   userName=support-tmp\n04:52  AttachUserPolicy    ci-bot   203.0.113.7   AdministratorAccess\n04:52  CreateAccessKey     ci-bot   203.0.113.7   userName=support-tmp\n04:55  StopLogging         support-tmp  203.0.113.7",
        choices: [
          { label: "Disable `support-tmp` and its key, then restart logging", to: "evicted", score: 3, note: "Exactly. Killing the first key achieves little if they've made a second. They always try." },
          { label: "Close it: the leaked key is off now", to: "still-in", score: -3, note: "Read the log again. They made their own admin user, with its own key, and turned off logging." },
        ],
      },
      {
        id: "still-in",
        text: "A week later, your data appears on a leak site. `support-tmp` was still active, and with logging off, you can't even see what they took.",
        end: "bad",
      },
      {
        id: "evicted",
        text: "The attacker's user is gone, and logging is back. There's a gap in your logs from 04:55 to now. Legal asks: what did they read?",
        choices: [
          { label: "Say honestly what's known, what isn't, and why", to: "honest", score: 3, note: "Right. If data events weren't on, you can't prove what was read. An honest gap is better than a false reassurance." },
          { label: "Tell legal that nothing was read, as nothing's in the logs", to: "overclaim", score: -3, note: "No logs doesn't mean no reads. Stating that as fact could turn a security incident into a legal one." },
        ],
      },
      {
        id: "overclaim",
        text: "The company tells customers that no data was accessed. Three weeks later, some of it surfaces. Now there's a second problem: a false statement.",
        end: "bad",
      },
      {
        id: "honest",
        text: "Legal treats it as a possible breach, and handles it properly. Then the fixes: `ci-bot` gets a narrow role through OIDC, with no key to leak. Secret scanning blocks commits. Alerts fire on `StopLogging` and `CreateUser`. {person} helps write it all up, and nobody is blamed.",
        end: "good",
      },
    ],
  },
  {
    id: "evidence",
    title: "The manager's laptop",
    role: "Digital forensics analyst",
    blurb: "HR suspects that a manager copied client files before resigning. The evidence may end up in court, so how you handle it counts as much as what you find.",
    month: 15,
    minutes: 7,
    lesson: "0065-forensic-principles",
    vars: { person: PEOPLE, drive: ["SanDisk USB", "Kingston USB"], file: ["clients-2026.xlsx", "pricing-master.xlsx"] },
    start: "handed",
    debrief: "Forensics is judged on discipline. You preserved first, worked on copies, recorded each step, and kept to what the evidence shows. A USB artifact proves that a device was connected, and a file was opened. It doesn't prove intent, and saying so is what makes the rest believable.",
    nodes: [
      {
        id: "handed",
        text: "HR puts {person}'s laptop on your desk. It's powered on, and logged in. \"Just have a quick look at what they copied,\" says the HR manager.",
        choices: [
          { label: "Don't browse. Capture memory, then image the disk, and record it all", to: "captured", score: 3, note: "Right. Memory disappears first, and browsing changes evidence. Order of volatility, then integrity." },
          { label: "Open their Documents folder, to have a quick look", to: "browsed", score: -3, note: "Every file that you open changes its timestamps. You've just altered the evidence you were asked to examine." },
          { label: "Shut it down, so that nothing changes", to: "shutdown", score: 0, note: "It protects the disk, but you've lost everything in memory, including any open sessions." },
        ],
      },
      {
        id: "browsed",
        text: "You open a few files. Later, a lawyer points out that the last-accessed times match your visit, not {person}'s. Part of your evidence is now in doubt.",
        choices: [{ label: "Write down exactly what you did, and when", to: "disclosed", score: 2, note: "Right. An honest record of a mistake does far less harm than one that gets discovered." }],
      },
      {
        id: "disclosed",
        text: "You note your error, then image the disk and hash it. The case can go on, but its weak spot is now on record.",
        choices: [{ label: "Examine the copy", to: "artifacts", score: 1, note: "Good: always a copy from here on." }],
      },
      {
        id: "shutdown",
        text: "The laptop is off. You image the disk through a write blocker, and record the hash.",
        choices: [{ label: "Examine the copy", to: "artifacts", score: 1, note: "Good. You've lost the memory, but the rest is sound." }],
      },
      {
        id: "captured",
        text: "You've got memory and a disk image. Both are hashed, and the custody form is signed. You'll work only on copies.",
        choices: [{ label: "Look for signs of USB use", to: "artifacts", score: 2, note: "Good, and the hash lets you prove later that nothing changed." }],
      },
      {
        id: "artifacts",
        text: "You find this in the registry and in LNK files.",
        evidence: "USBSTOR    {drive}   first connected 2026-10-24 18:02 UTC\nLNK file   E:\\{file}   created 2026-10-24 18:09 UTC\nMFT        C:\\Clients\\{file}   last accessed 2026-10-24 18:08 UTC",
        choices: [
          { label: "Report what each artifact shows, and what it can't show", to: "careful", score: 3, note: "Exactly. A device was connected, and a file with that name opened from it. Who was at the keyboard, and why, are separate questions." },
          { label: "Report that {person} stole the file", to: "overclaim", score: -3, note: "\"Stole\" is a conclusion about intent, and the evidence doesn't reach that far. Conclusions like this fall apart under questioning." },
        ],
      },
      {
        id: "overclaim",
        text: "In the hearing, {person}'s lawyer asks: \"How do you know who was using the laptop?\" You don't. The tribunal starts to doubt the rest of your report too.",
        end: "mixed",
      },
      {
        id: "careful",
        text: "Your report separates facts from inferences, and your hashes still match. When {person}'s lawyer challenges it, there's nothing to attack. The company settles the matter on the strength of your work.",
        end: "good",
      },
    ],
  },
  {
    id: "board",
    title: "The risk you can't patch",
    role: "GRC analyst",
    blurb: "A critical system can't be patched for six months, and the operations director wants you to sign it off. Whose decision is this?",
    month: 12,
    minutes: 6,
    lesson: "0060-risk-assessment",
    vars: { system: ["the warehouse scanner server", "the old ERP gateway"], person: PEOPLE },
    start: "meeting",
    debrief: "Security advises and the business decides. Your job was to express the risk in business terms, offer real options, and make sure that the decision was made by the right person, in writing, with a date to look at it again.",
    nodes: [
      {
        id: "meeting",
        text: "{system} has a critical flaw. The vendor's fix needs six months of testing. Operations director {person} says: \"Just mark it as accepted, and we'll move on.\"",
        choices: [
          { label: "Ask what stopping it would cost, and bring options", to: "options", score: 3, note: "Right. You can't weigh a risk without the business impact, and there's usually more than one option." },
          { label: "Sign it off yourself, to keep things moving", to: "signed", score: -3, note: "An analyst can't accept a business risk. If it goes wrong, nobody with authority ever decided." },
          { label: "Refuse, and insist that it's patched this week", to: "refused", score: -1, note: "Security can't simply overrule the business. A week-long outage of a key system may do more harm than the risk." },
        ],
      },
      {
        id: "refused",
        text: "The meeting turns hostile. The patch doesn't happen, and you're no longer invited to these meetings.",
        choices: [{ label: "Go back with options instead of a demand", to: "options", score: 1, note: "Good: you'll influence more with options than with orders." }],
      },
      {
        id: "signed",
        text: "Eight months later, an auditor asks who approved it. Your name is on a form, for a decision that you had no authority to make.",
        end: "bad",
      },
      {
        id: "options",
        text: "A day's outage costs about 120,000 €. Your options:",
        evidence: "A. Patch now, and risk an untested fix on a key system\nB. Isolate it on its own network segment, with monitoring, and patch in six months\nC. Accept it unchanged\nD. Replace the system: 400,000 € and 18 months",
        choices: [
          { label: "Recommend B, in writing, for the risk owner to decide", to: "recommend", score: 3, note: "Yes: a compensating control brings the risk down until the proper fix is ready, and the owner still makes the decision." },
          { label: "Pick D, because it removes the risk completely", to: "overkill", score: -1, note: "It may be right in the long term, but it does nothing for the next 18 months, and it costs far more than the risk may justify." },
        ],
      },
      {
        id: "overkill",
        text: "The director laughs, and asks whether you've seen the budget. The system stays exposed while everyone argues.",
        choices: [{ label: "Return with option B", to: "recommend", score: 1, note: "Good: proportion is what makes advice useful." }],
      },
      {
        id: "recommend",
        text: "{person} agrees to option B, and asks what you need from them.",
        choices: [
          { label: "A signed risk acceptance, with an owner, a reason and a review date", to: "recorded", score: 3, note: "Exactly. Accepted risks need an accountable owner, and a date, or they last forever." },
          { label: "Nothing: a verbal agreement is fine", to: "unrecorded", score: -2, note: "Without a record, nobody will remember in six months, and nothing will force a review." },
        ],
      },
      {
        id: "unrecorded",
        text: "Six months pass. The patch never happens, because nobody owns it. The next audit finds it.",
        end: "mixed",
      },
      {
        id: "recorded",
        text: "The system is isolated within a week. Your register shows the owner, the residual risk, and a review date. The patch goes in on schedule, and the auditor uses your entry as an example of how it should be done.",
        end: "good",
      },
    ],
  },
  {
    id: "assistant",
    title: "The helpful assistant",
    role: "AI security engineer",
    blurb: "Your company's new support bot launches on Friday. The product team says that it's safe, because its prompt tells it to be careful.",
    month: 18,
    minutes: 7,
    lesson: "0071-securing-ai-applications",
    vars: { person: PEOPLE, tool: ["send_email", "post_webhook"] },
    start: "review",
    debrief: "Prompts are requests, not controls. Real safety came from what the assistant couldn't do: per-user data access, no outbound tool without approval, and logs. And your claim was backed by a measured rate over many trials, not by one demo.",
    nodes: [
      {
        id: "review",
        text: "{person} shows you the design: it reads public tickets, can look up any customer, and has a `{tool}` tool. \"It's fine,\" they say. \"The system prompt says never to share customer data.\"",
        choices: [
          { label: "Map the trifecta: data, untrusted content, a way out", to: "trifecta", score: 3, note: "Right. Tickets are written by strangers, the data is private, and `{tool}` is an exit. All three legs are there." },
          { label: "Approve it, since the prompt covers this", to: "launched", score: -3, note: "The model can't reliably tell instructions from data. A prompt is a request, and it isn't a control." },
          { label: "Add a keyword filter for words like 'ignore'", to: "filter", score: 0, note: "Filters can help as one layer, but attackers reword things, and there's no way out of that race." },
        ],
      },
      {
        id: "filter",
        text: "You add the filter. In testing, a ticket in French gets straight past it.",
        choices: [{ label: "Step back, and map the trifecta", to: "trifecta", score: 1, note: "Good. Fix the design, then add filters as an extra layer." }],
      },
      {
        id: "launched",
        text: "On Monday, a customer's ticket contains a note addressed to the assistant. It looks up 900 customers, and sends them to an outside address. Nobody sees it for four days, as tool calls weren't logged.",
        end: "bad",
      },
      {
        id: "trifecta",
        text: "{person} pushes back: \"Can you actually show it's exploitable? We launch on Friday.\"",
        choices: [
          { label: "Write a test with a canary, and run it 20 times", to: "measured", score: 3, note: "Exactly. A rate over many trials ends the argument, and it's your baseline for measuring any fix." },
          { label: "Run it once, and show them if it works", to: "once", score: 0, note: "One success can be dismissed as luck, and one failure proves nothing. Models vary." },
        ],
      },
      {
        id: "once",
        text: "The attack fails on your one try. {person} says: \"See? Told you.\"",
        choices: [{ label: "Run it 20 times, and record the rate", to: "measured", score: 2, note: "Right. A single run tells you almost nothing." }],
      },
      {
        id: "measured",
        text: "It leaked the canary in 13 of 20 runs. {person} suggests a stronger prompt. You try it, and it falls to 6 of 20. \"Good enough for launch?\"",
        choices: [
          { label: "No: limit data access per user, and put approval on `{tool}`", to: "fixed", score: 3, note: "Right. Those work even if the model is completely fooled, because they're outside it." },
          { label: "Yes: it's more than twice as good", to: "launched-weak", score: -2, note: "Thirty percent of attacks still leak customer data. Lower isn't the same as safe." },
        ],
      },
      {
        id: "launched-weak",
        text: "It launches. In the first month, one attack in three gets through, and one of them reaches the press.",
        end: "bad",
      },
      {
        id: "fixed",
        text: "After the fixes, it's 0 of 20. What do you tell the launch meeting?",
        choices: [
          { label: "\"None in 20, the true rate may still be a few percent, and damage is now limited\"", to: "honest", score: 3, note: "Exactly. Zero in 20 isn't zero, and honest residual risk builds trust." },
          { label: "\"It's secure now: prompt injection is solved\"", to: "overclaim", score: -2, note: "It isn't solved. You've limited what a fooled model can do, and that's a very different claim." },
        ],
      },
      {
        id: "overclaim",
        text: "It launches well, but when a new attack is reported a month later, your words get quoted back to you.",
        end: "mixed",
      },
      {
        id: "honest",
        text: "The launch goes ahead on Friday, with logging on, and with your test suite in CI. Weeks later, the suite catches a regression from a model upgrade, before any customer does.",
        end: "good",
      },
    ],
  },
  {
    id: "supply",
    title: "The trusted update",
    role: "AppSec engineer",
    blurb: "A popular library that you use has been compromised. Everyone's asking the same question: are we affected?",
    month: 17,
    minutes: 6,
    lesson: "0069-supply-chain-and-pipelines",
    vars: { lib: ["log-core", "http-lite"], version: ["2.14.1", "3.0.7"], person: PEOPLE },
    start: "news",
    debrief: "Speed came from preparation. SBOMs answered \"are we affected?\" in minutes. Pinned versions kept the bad release out of some builds. Rotating secrets, not only updating the package, is what closed the door, because the malware's job was to steal them.",
    nodes: [
      {
        id: "news",
        text: "09:15. Your feeds light up: `{lib}` version `{version}` contained code that stole secrets from build machines. {person} from engineering asks: \"Are we affected?\"",
        choices: [
          { label: "Search your SBOMs for that exact version", to: "sbom", score: 3, note: "Right. That's what SBOMs are for: an answer in minutes, not days." },
          { label: "Email every team and ask them to check", to: "email", score: 0, note: "It works, slowly. It takes a day or two, and you'll get partial answers." },
          { label: "Reply \"probably not, we use a different version\"", to: "guess", score: -3, note: "That's a guess. Transitive dependencies mean that you may be using it without knowing." },
        ],
      },
      {
        id: "guess",
        text: "Two days later, a developer notices `{lib}` in a lock file, pulled in by another package. Your CI ran it 40 times.",
        choices: [{ label: "Now check everything properly", to: "sbom", score: 1, note: "Right. And write down that a dependency you never chose was the way in." }],
      },
      {
        id: "email",
        text: "By the next afternoon, 11 of 14 teams have replied. Two services are affected, as far as you know.",
        choices: [{ label: "Treat those two as compromised", to: "sbom", score: 1, note: "Good, and an SBOM process would have saved you a day." }],
      },
      {
        id: "sbom",
        text: "Two services ship `{version}`. Their builds ran it, and those build machines hold cloud credentials.",
        evidence: "$ jq -r '.components[] | select(.name == \"{lib}\") | .version' sboms/*.json | sort | uniq -c\n   12 2.13.0\n    2 {version}",
        choices: [
          { label: "Rotate every secret that those builds could reach", to: "rotate", score: 3, note: "Exactly. If malware ran on a build machine, assume that it took what was there." },
          { label: "Upgrade the package, and call it done", to: "upgraded-only", score: -2, note: "Upgrading removes the code, but the stolen secrets still work." },
        ],
      },
      {
        id: "upgraded-only",
        text: "A week later, someone logs in to your cloud account with a token from that build machine.",
        end: "bad",
      },
      {
        id: "rotate",
        text: "Secrets are rotated, and you check CloudTrail: there's nothing unusual so far. {person} asks how to stop this next time.",
        choices: [
          { label: "Pin dependencies, use short-lived OIDC tokens, and limit CI's rights", to: "hardened", score: 3, note: "Right. Pins stop a bad version arriving silently, and short-lived credentials leave little worth stealing." },
          { label: "Stop using open-source libraries", to: "impossible", score: -2, note: "Not realistic, since nearly all software depends on them. The aim is to limit the damage." },
        ],
      },
      {
        id: "impossible",
        text: "{person} politely points out that your own tools are open source too. You go back to the list.",
        choices: [{ label: "Pin, use OIDC, and limit CI's rights", to: "hardened", score: 1, note: "That's what actually reduces the blast radius." }],
      },
      {
        id: "hardened",
        text: "By the end of the month, a new advisory takes you four minutes to answer, and your build tokens last for 15 minutes each. Next time, there'll be far less to steal.",
        end: "good",
      },
    ],
  },
];

export const CASE_MAP: Record<string, CaseFile> = Object.fromEntries(CASES.map((c) => [c.id, c]));

export const HOST_NAMES = HOSTS;
