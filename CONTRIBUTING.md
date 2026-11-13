# Contributing to CyberDojo

Thank you for helping. CyberDojo is a cybersecurity course from zero to Master's level, published as a website and as a desktop app with a local AI tutor, from one codebase.

## Run it

```
pnpm install
pnpm dev               # the website, on http://localhost:3100
pnpm desktop:dev       # the desktop app, with live reload
pnpm test              # everything the CI checks, including the website build
```

Node 24 and pnpm 12. The desktop app's design is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Add or fix course material

Lessons live in `content/lessons/`, the reference modules in `modules/<domain>/`, the tool guides in `tools/<category>/`. Each is one Markdown file; the README explains the front matter and the blocks (`@term`, `@drill`, questions, missions). Run `pnpm test:content` after editing. A French copy goes in `content/fr/` at the same path; `pnpm test:i18n` checks it stays in step.

Write for a beginner: define each term the first time, give an analogy before the precise version, and say where a fact comes from. Attacks are taught from the defender's side: every technique comes with the traces it leaves and how to stop it, and hands-on work only targets the simulated machines in the course or the learner's own lab. Contributions that teach attacking systems the reader doesn't own will be declined.

## Code changes

- Keep the website and the desktop app working: desktop-only code sits behind `DESKTOP` (`src/lib/desktop.ts`).
- Every string a learner reads exists in English and French (`src/i18n/ui.ts`).
- Add a check next to the ones in `scripts/` for anything that can be tested without a browser.
- One change per pull request, with a commit message that says what changed and why.

## Licenses

By contributing you agree that your code is released under the MIT license and your course material under CC BY-NC-SA 4.0, as described in [LICENSE](LICENSE) and [LICENSE-CONTENT](LICENSE-CONTENT).
