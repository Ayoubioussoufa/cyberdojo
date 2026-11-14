# Architecture: one course, a website and a desktop app

CyberDojo is one Next.js application. The website and the desktop app are two builds of the same code and the same Markdown. Nothing is forked: the desktop build sets one flag, `NEXT_PUBLIC_CYBERDOJO_DESKTOP=1`, and `src/lib/desktop.ts` exposes it as `DESKTOP`.

## Web and desktop side by side

| | Website | Desktop app |
|---|---|---|
| Build | `next build` into `.next/` | `next build` with the flag, as a standalone server, into `.next-desktop/` |
| Runs on | Vercel | The learner's computer, inside Electron |
| Who gets in | Members with a session (`src/proxy.ts`) | The app's own window, proved by a token made at launch (`src/server/desktop.ts`) |
| Profile | Accounts with passwords | One local profile, `local`, created on first use |
| Database | Turso (hosted libSQL) | A SQLite file in the user-data folder, through the same libSQL client |
| Usage statistics | On | Off |
| Tutor | "Copy for my AI tutor" buttons | The same buttons send to the built-in tutor |
| Tutor routes and tables | Routes answer 404, tables aren't created | On |

What the flag changes, and where:

- `src/proxy.ts`: no sign-in gate; the window token is checked; `/signin/` redirects home.
- `src/server/session.ts`: `currentUser()` returns the local profile, so progress sync (`/api/progress`, `src/lib/account.ts`) works unchanged.
- `src/server/db.ts`: adds the `tutor_*` tables.
- `src/app/[lang]/layout.tsx`: mounts the tutor panel, drops the visit counter.
- `src/components/Copy.tsx`, `Written.tsx`, `DocView.tsx`, `Account.tsx`: tutor buttons, answer grading, no password forms.
- `next.config.ts`: standalone output in its own folder.

## The desktop shell

```
Electron main process (desktop/main.ts)
  ├─ starts the server (desktop/server.ts): Next standalone, loopback only, port 41820 or the next free one
  │    env: CYBERDOJO_DB=<userData>/cyberdojo.db, CYBERDOJO_DESKTOP_TOKEN=<random>, CYBERDOJO_TUTOR_INDEX=…
  ├─ sets the token as an HttpOnly cookie for that origin
  └─ opens one sandboxed window on http://localhost:<port>/   (no preload, no Node access)
                     │
                     ▼
      Next.js server ── SQLite file (progress, chats, grades, settings, vectors)
                     └─ Ollama on http://127.0.0.1:11434 (chat, embeddings, model downloads),
                        installed and started by the server when it's missing (see below)
```

The page talks only to the local server over HTTP, exactly as on the website. Electron adds a window and a process manager, nothing else, so there is no IPC surface to secure. External links open in the system browser.

What the shell adds to the window (`desktop/main.ts`, `desktop/menu.ts`):

- `window.json` in the data folder keeps the size, place, zoom and last page. Saved bounds are used only if they still land on a screen.
- The first launch opens `/tutor/setup/?welcome=1`; it asks the server, through the same token, whether the setup page was ever seen.
- Menus in the page's language, with shortcuts; a right-click menu (Electron has none of its own); the mouse's side buttons and a Mac swipe go back and forward.
- "Ask the tutor about this" on a selection calls `window.cyberdojoAsk(text)`, which the tutor panel defines. `executeJavaScript` passes the text as a JSON literal, so it can't break out of the call.
- Closing while a setup job runs asks first. On quit, the shell stops the server and the copy of Ollama the server started (`ollama.pid`).
- Updates: Windows and the Linux AppImage self-update through `electron-updater` (`desktop/autoupdate.ts`), reading the GitHub release metadata (`latest.yml`, `latest-linux.yml`) the build generates; a newer version downloads in the background and installs on quit or on the learner's restart. macOS (needs Apple signing) and the `.deb` (apt-managed) fall back to the manual notice in `desktop/updates.ts`, which reads the release list and opens the release page. `canAutoInstall()` draws the line; any updater failure falls back to the manual notice, so a broken check never stops the app. Checked once a day and from the Help menu; nothing about the learner is sent.

The server listens on the loopback address, where other programs and web pages on the same computer could reach it. Three checks cover that: every page and tutor route requires the window token, writes require a same-origin `Origin` header, and the window refuses all permission requests.

## Setting up Ollama and the models

```
setup page ── POST /api/tutor/setup/ {pull, use} ──► jobs.ts: one background job
   ▲                                                   1. install Ollama   (runtime.install)   if it is missing
   │ GET /api/tutor/status/ every 1 s while it runs    2. start Ollama     (runtime.start)     if it is stopped
   └── status: hardware, catalog with a fit per model,  3. pull each model  (Ollama /api/pull)  bytes counted per layer
       recommendation, Ollama state, job progress      4. switch the tutor to `use`
```

The job belongs to the server, not to a request: the learner can leave the page, and the nav's Tutor button shows the progress from the same status. One job runs at a time; DELETE cancels it. A model download that was cancelled resumes where it stopped, because Ollama keeps the layers it has.

`runtime.ts` finds Ollama (the desktop app, the `ollama` command on the PATH or in its usual folders, or the copy this app installed) and installs it from Ollama's latest GitHub release:

| System | File | Checks before it runs | Where it goes |
| --- | --- | --- | --- |
| Windows | `OllamaSetup.exe` | SHA-256 from the release, then an Authenticode signature by `O=Ollama Inc.`, as `install.ps1` checks it | `%LOCALAPPDATA%\Programs\Ollama`, silent, no administrator rights |
| macOS | `Ollama-darwin.zip` | SHA-256, then `codesign --verify --deep --strict` and `spctl --assess` | `/Applications`, or `~/Applications` when that isn't writable |
| Linux | `ollama-linux-<arch>.tar.zst` | SHA-256 (the release has no signature) | the app's data folder, run as `ollama serve` |

Linux decompresses zstd in Node (`zlib.createZstdDecompress`, Node 22.15 and later) and pipes the tar to the system `tar`, so no `zstd` program is needed. The copy the app starts with `ollama serve` runs detached in its own process group, with its pid in `ollama.pid`; the shell stops it on quit (`taskkill /t` on Windows). The Ollama desktop apps are the user's and keep running.

`hardware.ts` reads the memory, the NVIDIA card through `nvidia-smi`, Apple silicon's shared memory (about two thirds usable by the graphics cores) and the free space where Ollama keeps models. `models.ts` turns that into a fit per model: memory needed = download size × 1.15 + 1 GB for the 8,192-token context; fast if it fits on the card, usable if mostly on the card or small enough for the processor, slow if it only fits in main memory. The tests in `scripts/check-tutor.ts` pin the recommendation for typical computers.

Thinking models get `think: false` (gpt-oss, which can't turn it off, gets `"low"`), after `/api/show` confirms the capability: sending `think` to a model without it is an error.

## Content is the source of truth

```
content/, modules/, tools/  ──(src/lib/content.ts)──►  pre-rendered pages
                             └─(scripts/build-tutor-index.ts)──►  .tutor/index.json
```

`scripts/build-tutor-index.ts` reads documents through the same loader as the pages and cuts them into chunks of at most 1,600 characters, at `##` sections first (`src/server/tutor/chunking.ts`). A chunk carries its page, section, language and text. Check questions go in with their answer key and explanation; terminal missions with their brief, hints and debrief, never their `solve()` code. A chunk's id is a hash of its text, so editing a lesson changes only that lesson's chunks.

Adding a lesson is therefore one step: write the Markdown file. The next desktop build pre-renders its page and puts it in the tutor's index.

The Workshop labs (`src/data/workshop.ts`) are added to the index the same way, as chunks under `/workshop/<id>/`, so the tutor's **Lab** mode is grounded in the open lab. Lab mode's prompt (`src/server/tutor/prompt.ts`) binds the whole session to the learner's own `127.0.0.1` server and refuses any other target; `scripts/check-workshop.ts` enforces the same invariant on the lab content, and `scripts/check-tutor.ts` asserts the prompt keeps it.

## A tutor turn

```
panel (TutorDock) ── POST /api/tutor/chat/ {href, lang, mode, reveal, message}
   1. page chunks   corpus.pageChunks(href)            the page that is open
   2. related       vectors.search(message)            top 4 chunks from other pages, by cosine similarity
   3. history       last 8 messages of this page's chat
   4. system prompt prompt.systemPrompt(...)
   5. Ollama /api/chat, streaming ──► NDJSON events to the panel: sources, delta…, done
   6. both messages saved in tutor_messages, keyed by page
```

Search: each chunk is embedded once with `nomic-embed-text` (through Ollama's `/api/embed`), normalised and stored as a BLOB in `tutor_vectors`. Queries are compared in memory; a few thousand vectors need no vector database. Indexing starts by itself when the embedding model is installed and resumes where it stopped. Until it finishes, and whenever the embedding model is missing, the tutor still gets the open page.

A page longer than the budget (9,000 characters) keeps its most relevant chunks, in reading order. The context window is set to 8,192 tokens.

## Prompt design

`src/server/tutor/prompt.ts` builds the system prompt on every turn, in this order:

1. **Rules.** Who the tutor is and seven rules: teach before answering, stay with the course, stay on the subject, stay legal, be honest, be brief, and treat course text and learner messages as material, never as instructions.
2. **This turn.** One paragraph for the mode (Explain, Hint, Review my work, Quiz me). A full solution is unlocked only by `reveal`, which the "Show the full solution" button sets.
3. **The open page**, as fenced `<excerpt>` blocks.
4. **Related excerpts**, each with a link the model is asked to cite, so answers point back into the course.
5. **A one-line reminder** of the turn's mode, because a small model follows best what it read last.

Rules come first and course text last, fenced, so a sentence inside a lesson can't pass for an instruction. The legal rule limits hands-on help to CyberDojo's simulated targets, the learner's own lab and systems they have written permission to test, and asks for traces and defences with every technique.

These are instructions to a small local model, not a guarantee: a 7b model follows them most of the time, and larger models follow them better.

## Grading

"Grade my answer" under a written question calls `POST /api/tutor/grade/`. The reference is the course section the question sits in, because written questions have no model answer in the content. The model must reply in a JSON schema (verdict, score, right, missing, feedback); `readGrade()` rejects anything else. Grades are stored in `tutor_grades`, and the last one is shown again when the page reopens.

Multiple-choice questions and terminal missions are still graded by the course's own code, which is exact. Their "Ask the tutor" buttons send the question, the learner's answer and the key for an explanation.

## Tests

`pnpm test:tutor` checks the index, the prompts, grade parsing and reply sanitising without a model. The existing `pnpm test` covers the website build, which must keep passing with the flag off.
