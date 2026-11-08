"use client";

import Link from "@/components/HoverLink";
import { CopyButton } from "./Copy";
import type { Month } from "@/lib/data";
import { setGate, useStore } from "@/lib/progress";
import { gateMessage } from "@/lib/tutor";

export function Gates({ month }: { month: Month }) {
  const store = useStore();
  const gates = month.gate ?? [];
  const n = gates.filter((_, i) => store.gates[`m${month.n}-${i}`]).length;
  return (
    <section className="card gate">
      <p className="band">Exit gate, {n} of {gates.length}</p>
      <p className="muted">Tick a box only when you can do it unaided: no notes, no AI. If you can't yet, that's information, not failure. Use the buffer days.</p>
      <ul className="checks">
        {gates.map((g, i) => {
          const key = `m${month.n}-${i}`;
          return (
            <li key={key}>
              <label>
                <input type="checkbox" checked={!!store.gates[key]} onChange={(e) => setGate(key, e.target.checked)} />
                <span>{g}</span>
              </label>
            </li>
          );
        })}
      </ul>
      <CopyButton label="Copy: have my AI test me on this gate" build={() => gateMessage(month.n, month.title, gates)} />
    </section>
  );
}

export function MonthGrid({ months, counts }: { months: Month[]; counts: Record<number, number> }) {
  const store = useStore();
  return (
    <div className="months">
      {months.map((m) => {
        const gates = m.gate ?? [];
        const n = gates.filter((_, i) => store.gates[`m${m.n}-${i}`]).length;
        const passed = gates.length > 0 && n === gates.length;
        return (
          <Link key={m.n} href={`/roadmap/${m.n}/`} className={`card month${passed ? " passed" : ""}`}>
            <span className="month-n">{passed ? "✓" : String(m.n).padStart(2, "0")}</span>
            <span className="month-title">{m.title}</span>
            <span className="meta">{counts[m.n] ? `${counts[m.n]} lessons, ` : ""}gate {n}/{gates.length}</span>
          </Link>
        );
      })}
    </div>
  );
}
