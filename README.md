# CyberDojo

A cybersecurity course from absolute zero, built from the 24-month roadmap PDF.

```
pnpm install
pnpm dev        # http://localhost:3100
pnpm test       # simulators vs real tools, missions, drills, content rules, build, accounts
pnpm build      # production build
pnpm start      # production server on port 3100
pnpm user:reset <name>   # forgotten password: prints a one-time one
```

Needs Node 22.13 or newer, for the built-in SQLite. It runs on a Node server, not as a static export.

- `modules/<domain>/*.md`: the Master's-level modules. `scripts/coverage/`: the audit behind the coverage matrix.
- `content/lessons/*.md`: lessons, numbered in teaching order. `content/guides/*.md`: Parts A–N of the roadmap.
- `content/machines/*.md`: simulated attack-and-defend machines. `content/reference/*.md`: printable cheat sheets.
- `src/lib/content.ts`: the document format (questions, drills, missions, glossary terms, callouts).
- `src/lib/shell/`: the browser terminal: a shell, filesystem and commands.
- `src/lib/missions/`: graded terminal missions, and the machines in `machines.ts`. `src/lib/drills/`: generated exercises.
- `src/lib/missions/dojo/` and `src/data/dojo.ts`: the Dojo's 54 flag challenges. See `THIRD_PARTY_NOTICES.md`.
- `src/data/*.json`: the 24 months, 16 projects and resources, parsed from the PDF.
- `content/projects/*.md`: each step has `@goal`, `@search` and `@docs`. Walkthroughs are off until the student turns them on.
- `desktop/`, `scripts/desktop.ts`: the desktop app's shell and build. `src/server/tutor/`, `src/components/tutor/`: its tutor.
- `src/server/`, `src/app/api/`: accounts. `src/lib/account.ts`: sync. `src/lib/merge.ts`: combining two copies.

## Modules: the Master's-level reference

The 78 lessons make a junior defender, in order, over 24 months. `modules/` is the reference that sits beside them: one folder per domain, each module running from fundamentals to advanced, always in the same seven parts (Concept, Threat model, Tools, Defence, Pitfalls, Exercise, Further reading). `pnpm test` enforces that template. It also fails on broken links and one-way attack and defence links, on an exercise with no lab notice, and on anything that looks like a working attack recipe.

Modules teach how an attack works, what it leaves behind and how to stop it. They hold no working exploits, payloads or evasion steps, and hands-on offensive practice belongs on legal platforms such as PortSwigger, pwn.college and Hack The Box.

Offensive topics are covered from the defender's side. Active Directory attack techniques and exploit development aren't here on purpose: lessons 44, 45 and 57 cover those at concept level, and the matrix shows them as open.

### Learning path

1. Follow the [Roadmap](/roadmap/) first. It teaches the basics that modules assume.
2. Read a module when its "Read first" list is familiar. Foundation modules are safe from about Month 3.
3. Start with Networking, then Operating systems and Cryptography, which everything else builds on.
4. Pick your depth from there: Web, Blue team or Cloud, following the map below.
5. Finish each module's exercise in your own lab. Reading alone doesn't count.

### Coverage matrix

<!-- coverage:start -->
**534 topics.** Before the modules: 162 present, 125 partial, 247 missing. Now: **504 present, 25 partial, 5 missing.** Every row and its evidence is in [COVERAGE.md](COVERAGE.md).

| Domain | Before ● ◐ ○ | Now ● ◐ ○ | Modules |
|---|---|---|---|
| [01 Networking and protocols](modules/01-networking/README.md) | 17 · 20 · 31 | 66 · 2 · 0 | 14 |
| [02 Operating systems and privilege escalation](modules/02-operating-systems/README.md) | 18 · 20 · 26 | 52 · 8 · 4 | 10 |
| [03 Cryptography](modules/03-cryptography/README.md) | 8 · 11 · 25 | 43 · 1 · 0 | 12 |
| [04 Web security](modules/04-web/README.md) | 26 · 14 · 20 | 57 · 3 · 0 | 14 |
| [05 Application and binary security](modules/05-binary/README.md) | 1 · 4 · 36 | 34 · 6 · 1 | 10 |
| [06 Malware, evasion and EDR](modules/06-malware-edr/README.md) | 8 · 9 · 11 | 27 · 1 · 0 | 7 |
| [07 Network security and infrastructure](modules/07-network-security/README.md) | 9 · 3 · 14 | 26 · 0 · 0 | 7 |
| [08 Blue team and defensive operations](modules/08-blue-team/README.md) | 17 · 9 · 8 | 34 · 0 · 0 | 9 |
| [09 Threat intelligence and frameworks](modules/09-threat-intel/README.md) | 9 · 4 · 14 | 26 · 1 · 0 | 5 |
| [10 Cloud and container security](modules/10-cloud/README.md) | 11 · 10 · 10 | 31 · 0 · 0 | 7 |
| [11 Identity and access](modules/11-identity/README.md) | 13 · 4 · 6 | 23 · 0 · 0 | 5 |
| [12 Governance, risk, compliance, ethics and law](modules/12-grc/README.md) | 9 · 7 · 10 | 25 · 1 · 0 | 7 |
| [13 Software supply chain and secure SDLC](modules/13-supply-chain/README.md) | 7 · 3 · 3 | 13 · 0 · 0 | 3 |
| [14 AI and machine-learning security](modules/14-ai-security/README.md) | 7 · 4 · 0 | 10 · 1 · 0 | 1 |
| [15 Wireless, mobile, hardware, OT and physical](modules/15-wireless-mobile-hardware-ot/README.md) | 0 · 1 · 22 | 22 · 1 · 0 | 9 |
| [16 Human factors, privacy and research foundations](modules/16-human-privacy-research/README.md) | 2 · 2 · 11 | 15 · 0 · 0 | 7 |
<!-- coverage:end -->

### Prerequisites map

Domains, in the order that they depend on each other. The module-by-module table is in [modules/README.md](modules/README.md).

<!-- prereqs:start -->
```mermaid
graph LR
  D01["01 Networking and protocols"]
  D02["02 Operating systems and privilege escalation"]
  D03["03 Cryptography"]
  D04["04 Web security"]
  D05["05 Application and binary security"]
  D06["06 Malware, evasion and EDR"]
  D07["07 Network security and infrastructure"]
  D08["08 Blue team and defensive operations"]
  D09["09 Threat intelligence and frameworks"]
  D10["10 Cloud and container security"]
  D11["11 Identity and access"]
  D12["12 Governance, risk, compliance, ethics and law"]
  D13["13 Software supply chain and secure SDLC"]
  D14["14 AI and machine-learning security"]
  D15["15 Wireless, mobile, hardware, OT and physical"]
  D16["16 Human factors, privacy and research foundations"]
  D01 --> D02
  D01 --> D03
  D01 --> D04
  D03 --> D04
  D02 --> D05
  D02 --> D06
  D05 --> D06
  D01 --> D07
  D02 --> D08
  D06 --> D08
  D07 --> D08
  D01 --> D09
  D02 --> D10
  D11 --> D10
  D03 --> D11
  D04 --> D11
  D04 --> D13
  D04 --> D14
  D01 --> D15
  D02 --> D15
  D05 --> D15
```
<!-- prereqs:end -->

## Desktop app

The same course as a program for Windows, macOS and Linux, with a tutor that runs on the learner's computer through [Ollama](https://ollama.com). Once the app and a model are installed it needs no connection, apart from the links that lead to outside labs. How it is put together: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

```
pnpm desktop:dev      # the app window on `next dev`, with live reload
pnpm desktop:start    # build everything, then run the built app without an installer
pnpm desktop:dist     # installers for this operating system, in desktop/dist/
pnpm test:tutor       # the tutor's checks (run `pnpm tutor:index` first)
```

An installer can only be built on its own system. `.github/workflows/desktop.yml` builds all three: run it by hand from the Actions tab, or push a tag such as `desktop-v0.1.0` to attach them to a release. It produces an NSIS installer (Windows x64), a dmg and zip (macOS, Apple silicon), and an AppImage and deb (Linux x64).

**Signing.** The installers aren't signed, so Windows SmartScreen and macOS Gatekeeper warn on first launch. On Windows choose "More info", then "Run anyway". On macOS, right-click the app and choose Open. Removing the warnings needs a paid certificate for each platform.

### The tutor

On first launch the app opens on **Your AI tutor** (`/tutor/setup/`). It shows what the computer has (memory, graphics card, free disk), recommends a model, and one button does the rest in the background:

1. **Ollama.** If it is already running, it is used. If it is installed but stopped, the app starts it. If it is missing, the app installs it from Ollama's own GitHub release, after checking the file against the release's SHA-256 list:
   - Windows: `OllamaSetup.exe`, run silently for this user only (no administrator rights), only if its signature is Ollama Inc.'s. This is what Ollama's `install.ps1` does.
   - macOS: `Ollama.app`, unpacked into Applications, only if macOS accepts its signature and notarisation.
   - Linux: the official build, unpacked into the app's data folder, because the system install needs sudo. The app starts this copy and stops it when it quits.
2. **The model** the learner chose, then the course search model, `nomic-embed-text` (0.3 GB). The course is then indexed once.

The learner can keep studying during the download: the Tutor button in the top bar shows the progress. Quitting while a download runs asks first. Once the tutor is set up, the app starts Ollama by itself at each launch if it isn't running.

**Which model.** Each model is marked fast, usable, slow or too large for this computer, from its exact download size, the memory, and the graphics card (NVIDIA cards through `nvidia-smi`; Apple silicon shares its memory). The recommendation is the largest of `qwen3.5:2b`, `qwen3.5:4b`, `qwen3.5:9b`, `gemma4:12b` and `qwen3.5:27b` that runs fast:

| This computer | Recommended | Download |
| --- | --- | --- |
| 8 to 16 GB of memory, no graphics card | `qwen3.5:4b` | 3.3 GB |
| A graphics card with 6 to 8 GB | `qwen3.5:4b`; the 9b also runs, partly on the processor | 3.3 GB |
| A graphics card with 10 to 19 GB, or a Mac with 16 or 24 GB | `gemma4:12b` | 8.0 GB |
| A graphics card with 20 GB or more, or a Mac with 32 GB or more | `qwen3.5:27b` | 17.5 GB |

The list also has `llama3.2:3b`, `gemma4:e4b`, `gpt-oss:20b` (a mixture-of-experts model that stays usable without a graphics card) and `gemma4:26b`. Any other Ollama model can be downloaded by name, and models can be deleted to free space. Thinking models (Qwen 3.5, gpt-oss) have their long reasoning switched off or set low, so answers start in seconds.

**Using it.** The tutor opens from the corner of every page, having read the page that is open; it gives hints before answers and has four modes: Explain, Hint, Review my work, Quiz me. Every "Ask the tutor" button sends it the question, your answer and the key. Under each written question, "Grade my answer" grades it against the section and keeps the grade. **Ask the tutor** (`/tutor/`, Ctrl+T) is the tutor on its own page, for any question, with your chats listed beside it. Select text on any page and right-click "Ask the tutor about this".

**The window.** It reopens at its last size and place, on the last page read. The menus have shortcuts: Ctrl+1 to 5 for Roadmap, Lessons, Practice, Progress and the tutor; Alt+Left and Alt+Right (Cmd+[ and Cmd+] on a Mac), or the mouse's side buttons, go back and forward. Help, Check for updates reads the project's public GitHub releases and opens the release page; it runs once a day by itself. Nothing about the learner is sent, and the app never installs an update without them.

Everything is stored in one SQLite file in the app's data folder (`%APPDATA%\CyberDojo`, `~/Library/Application Support/CyberDojo`, `~/.config/CyberDojo`): progress, chats, grades, settings and the search index. Back up `cyberdojo.db` to keep them. The same folder holds `logs/` and, on Linux, the Ollama copy the app installed. Models live where Ollama keeps them (`~/.ollama/models`), shared with any other Ollama on the computer.

### Adding content

Write the Markdown file where its kind lives (`content/lessons/`, `modules/<domain>/`, `tools/<category>/` and so on) and run `pnpm test:content`. The website shows it on the next deploy. The desktop app shows it, and the tutor knows it, on the next `pnpm desktop:dist`: the build pre-renders the page and rebuilds the tutor's index from the same file.

## Accounts

Guests keep progress in the browser. An account keeps it on the server, in a SQLite database reached through libSQL: the file `data/cyberdojo.db` on this computer (or `CYBERDOJO_DB`), or a hosted Turso database when `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` are set. Back it up. Sign-up needs a username only, so a forgotten password is reset with `pnpm user:reset` (run it with the two Turso variables set to act on the hosted database).

## Members only

Every page except `/signin/` needs a live session. `src/proxy.ts` checks the session cookie against the database (remembering a valid one for a minute) and sends anyone else to the sign-in page, with `?next=` holding the page they asked for. The page data under `/data/` is behind the same door. Static assets under `/_next/` are not: they hold the interface code, so treat nothing shipped to the browser as secret.

## Usage statistics

The site counts its own visits, in the same SQLite file: no outside service, no IP address, no user agent. A browser gets a random number, kept in `localStorage`; it reports each page opened and the seconds the tab was visible and in use. The server groups those into visits (a visit ends after 30 minutes of silence) and never credits more time than really passed. Rows older than 400 days are deleted.

- Name the admins in `CYBERDOJO_ADMINS` (usernames, comma-separated). They get a link on their account page to `/admin/`: accounts, visitors, average time per visit and per person, day-by-day charts, a line per account, the most-read pages. Everyone else gets a 404 from `/api/admin/stats/`.
- Create the admin account **before** you set the variable on a public server, or whoever registers that username first becomes the admin.
- People can switch counting off on the account page. Browsers that send Do Not Track or Global Privacy Control, and automated browsers, aren't counted at all, so the figures are a floor, not an exact count.
- `src/server/metrics.ts` (recording and the report), `src/lib/track.ts` (the browser side), `scripts/check-metrics.ts` (`pnpm test:metrics`).

## Hosting

The site runs on Vercel (free Hobby plan) with the database on Turso (free plan), because no free host keeps a file on disk. `vercel.json` puts the API in Paris (`cdg1`); create the Turso database in a European region so the two are close.

Environment variables on the host:

| Variable | Value |
| --- | --- |
| `TURSO_DATABASE_URL` | `libsql://<database>-<org>.turso.io` |
| `TURSO_AUTH_TOKEN` | a token from `turso db tokens create <database>` |
| `TRUST_PROXY` | `1` (Vercel sets the forwarded headers itself, so rate limits can use the real address) |
| `CYBERDOJO_ADMINS` | the admin usernames, set only after those accounts exist |

Deploy with `vercel deploy --prod`. The tables are created on first use. Any other Node host works the same way: with a persistent disk, leave the Turso variables unset and keep `data/` on the disk, behind HTTPS (off `localhost`, session cookies are `Secure`).
