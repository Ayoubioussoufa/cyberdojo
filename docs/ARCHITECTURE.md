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
                     └─ Ollama on http://127.0.0.1:11434 (chat, embeddings, model downloads)
```

The page talks only to the local server over HTTP, exactly as on the website. Electron adds a window and a process manager, nothing else, so there is no IPC surface to secure. External links open in the system browser.

The server listens on the loopback address, where other programs and web pages on the same computer could reach it. Three checks cover that: every page and tutor route requires the window token, writes require a same-origin `Origin` header, and the window refuses all permission requests.

## Content is the source of truth

```
content/, modules/, tools/  ──(src/lib/content.ts)──►  pre-rendered pages
                             └─(scripts/build-tutor-index.ts)──►  .tutor/index.json
```

`scripts/build-tutor-index.ts` reads documents through the same loader as the pages and cuts them into chunks of at most 1,600 characters, at `##` sections first (`src/server/tutor/chunking.ts`). A chunk carries its page, section, language and text. Check questions go in with their answer key and explanation; terminal missions with their brief, hints and debrief, never their `solve()` code. A chunk's id is a hash of its text, so editing a lesson changes only that lesson's chunks.

Adding a lesson is therefore one step: write the Markdown file. The next desktop build pre-renders its page and puts it in the tutor's index.

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
