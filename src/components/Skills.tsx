"use client";

import { useRef, useState } from "react";
import { LEVELS, SKILLS } from "@/lib/data";
import { exportStore, importStore, setSkill, useStore } from "@/lib/progress";

export function SkillMatrix() {
  const store = useStore();
  return (
    <div className="table-wrap">
      <table className="skills">
        <thead>
          <tr><th>Skill</th><th>You</th><th>M3</th><th>M6</th><th>M12</th><th>M18</th><th>M24</th></tr>
        </thead>
        <tbody>
          {SKILLS.map((s) => (
            <tr key={s.area}>
              <td>{s.area}</td>
              <td>
                <select value={store.skills[s.area] ?? 0} onChange={(e) => setSkill(s.area, Number(e.target.value))} aria-label={`Your level in ${s.area}`}>
                  {LEVELS.map((l, i) => <option key={l} value={i}>{i} {l}</option>)}
                </select>
              </td>
              {s.targets.map((t, i) => <td key={i} className="num">{t}</td>)}
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
  const save = () => {
    const url = URL.createObjectURL(new Blob([exportStore()], { type: "application/json" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "cyberdojo-progress.json";
    a.click();
    URL.revokeObjectURL(url);
    setMsg("Saved to your downloads.");
  };
  return (
    <div className="card">
      <p className="band">Your data</p>
      <p className="muted">Your progress lives only in this browser. Save it to a file before you change computer or clear your browser, then load it on the other side.</p>
      <div className="finish-actions">
        <button type="button" className="btn" onClick={save}>Save my progress</button>
        <button type="button" className="btn" onClick={() => file.current?.click()}>Load a saved file</button>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (f) setMsg(importStore(await f.text()) ? "Progress loaded." : "That file doesn't look like CyberDojo progress.");
          }}
        />
      </div>
      {msg && <p className="meta">{msg}</p>}
    </div>
  );
}
