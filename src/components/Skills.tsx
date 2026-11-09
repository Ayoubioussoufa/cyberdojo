"use client";

import { fill, useLang } from "@/i18n/LangProvider";
import { skillName } from "@/i18n/ui";
import { useRef, useState } from "react";
import { LEVELS, SKILLS } from "@/lib/data";
import { exportStore, importStore, setSkill, useStore } from "@/lib/progress";

export function SkillMatrix() {
  const store = useStore();
  const { lang, t } = useLang();
  const levels = t.skills.levels.split("|");
  return (
    <div className="table-wrap">
      <table className="skills">
        <thead>
          <tr><th>{t.skills.skill}</th><th>{t.skills.you}</th><th>M3</th><th>M6</th><th>M12</th><th>M18</th><th>M24</th></tr>
        </thead>
        <tbody>
          {SKILLS.map((s) => (
            <tr key={s.area}>
              <td>{skillName(lang, s.area)}</td>
              <td>
                <select value={store.skills[s.area] ?? 0} onChange={(e) => setSkill(s.area, Number(e.target.value))} aria-label={fill(t.skills.levelIn, { area: skillName(lang, s.area) })}>
                  {LEVELS.map((l, i) => <option key={l} value={i}>{i} {levels[i] ?? l}</option>)}
                </select>
              </td>
              {s.targets.map((x, i) => <td key={i} className="num">{x}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function YourData() {
  const file = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState("");
  const { t } = useLang();
  const save = () => {
    const url = URL.createObjectURL(new Blob([exportStore()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberdojo-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    setMsg(t.skills.saved);
  };
  return (
    <div className="card">
      <p className="band">{t.skills.data}</p>
      <p className="muted">{t.skills.dataText}</p>
      <div className="finish-actions">
        <button type="button" className="btn" onClick={save}>{t.skills.save}</button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>{t.skills.load}</button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setMsg(importStore(await f.text()) ? t.skills.loaded : t.skills.bad);
          }}
        />
      </div>
      {msg && <p className="meta">{msg}</p>}
    </div>
  );
}
