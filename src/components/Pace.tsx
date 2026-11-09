"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import Link from "@/components/HoverLink";
import { finishDate, type PathStep } from "@/lib/pathState";
import { setPlan, today, useStore } from "@/lib/progress";

const OPTIONS = [
  { hours: 5, name: "light", text: "lightText" },
  { hours: 13, name: "standard", text: "standardText" },
  { hours: 20, name: "fast", text: "fastText" },
] as const;

/** She picks a pace; every date and weekly plan on the site follows from it. */
export function Pace({ path }: { path: PathStep[] }) {
  const store = useStore();
  const { lang, t } = useLang();
  return (
    <div>
      <div className="pace" role="group" aria-label={t.pace.label}>
        {OPTIONS.map((o) => (
          <button key={o.hours} type="button" className={`card pace-card${store.plan?.hours === o.hours ? " on" : ""}`} aria-pressed={store.plan?.hours === o.hours} onClick={() => setPlan(o.hours, store.plan?.start ?? today())}>
            <strong>{fill(t.pace.hours, { n: o.hours })}</strong>
            <span className="band">{t.pace[o.name]}</span>
            <span className="muted">{t.pace[o.text]}</span>
          </button>
        ))}
      </div>
      {store.plan && (
        <p className="pace-result">{t.pace.finish} <strong>{finishDate(path, store, store.plan.hours, new Date(), lang)}</strong>. {t.pace.change}</p>
      )}
      <Link className="btn primary lg" href="/roadmap/">{t.pace.open}</Link>
    </div>
  );
}
