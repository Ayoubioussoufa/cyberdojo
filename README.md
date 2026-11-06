# CyberDojo

A cybersecurity course from absolute zero, built from the 24-month roadmap PDF.

```
pnpm install
pnpm dev        # http://localhost:3100
pnpm test       # shell vs real tools, missions, content rules
pnpm build      # static site in out/
```

- `content/lessons/*.md`: lessons, numbered in teaching order. `content/guides/*.md`: Parts A–N of the roadmap.
- `content/machines/*.md`: simulated attack-and-defend machines. `content/reference/*.md`: printable cheat sheets.
- `src/lib/content.ts`: the document format (questions, drills, missions, glossary terms, callouts).
- `src/lib/shell/`: the browser terminal: a shell, filesystem and commands.
- `src/lib/missions/`: graded terminal missions, and the machines in `machines.ts`. `src/lib/drills/`: generated exercises.
- `src/data/*.json`: the 24 months, 16 projects and resources, parsed from the PDF.

Progress lives in the browser's localStorage. Export it from /skills.
