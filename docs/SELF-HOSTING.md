# Running your own CyberDojo server

For people who host the website themselves. Learners don't need any of this: they use the website or download the app (see the [README](../README.md)).

Nothing here is secret. The real secrets, the database token and the admin's password, live only in the host's environment and never in the repository.

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
