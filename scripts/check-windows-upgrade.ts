/**
 * Windows only, in the desktop workflow: does the new installer upgrade an install
 * that the old server filled with long paths? This is what stopped 0.3.0's updates
 * with "CyberDojo cannot be closed" (see desktop/installer.nsh).
 *
 *   1. install the latest published release, silently, for this user
 *   2. put a file with a path past 260 characters in its page-cache folder
 *   3. run the published installer again over it, and only report what it did
 *   4. run the new installer over it: it must succeed and remove the file
 *   5. add the file again and uninstall: the uninstaller must remove it too
 *
 * Needs GH_TOKEN for `gh release download`.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const ROOT = process.cwd();
const version = (JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { version: string }).version;
const built = path.join(ROOT, "desktop", "dist", "CyberDojo-Setup-x64.exe");
const dir = path.join(process.env.LOCALAPPDATA ?? "", "Programs", "cyberdojo");
const exe = path.join(dir, "CyberDojo.exe");
const cache = path.join(dir, "resources", "server", ".next-desktop", "server", "route-cache");

function fail(message: string): never {
  console.error(`upgrade check: ${message}`);
  process.exit(1);
}

function run(file: string, args: string[], timeoutMs = 10 * 60_000): number {
  const r = spawnSync(file, args, { stdio: "inherit", timeout: timeoutMs });
  if (r.error) fail(`${path.basename(file)}: ${r.error.message}`);
  return r.status ?? -1;
}

/** Like run(), but a run that hangs is an answer, not a failure: a silent installer that hits a message box without a silent default waits for a click forever. */
function tryRun(file: string, args: string[], timeoutMs: number): string {
  const r = spawnSync(file, args, { stdio: "inherit", timeout: timeoutMs });
  if (r.error && (r.error as NodeJS.ErrnoException).code === "ETIMEDOUT") return `hung (stopped after ${timeoutMs / 1000} s, waiting on a message box)`;
  if (r.error) return `didn't start (${r.error.message})`;
  return `exited ${r.status}`;
}

/** The version Windows lists for CyberDojo in installed apps, or "" when it isn't installed. */
function installedVersion(): string {
  const ps = "(Get-ItemProperty HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\* -ErrorAction SilentlyContinue | Where-Object DisplayName -like 'CyberDojo*').DisplayVersion";
  return spawnSync("powershell", ["-NoProfile", "-NonInteractive", "-Command", ps], { encoding: "utf8" }).stdout.trim();
}

/** A page-cache file like the ones 0.3.0 wrote: Node can create it, the old uninstaller can't remove it. */
function seedLongPath(): string {
  const folder = path.join(cache, "APP_PAGE", "a".repeat(64), "$", "fr", "courses", "0050-spotting-attacks-and-writing-findings.segments", "$d$lang", "courses", "$d$slug");
  fs.mkdirSync(folder, { recursive: true });
  const file = path.join(folder, "__PAGE__.segment.rsc");
  fs.writeFileSync(file, "x");
  if (file.length <= 260) fail(`the test path is only ${file.length} characters`);
  return file;
}

if (process.platform !== "win32") fail("this check runs on Windows");
if (!fs.existsSync(built)) fail(`no installer at ${built}`);

const previous = path.join(os.tmpdir(), "previous", "CyberDojo-Setup-x64.exe");
fs.rmSync(path.dirname(previous), { recursive: true, force: true });
const dl = spawnSync("gh", ["release", "download", "--repo", process.env.GITHUB_REPOSITORY ?? "Ayoubioussoufa/cyberdojo", "--pattern", "CyberDojo-Setup-x64.exe", "--dir", path.dirname(previous)], { stdio: "inherit" });
if (dl.status !== 0) fail("couldn't download the latest release's installer");

run(previous, ["/S"]);
const before = installedVersion();
if (!fs.existsSync(exe)) fail(`the published installer didn't install into ${dir}`);
console.log(`upgrade check: published release installed (${before})`);

let seeded = seedLongPath();
console.log(`upgrade check: added a ${seeded.length}-character path`);

const old = tryRun(previous, ["/S"], 4 * 60_000);
spawnSync("taskkill", ["/f", "/t", "/im", "old-uninstaller.exe"], { stdio: "ignore" });
console.log(`upgrade check: the published installer over it ${old}; the long path is ${fs.existsSync(seeded) ? "still there" : "gone"}`);
if (!fs.existsSync(seeded)) seeded = seedLongPath();

const code = run(built, ["/S"]);
if (code !== 0) fail(`the new installer exited ${code}`);
if (installedVersion() !== version) fail(`Windows lists version "${installedVersion()}", expected ${version}`);
if (fs.existsSync(seeded)) fail("the new installer left the long path behind");
if (!fs.existsSync(exe)) fail("CyberDojo.exe is missing after the upgrade");
console.log(`upgrade check: the new installer upgraded it to ${version} and removed the long path`);

seeded = seedLongPath();
// _?= runs the uninstaller in place, so this waits for it to finish.
const unCode = run(path.join(dir, "Uninstall CyberDojo.exe"), ["/S", `_?=${dir}`]);
if (unCode !== 0) fail(`the uninstaller exited ${unCode}`);
if (fs.existsSync(seeded) || fs.existsSync(exe)) fail("the uninstaller left files behind");
console.log("upgrade check: the uninstaller removed everything, long path included");
