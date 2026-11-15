/**
 * Interactive Python challenges: the data is well-formed, every challenge
 * referenced from a lesson exists, and the grader actually grades — the
 * reference solution passes every test, and the starter code does not. The
 * grader is run in CPython here, which is the same Python the browser runs under
 * Pyodide, so this proves the grading without a browser. Part of `pnpm test`.
 */
import { spawnSync } from "node:child_process";
import { flatSegments, guides, lessons, machines, modules, projects } from "../src/lib/content";
import { PY_CHALLENGES, pyChallenge } from "../src/data/pycode";
import { interpretResult, PY_HARNESS, type RunResult, testsJson } from "../src/lib/pycode";

let bad = 0;
const fail = (m: string) => {
  bad++;
  console.error(`✗ ${m}`);
};

function findPython(): string | null {
  for (const p of ["python3", "python"]) {
    const r = spawnSync(p, ["--version"]);
    if (!r.error && r.status === 0) return p;
  }
  return null;
}

function runHarness(py: string, code: string, tests: { name: string; expr: string }[]): RunResult {
  const driver = `${PY_HARNESS}\nimport sys\nprint(_run(sys.argv[1], sys.argv[2]))`;
  const r = spawnSync(py, ["-c", driver, code, testsJson(tests)], { encoding: "utf8", timeout: 15000 });
  return interpretResult((r.stdout ?? "").trim());
}

// Data is well-formed.
const ids = new Set<string>();
for (const c of PY_CHALLENGES) {
  const where = `pycode ${c.id}`;
  if (ids.has(c.id)) fail(`${where}: duplicate id`);
  ids.add(c.id);
  if (!/^[a-z][a-z0-9-]*$/.test(c.id)) fail(`${where}: id should be kebab-case`);
  if (!c.prompt.trim() || !c.starter.trim() || !c.solution.trim()) fail(`${where}: missing prompt, starter or solution`);
  if (c.tests.length < 2) fail(`${where}: needs at least two tests`);
  if (c.tests.some((t) => !t.name.trim() || !t.expr.trim())) fail(`${where}: a test is missing its name or expression`);
}

// Every challenge referenced from the course exists.
const docs = [...lessons(), ...guides(), ...modules(), ...machines(), ...projects()];
for (const d of docs) {
  for (const s of flatSegments(d.segments)) {
    if (s.kind === "code" && !pyChallenge(s.id)) fail(`${d.meta.slug}: @code ${s.id} has no challenge`);
  }
}

// interpretResult reads the harness output.
const sample = interpretResult(JSON.stringify({ stdout: "hi\n", userError: null, results: [{ name: "a", ok: true, error: null }, { name: "b", ok: false, error: "AssertionError: x" }] }));
if (!(sample.passed === 1 && sample.total === 2 && sample.stdout === "hi\n")) fail("interpretResult: miscounts a mixed result");
if (interpretResult("not json").userError === null) fail("interpretResult: unreadable output should report an error");

// The grader grades, run in real CPython.
const py = findPython();
if (!py) {
  console.log("note: no python3 found; skipped the live grading checks");
} else {
  for (const c of PY_CHALLENGES) {
    const good = runHarness(py, c.solution, c.tests);
    if (good.userError) fail(`pycode ${c.id}: the reference solution raised: ${good.userError.split("\n").pop()}`);
    if (good.passed !== good.total || good.total !== c.tests.length) fail(`pycode ${c.id}: the reference solution should pass every test (${good.passed}/${good.total})`);
    const starter = runHarness(py, c.starter, c.tests);
    if (!starter.userError && starter.passed === starter.total) fail(`pycode ${c.id}: the starter code passes every test, so the challenge is trivial`);
  }
}

console.log(bad ? `\n${bad} problem${bad === 1 ? "" : "s"}` : `✓ pycode: ${PY_CHALLENGES.length} challenges, the grader grades${py ? " (checked in CPython)" : ""}`);
process.exit(bad ? 1 : 0);
