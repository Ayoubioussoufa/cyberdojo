/** Usage statistics for whoever runs the site. English only: it has one reader. */
"use client";

import { Fragment, useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import type { Downloads } from "@/lib/release";
import type { Report } from "@/server/metrics";

/** The usage figures plus the app's download counts, which come from GitHub (null when it can't be reached). */
type Stats = Report & { downloads: Downloads | null };
type Account = Report["users"][number];

const OS_NAMES = { windows: "Windows", mac: "macOS", linux: "Linux" } as const;

const RANGES = [7, 30, 90] as const;

function time(ms: number): string {
  const min = Math.round(ms / 60_000);
  if (ms > 0 && min < 1) return `${Math.max(1, Math.round(ms / 1000))} s`;
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}`;
}

const date = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

function ago(ms: number | null, now: number): string {
  if (ms === null) return "never counted";
  const min = Math.floor((now - ms) / 60_000);
  if (min < 5) return "now";
  if (min < 60) return `${min} min ago`;
  if (min < 1440) return `${Math.floor(min / 60)} h ago`;
  return `${Math.floor(min / 1440)} d ago`;
}

const pct = (part: number, whole: number) => (whole ? `${Math.round((100 * part) / whole)}%` : "0%");

function Tile({ value, label, note }: { value: string | number; label: string; note?: string }) {
  return (
    <div className="adm-tile">
      <strong>{value}</strong>
      <span>{label}</span>
      {note && <small>{note}</small>}
    </div>
  );
}

function Bars({ title, rows, pick, show }: { title: string; rows: Report["daily"]; pick: (d: Report["daily"][number]) => number; show: (n: number) => string }) {
  const max = Math.max(1, ...rows.map(pick));
  const peak = rows.reduce((a, b) => (pick(b) > pick(a) ? b : a), rows[0] as Report["daily"][number]);
  return (
    <figure className="adm-chart">
      <figcaption>
        <b>{title}</b>
        <span>peak {show(pick(peak))} on {peak.day.slice(5)}</span>
      </figcaption>
      <div className="adm-bars" role="img" aria-label={`${title}, ${rows.length} days, peak ${show(pick(peak))}`}>
        {rows.map((d) => (
          <i key={d.day} title={`${d.day}: ${show(pick(d))}`} style={{ height: `${pick(d) ? Math.max(3, (100 * pick(d)) / max) : 0}%` }} />
        ))}
      </div>
      <div className="adm-axis">
        <span>{rows[0]?.day.slice(5)}</span>
        <span>{rows[rows.length - 1]?.day.slice(5)}</span>
      </div>
    </figure>
  );
}

function Split({ title, rows, empty }: { title: string; rows: { name: string; visits: number }[]; empty: string }) {
  const total = rows.reduce((n, r) => n + r.visits, 0);
  return (
    <section className="adm-split">
      <h3>{title}</h3>
      {rows.length === 0 && <p className="muted">{empty}</p>}
      <ul>
        {rows.map((r) => (
          <li key={r.name}>
            <span>{r.name}</span>
            <b>{r.visits}</b>
            <span className="meter small"><i style={{ width: pct(r.visits, total) }} /></span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function UserPages({ user, now }: { user: Account; now: number }) {
  if (!user.pages.length) return <p className="muted">No page time counted for {user.username} yet, or they switched counting off.</p>;
  return (
    <table className="adm-pages">
      <caption>Where {user.username} spent their time: the {user.pages.length} pages with the most, all time.</caption>
      <thead><tr><th scope="col">Page</th><th scope="col">Views</th><th scope="col">Time</th><th scope="col">Per view</th><th scope="col">Last opened</th></tr></thead>
      <tbody>
        {user.pages.map((p) => (
          <tr key={p.path}>
            <th scope="row"><a href={p.path}>{p.path}</a></th>
            <td>{p.views}</td>
            <td>{p.ms ? time(p.ms) : "–"}</td>
            <td>{p.views && p.ms ? time(p.ms / p.views) : "–"}</td>
            <td>{ago(p.lastAt, now)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function Admin() {
  const { ready, admin } = useAccount();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<Stats | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");

  useEffect(() => {
    if (!ready) return;
    let live = true;
    fetch(`/api/admin/stats/?days=${days}`, { credentials: "same-origin" })
      .then(async (res) => {
        if (!live) return;
        if (res.status === 404) return setState("denied");
        if (!res.ok) return setState("error");
        setData((await res.json()) as Stats);
        setState("ok");
      })
      .catch(() => live && setState("error"));
    return () => {
      live = false;
    };
  }, [ready, admin, days]);

  if (state === "loading" && !data) return <p className="muted" aria-busy="true">Loading…</p>;
  if (state === "denied") {
    return (
      <header className="page-head">
        <h1>Nothing here</h1>
        <p className="lede">This page doesn&apos;t exist for your account.</p>
      </header>
    );
  }
  if (!data) return <p className="auth-error" role="alert">The server didn&apos;t answer. Reload to try again.</p>;

  const { accounts, active, range: r, daily, downloads } = data;
  return (
    <>
      <header className="page-head adm-head">
        <div>
          <h1>Usage</h1>
          <p className="muted">First-party figures from this server. Days are UTC. Updated {new Date(data.generatedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}.</p>
        </div>
        <div className="adm-range" role="group" aria-label="Period">
          {RANGES.map((n) => (
            <button key={n} type="button" className="btn sm" aria-pressed={days === n} onClick={() => setDays(n)}>{n} days</button>
          ))}
        </div>
      </header>

      <div className="adm-tiles">
        <Tile value={accounts.total} label="accounts" note={`+${accounts.new7} this week, +${accounts.new30} in 30 days`} />
        <Tile value={r.visitors} label={`visitors in ${days} days`} note={`${r.returning} came back on another day`} />
        <Tile value={time(r.avgVisitMs)} label="average visit" note={`median ${time(r.medianVisitMs)}`} />
        <Tile value={time(r.avgVisitorMs)} label="average per visitor" note={`${time(r.avgAccountMs)} per signed-in account`} />
        <Tile value={active.now} label="on the site now" note="active in the last 5 minutes" />
        <Tile value={time(r.totalMs)} label="total time in use" note={`${r.visits} visits, ${r.views} page views`} />
        <Tile value={downloads ? downloads.total : "–"} label="app downloads" note={downloads ? `all releases, ${downloads.releases[0] ? `${downloads.releases[0].total} of v${downloads.releases[0].version}` : "none yet"}` : "GitHub didn't answer"} />
      </div>

      <section className="adm-part">
        <h2>Active people</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col"></th><th scope="col">Today</th><th scope="col">7 days</th><th scope="col">30 days</th></tr></thead>
            <tbody>
              <tr><th scope="row">Visitors (browsers)</th><td>{active.visitors1}</td><td>{active.visitors7}</td><td>{active.visitors30}</td></tr>
              <tr><th scope="row">Signed-in accounts</th><td>{active.accounts1}</td><td>{active.accounts7}</td><td>{active.accounts30}</td></tr>
            </tbody>
          </table>
        </div>
        <p className="muted adm-note">
          {accounts.withProgress} of {accounts.total} accounts have saved progress. {pct(r.bounces, r.visits)} of visits left within 10 seconds of one page.
          A visitor is one browser: the same person on a phone and a laptop counts twice, unless signed in.
        </p>
      </section>

      <section className="adm-part">
        <h2>Day by day</h2>
        <div className="adm-charts">
          <Bars title="Visitors" rows={daily} pick={(d) => d.visitors} show={String} />
          <Bars title="Average visit" rows={daily} pick={(d) => (d.visits ? d.ms / d.visits : 0)} show={time} />
          <Bars title="New accounts" rows={daily} pick={(d) => d.signups} show={String} />
        </div>
        <details className="adm-details">
          <summary>The same figures as a table</summary>
          <div className="table-wrap">
            <table>
              <thead><tr><th scope="col">Day</th><th scope="col">Visitors</th><th scope="col">Accounts</th><th scope="col">Visits</th><th scope="col">Page views</th><th scope="col">Time</th><th scope="col">New accounts</th></tr></thead>
              <tbody>
                {[...daily].reverse().map((d) => (
                  <tr key={d.day}><th scope="row">{d.day}</th><td>{d.visitors}</td><td>{d.accounts}</td><td>{d.visits}</td><td>{d.views}</td><td>{time(d.ms)}</td><td>{d.signups}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </section>

      <section className="adm-part">
        <h2>Accounts</h2>
        <p className="muted adm-note">
          Every account, most recently seen first. Time counts only while the tab is visible and someone moved, typed or scrolled in the last two minutes.
          Open an account to see the pages it spent that time on.
        </p>
        <div className="table-wrap">
          <table className="adm-users">
            <thead><tr><th scope="col">Username</th><th scope="col">Joined</th><th scope="col">Last seen</th><th scope="col">Visits</th><th scope="col">Days</th><th scope="col">Time in {days} days</th><th scope="col">Total time</th><th scope="col">Per visit</th><th scope="col">Lessons done</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <Fragment key={u.username}>
                  <tr>
                    <th scope="row">
                      <button type="button" className="adm-user" aria-expanded={open === u.username} onClick={() => setOpen(open === u.username ? null : u.username)}>
                        <span aria-hidden="true">{open === u.username ? "▾" : "▸"}</span> {u.username}
                      </button>
                    </th>
                    <td>{date(u.createdAt)}</td>
                    <td>{ago(u.lastSeen, data.generatedAt)}</td>
                    <td>{u.visits}</td>
                    <td>{u.days}</td>
                    <td>{u.rangeMs ? time(u.rangeMs) : "–"}</td>
                    <td>{u.totalMs ? time(u.totalMs) : "–"}</td>
                    <td>{u.visits ? time(u.totalMs / u.visits) : "–"}</td>
                    <td>{u.done}</td>
                  </tr>
                  {open === u.username && (
                    <tr className="adm-sub">
                      <td colSpan={9}>
                        <UserPages user={u} now={data.generatedAt} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
              {data.users.length === 0 && <tr><td colSpan={9}>No accounts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-part">
        <h2>App downloads</h2>
        {!downloads ? (
          <p className="muted adm-note">GitHub didn&apos;t answer, so the counts can&apos;t be shown right now. Reload in a few minutes.</p>
        ) : (
          <>
            <p className="muted adm-note">
              Installer downloads from the GitHub releases, as GitHub counts them. An installed app that updates itself downloads the new installer, so updates are included.
              {" "}Windows {downloads.byOs.windows}, macOS {downloads.byOs.mac}, Linux {downloads.byOs.linux}.
            </p>
            <div className="table-wrap">
              <table>
                <thead><tr><th scope="col">Version</th><th scope="col">Published</th><th scope="col">Windows</th><th scope="col">macOS</th><th scope="col">Linux</th><th scope="col">Total</th></tr></thead>
                <tbody>
                  {downloads.releases.map((rel) => {
                    const of = (os: keyof typeof OS_NAMES) => rel.files.filter((f) => f.os === os);
                    const cell = (os: keyof typeof OS_NAMES) => {
                      const files = of(os);
                      const n = files.reduce((a, f) => a + f.count, 0);
                      return <td title={files.map((f) => `${f.kind}: ${f.count}`).join(", ") || undefined}>{files.length ? n : "–"}</td>;
                    };
                    return (
                      <tr key={rel.version}>
                        <th scope="row">v{rel.version}</th>
                        <td>{date(Date.parse(rel.publishedAt))}</td>
                        {cell("windows")}
                        {cell("mac")}
                        {cell("linux")}
                        <td><b>{rel.total}</b></td>
                      </tr>
                    );
                  })}
                  {downloads.releases.length === 0 && <tr><td colSpan={6}>No release yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="adm-part">
        <h2>Pages</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Page</th><th scope="col">Views</th><th scope="col">Time</th><th scope="col">Per view</th></tr></thead>
            <tbody>
              {data.pages.map((p) => (
                <tr key={p.path}><th scope="row"><a href={p.path}>{p.path}</a></th><td>{p.views}</td><td>{p.ms ? time(p.ms) : "–"}</td><td>{p.views && p.ms ? time(p.ms / p.views) : "–"}</td></tr>
              ))}
              {data.pages.length === 0 && <tr><td colSpan={4}>No page views in this period.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-part">
        <h2>Lesson feedback</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Page</th><th scope="col">Clear</th><th scope="col">Not clear</th><th scope="col">Notes</th></tr></thead>
            <tbody>
              {data.feedback.map((f) => (
                <tr key={f.path}><th scope="row"><a href={f.path}>{f.path}</a></th><td>{f.up}</td><td>{f.down}</td><td>{f.notes}</td></tr>
              ))}
              {data.feedback.length === 0 && <tr><td colSpan={4}>No feedback in this period.</td></tr>}
            </tbody>
          </table>
        </div>
        {data.notes.length > 0 && (
          <div className="adm-notes">
            {data.notes.map((n, i) => (
              <blockquote key={i} className={n.helpful ? "fb-up" : "fb-down"}>
                <p>{n.note}</p>
                <footer><a href={n.path}>{n.path}</a> · {n.lang === "fr" ? "French" : "English"} · {ago(n.at, data.generatedAt)}</footer>
              </blockquote>
            ))}
          </div>
        )}
      </section>

      <div className="adm-splits">
        <Split title="Arrived from" rows={data.referrers.map((x) => ({ name: x.host, visits: x.visits }))} empty="No visit came from another site." />
        <Split title="First page" rows={data.entries.map((x) => ({ name: x.path, visits: x.visits }))} empty="No visits yet." />
        <Split title="Device" rows={data.devices} empty="No visits yet." />
        <Split title="Language" rows={data.langs.map((x) => ({ name: x.name === "fr" ? "French" : "English", visits: x.visits }))} empty="No visits yet." />
      </div>
    </>
  );
}
