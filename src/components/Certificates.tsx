"use client";

import { useEffect, useState } from "react";
import Link from "@/components/HoverLink";
import { BELTS } from "@/data/path";
import { localize } from "@/i18n/lang";
import { plural, useLang } from "@/i18n/LangProvider";

interface Data {
  username: string;
  earned: number[];
  certs: { belt: number; id: string }[];
}

export function Certificates() {
  const { lang, t } = useLang();
  const [data, setData] = useState<Data | null>(null);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState("");

  const refresh = async () => {
    try {
      const res = await fetch("/api/cert/", { credentials: "same-origin" });
      if (res.ok) {
        const d = (await res.json()) as Data;
        setData(d);
        setName((n) => n || d.username);
      }
    } catch {
      // Offline: the page stays empty rather than wrong.
    }
  };
  useEffect(() => {
    void refresh();
  }, []);

  const claim = async (belt: number) => {
    setBusy(belt);
    setError("");
    try {
      const res = await fetch("/api/cert/", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ belt, name: name.trim() }) });
      if (res.ok) await refresh();
      else setError(t.cert.notYet);
    } catch {
      setError(t.cert.notYet);
    }
    setBusy(0);
  };

  if (!data) return <p className="muted">{t.common.loading}</p>;
  const idOf = (belt: number) => data.certs.find((c) => c.belt === belt)?.id;

  return (
    <div className="cert-wall">
      <p className="cert-name-row">
        <label htmlFor="cert-name">{t.cert.nameLabel}</label>
        <input id="cert-name" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder={data.username} />
      </p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <ol className="cert-belts">
        {BELTS.slice(1).map((belt, i) => {
          const n = i + 1;
          const id = idOf(n);
          const earned = data.earned.includes(n);
          return (
            <li key={belt.name} className={`cert-belt-row${earned ? " earned" : " locked"}`}>
              <span className="cert-chip" style={{ background: belt.colour }} aria-hidden />
              <span className="cert-belt-text">
                <span className="cert-belt-name">{belt.name}</span>
                <span className="cert-belt-meaning">{belt.meaning}</span>
              </span>
              <span className="cert-belt-action">
                {id ? (
                  <Link className="btn sm primary" href={localize(`/cert/${id}/`, lang)}>{t.cert.view}</Link>
                ) : earned ? (
                  <button type="button" className="btn sm" disabled={busy === n} onClick={() => void claim(n)}>{busy === n ? t.common.loading : t.cert.create}</button>
                ) : (
                  <span className="cert-locked-tag">{t.cert.locked}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>
      <p className="muted cert-foot">{plural(lang, t.cert.count, data.earned.length, { n: data.earned.length })}</p>
    </div>
  );
}
