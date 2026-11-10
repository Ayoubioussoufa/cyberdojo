/** Usage statistics for whoever runs the site. English only: it has one reader. */
"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/lib/account";
import type { Report } from "@/server/metrics";

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

export function Admin() {
  const { ready, admin } = useAccount();
  const [days, setDays] = useState<(typeof RANGES)[number]>(30);
  const [data, setData] = useState<Report | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "denied" | "error">("loading");

  useEffect(() => {
    if (!ready) return;
    let live = true;
    fetch(`/api/admin/stats/?days=${days}`, { credentials: "same-origin" })
      .then(async (res) => {
        if (!live) return;
        if (res.status === 404) return setState("denied");
        if (!res.ok) return setState("error");
        setData((await res.json()) as Report);
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

  const { accounts, active, range: r, daily } = data;
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
        <p className="muted adm-note">Every account, most recently seen first. Time is counted only while the tab is open and in use.</p>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Username</th><th scope="col">Joined</th><th scope="col">Last seen</th><th scope="col">Visits</th><th scope="col">Days</th><th scope="col">Total time</th><th scope="col">Per visit</th><th scope="col">Lessons done</th></tr></thead>
            <tbody>
              {data.users.map((u) => (
                <tr key={u.username}>
                  <th scope="row">{u.username}</th>
                  <td>{date(u.createdAt)}</td>
                  <td>{ago(u.lastSeen, data.generatedAt)}</td>
                  <td>{u.visits}</td>
                  <td>{u.days}</td>
                  <td>{time(u.totalMs)}</td>
                  <td>{u.visits ? time(u.totalMs / u.visits) : "–"}</td>
                  <td>{u.done}</td>
                </tr>
              ))}
              {data.users.length === 0 && <tr><td colSpan={8}>No accounts yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <section className="adm-part">
        <h2>Pages</h2>
        <div className="table-wrap">
          <table>
            <thead><tr><th scope="col">Page</th><th scope="col">Views</th><th scope="col">Time</th><th scope="col">Per view</th></tr></thead>
            <tbody>
              {data.pages.map((p) => (
                <tr key={p.path}><th scope="row"><a href={p.path}>{p.path}</a></th><td>{p.views}</td><td>{time(p.ms)}</td><td>{p.views ? time(p.ms / p.views) : "–"}</td></tr>
              ))}
              {data.pages.length === 0 && <tr><td colSpan={4}>No page views in this period.</td></tr>}
            </tbody>
          </table>
        </div>
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
