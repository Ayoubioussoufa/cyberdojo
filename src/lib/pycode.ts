/**
 * The grader for interactive Python challenges, split from the browser so it can
 * be tested on its own. PY_HARNESS is plain Python (standard library only); it
 * runs the learner's code, then each test, and returns a JSON summary. The same
 * harness runs under Pyodide in the browser and under CPython in the test suite,
 * so the grading is proven without a browser.
 */
export const PY_HARNESS = `
import json, io, contextlib, traceback

def _run(_user_code, _tests_json):
    tests = json.loads(_tests_json)
    ns = {}
    out = io.StringIO()
    user_error = None
    with contextlib.redirect_stdout(out):
        try:
            exec(_user_code, ns)
        except Exception:
            user_error = traceback.format_exc()
    results = []
    if user_error is None:
        for t in tests:
            name, expr = t["name"], t["expr"]
            try:
                ok = bool(eval(expr, ns))
                results.append({"name": name, "ok": ok, "error": None})
            except Exception as e:
                results.append({"name": name, "ok": False, "error": type(e).__name__ + ": " + str(e)})
    return json.dumps({"stdout": out.getvalue(), "userError": user_error, "results": results})
`;

export interface TestResult {
  name: string;
  ok: boolean;
  error: string | null;
}

export interface RunResult {
  stdout: string;
  /** The traceback if the learner's own code failed to run at all; null otherwise. */
  userError: string | null;
  results: TestResult[];
  passed: number;
  total: number;
}

/** The tests, as the JSON string the harness expects as its second argument. */
export const testsJson = (tests: { name: string; expr: string }[]): string => JSON.stringify(tests);

/** Reads the harness's JSON output into a typed result. Defensive: a malformed value becomes an empty run. */
export function interpretResult(raw: string): RunResult {
  let obj: { stdout?: unknown; userError?: unknown; results?: unknown };
  try {
    obj = JSON.parse(raw) as typeof obj;
  } catch {
    return { stdout: "", userError: "The runner returned something unreadable.", results: [], passed: 0, total: 0 };
  }
  const results: TestResult[] = Array.isArray(obj.results)
    ? obj.results.map((r) => {
        const rr = (r ?? {}) as Record<string, unknown>;
        return { name: String(rr.name ?? ""), ok: rr.ok === true, error: rr.error == null ? null : String(rr.error) };
      })
    : [];
  return {
    stdout: typeof obj.stdout === "string" ? obj.stdout : "",
    userError: obj.userError == null ? null : String(obj.userError),
    results,
    passed: results.filter((r) => r.ok).length,
    total: results.length,
  };
}
