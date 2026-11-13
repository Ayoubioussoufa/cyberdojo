/**
 * Ollama on this computer: where it is installed, how to start it, and how to
 * install it when it isn't there.
 *
 * Installs come from Ollama's own GitHub release, the same files its install
 * scripts use, and are checked against the release's SHA-256 list before
 * anything runs. Then, per system:
 *   Windows  OllamaSetup.exe, whose signature must be Ollama Inc.'s, run silently.
 *            It installs for this user only (no administrator), like `install.ps1`.
 *   macOS    Ollama.app, whose signature and notarisation macOS must accept,
 *            unpacked into Applications.
 *   Linux    the official build, unpacked into this app's data folder and run
 *            from there, because the system install needs sudo.
 * A copy of Ollama this app started itself (`ollama serve`) is recorded in
 * ollama.pid, and the desktop shell stops it when the app quits. The Ollama
 * desktop apps for Windows and macOS keep running: they belong to the user.
 */
import { execFile, spawn } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import zlib from "node:zlib";
import { version } from "./ollama";

const RELEASE_API = "https://api.github.com/repos/ollama/ollama/releases/latest";
const RELEASE_TTL_MS = 6 * 60 * 60 * 1000;
const START_TIMEOUT_MS = 45_000;
/** The Ollama desktop app's signer, as Ollama's own install.ps1 checks it. */
const WINDOWS_SIGNER = /(^|, )O=Ollama Inc\.(,|$)/;

export class RuntimeError extends Error {}

/** The folder this app keeps its data in: the database's folder. */
export function dataDir(): string {
  if (process.env.CYBERDOJO_DATA) return process.env.CYBERDOJO_DATA;
  return process.env.CYBERDOJO_DB ? path.dirname(process.env.CYBERDOJO_DB) : path.join(process.cwd(), "data");
}

const pidFile = () => path.join(dataDir(), "ollama.pid");
const managedDir = () => path.join(dataDir(), "ollama");
const managedBinary = () => path.join(managedDir(), "bin", "ollama");

/** True for an address on this computer, where the app may start or install Ollama. */
export function isLocal(host: string): boolean {
  try {
    return ["127.0.0.1", "localhost", "[::1]"].includes(new URL(host).hostname);
  } catch {
    return false;
  }
}

const exists = (p: string) => {
  try {
    fs.accessSync(p, fs.constants.X_OK);
    return true;
  } catch {
    return false;
  }
};

function onPath(name: string): string | null {
  const dirs = (process.env.PATH ?? "").split(path.delimiter).filter(Boolean);
  for (const dir of dirs) {
    const file = path.join(dir, name);
    if (exists(file)) return file;
  }
  return null;
}

export interface Found {
  kind: "app" | "cli" | "managed";
  /** The program to run: the desktop app, or the `ollama` command. */
  file: string;
  /** The `ollama` command beside it, to run `serve` on another port. */
  cli: string | null;
}

/**
 * Where Ollama is installed. Apps started from the Dock or the Start menu get a short PATH,
 * so the usual install folders are checked by name as well.
 */
export function findOllama(): Found | null {
  const home = os.homedir();
  if (process.platform === "win32") {
    const dirs = [path.join(process.env.LOCALAPPDATA ?? path.join(home, "AppData", "Local"), "Programs", "Ollama"), path.join(process.env.ProgramFiles ?? "C:\\Program Files", "Ollama")];
    for (const dir of dirs) {
      const app = path.join(dir, "ollama app.exe");
      const cli = path.join(dir, "ollama.exe");
      if (fs.existsSync(app)) return { kind: "app", file: app, cli: fs.existsSync(cli) ? cli : null };
    }
    const cli = onPath("ollama.exe");
    return cli ? { kind: "cli", file: cli, cli } : null;
  }
  if (process.platform === "darwin") {
    for (const dir of ["/Applications", path.join(home, "Applications")]) {
      const app = path.join(dir, "Ollama.app");
      const cli = path.join(app, "Contents", "Resources", "ollama");
      if (fs.existsSync(app)) return { kind: "app", file: app, cli: exists(cli) ? cli : null };
    }
    const cli = onPath("ollama") ?? ["/usr/local/bin/ollama", "/opt/homebrew/bin/ollama"].find(exists) ?? null;
    return cli ? { kind: "cli", file: cli, cli } : null;
  }
  if (exists(managedBinary())) return { kind: "managed", file: managedBinary(), cli: managedBinary() };
  const cli = onPath("ollama") ?? ["/usr/local/bin/ollama", "/usr/bin/ollama"].find(exists) ?? null;
  return cli ? { kind: "cli", file: cli, cli } : null;
}

/** The asset of Ollama's release this computer installs, or null when there is no automatic install for it. */
export function assetName(platform: string = process.platform, arch: string = process.arch): string | null {
  if (platform === "win32" && (arch === "x64" || arch === "arm64")) return "OllamaSetup.exe";
  if (platform === "darwin") return "Ollama-darwin.zip";
  if (platform === "linux" && arch === "x64") return "ollama-linux-amd64.tar.zst";
  if (platform === "linux" && arch === "arm64") return "ollama-linux-arm64.tar.zst";
  return null;
}

/** Reads `sha256sum.txt`: "<hex>  ./<name>" per line. */
export function parseChecksums(text: string): Map<string, string> {
  const out = new Map<string, string>();
  for (const line of text.split("\n")) {
    const m = /^([0-9a-f]{64})\s+\*?(?:\.\/)?(\S+)\s*$/i.exec(line.trim());
    if (m) out.set(m[2] as string, (m[1] as string).toLowerCase());
  }
  return out;
}

interface Release {
  tag: string;
  url: string;
  bytes: number;
  sha256: string;
}

const slot = globalThis as { __cyberdojoRelease?: { at: number; value: Promise<Release>; bytes?: number } };

async function lookUp(signal?: AbortSignal): Promise<Release> {
  const name = assetName();
  if (!name) throw new RuntimeError("There is no automatic Ollama install for this system.");
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "CyberDojo-desktop" };
  const res = await fetch(RELEASE_API, { headers, signal: signal ?? AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res?.ok) throw new RuntimeError("Ollama's download page couldn't be reached. Check the connection and try again.");
  const release = (await res.json()) as { tag_name: string; assets: { name: string; size: number; browser_download_url: string }[] };
  const asset = release.assets.find((a) => a.name === name);
  const sums = release.assets.find((a) => a.name === "sha256sum.txt");
  if (!asset || !sums) throw new RuntimeError("Ollama's latest release has no download for this system.");
  const list = await fetch(sums.browser_download_url, { headers: { "User-Agent": headers["User-Agent"] }, signal: AbortSignal.timeout(15_000) }).catch(() => null);
  const sha256 = list?.ok ? parseChecksums(await list.text()).get(name) : undefined;
  if (!sha256) throw new RuntimeError("Ollama's download couldn't be checked, so it wasn't installed.");
  return { tag: release.tag_name, url: asset.browser_download_url, bytes: asset.size, sha256 };
}

/** The release to install, looked up at most every few hours. A failed lookup is forgotten at once. */
export function release(): Promise<Release> {
  const cached = slot.__cyberdojoRelease;
  if (cached && Date.now() - cached.at < RELEASE_TTL_MS) return cached.value;
  const entry: { at: number; value: Promise<Release>; bytes?: number } = { at: Date.now(), value: lookUp() };
  slot.__cyberdojoRelease = entry;
  entry.value.then(
    (r) => (entry.bytes = r.bytes),
    () => {
      if (slot.__cyberdojoRelease === entry) delete slot.__cyberdojoRelease;
    },
  );
  return entry.value;
}

/** The install's size once the release has been looked up, null until then. Asking starts the lookup. */
export function knownInstallBytes(): number | null {
  if (!assetName()) return null;
  if (!slot.__cyberdojoRelease) release().catch(() => undefined);
  return slot.__cyberdojoRelease?.bytes ?? null;
}

function run(file: string, args: string[], env?: NodeJS.ProcessEnv): Promise<{ code: number; out: string }> {
  return new Promise((resolve) => {
    execFile(file, args, { timeout: 10 * 60_000, windowsHide: true, env: env ?? process.env, maxBuffer: 4 * 1024 * 1024 }, (err, stdout, stderr) => {
      const code = err ? (typeof (err as { code?: unknown }).code === "number" ? ((err as { code: number }).code) : 1) : 0;
      resolve({ code, out: `${stdout}${stderr}` });
    });
  });
}

/** Streams the file to disk, hashing it on the way, and reports the bytes received. */
async function download(r: Release, to: string, onBytes: (done: number, total: number) => void, signal: AbortSignal) {
  const res = await fetch(r.url, { headers: { "User-Agent": "CyberDojo-desktop" }, signal }).catch((e: unknown) => {
    if (signal.aborted) throw e;
    throw new RuntimeError("The Ollama download couldn't start. Check the connection and try again.");
  });
  if (!res.ok || !res.body) throw new RuntimeError("The Ollama download couldn't start. Check the connection and try again.");
  const total = Number(res.headers.get("content-length")) || r.bytes;
  const hash = createHash("sha256");
  let done = 0;
  let last = 0;
  const count = new Transform({
    transform(chunk: Buffer, _enc, next) {
      hash.update(chunk);
      done += chunk.length;
      const now = Date.now();
      if (now - last > 250) {
        last = now;
        onBytes(done, total);
      }
      next(null, chunk);
    },
  });
  fs.mkdirSync(path.dirname(to), { recursive: true });
  const part = `${to}.part`;
  try {
    await pipeline(Readable.fromWeb(res.body as import("node:stream/web").ReadableStream), count, fs.createWriteStream(part), { signal });
  } catch (e) {
    fs.rmSync(part, { force: true });
    if (signal.aborted) throw e;
    throw new RuntimeError("The Ollama download stopped before the end. Try again.");
  }
  onBytes(done, total);
  if (hash.digest("hex") !== r.sha256) {
    fs.rmSync(part, { force: true });
    throw new RuntimeError("The Ollama download didn't match its checksum, so it wasn't installed. Try again.");
  }
  fs.renameSync(part, to);
}

async function installWindows(file: string) {
  // Ollama's install.ps1 makes the same two checks: a valid signature, by Ollama Inc.
  const check = await run("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command", "$s = Get-AuthenticodeSignature -LiteralPath $env:CYBERDOJO_FILE; \"$($s.Status)|$($s.SignerCertificate.Subject)\""], { ...process.env, CYBERDOJO_FILE: file });
  const [state, subject = ""] = check.out.trim().split("|");
  if (state !== "Valid" || !WINDOWS_SIGNER.test(subject)) throw new RuntimeError("The Ollama installer isn't signed by Ollama, so it wasn't run.");
  // Tells the Ollama app it was installed by a script, so it starts hidden in the tray instead of opening a window.
  const marker = path.join(process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"), "Ollama", "upgraded");
  fs.mkdirSync(path.dirname(marker), { recursive: true });
  fs.writeFileSync(marker, "");
  const { code } = await run(file, ["/VERYSILENT", "/NORESTART", "/SUPPRESSMSGBOXES"]);
  if (code !== 0) throw new RuntimeError("The Ollama installer stopped with an error. Try again, or install Ollama from ollama.com.");
}

async function installMac(zip: string) {
  const unpack = path.join(path.dirname(zip), "ollama-app");
  fs.rmSync(unpack, { recursive: true, force: true });
  // ditto keeps the signature and the extended attributes that unzip would lose.
  if ((await run("/usr/bin/ditto", ["-x", "-k", zip, unpack])).code !== 0) throw new RuntimeError("The Ollama download couldn't be unpacked.");
  const app = path.join(unpack, "Ollama.app");
  const signed = (await run("/usr/bin/codesign", ["--verify", "--deep", "--strict", app])).code === 0;
  const allowed = (await run("/usr/sbin/spctl", ["--assess", "--type", "execute", app])).code === 0;
  if (!signed || !allowed) throw new RuntimeError("macOS didn't accept Ollama's signature, so it wasn't installed.");
  let target = "/Applications";
  try {
    fs.accessSync(target, fs.constants.W_OK);
  } catch {
    target = path.join(os.homedir(), "Applications");
    fs.mkdirSync(target, { recursive: true });
  }
  const dest = path.join(target, "Ollama.app");
  fs.rmSync(dest, { recursive: true, force: true });
  fs.renameSync(app, dest);
  fs.rmSync(unpack, { recursive: true, force: true });
}

async function installLinux(archive: string) {
  const fresh = `${managedDir()}.new`;
  fs.rmSync(fresh, { recursive: true, force: true });
  fs.mkdirSync(fresh, { recursive: true });
  // zstd is decompressed here, so the computer needs no zstd program; tar reads the plain stream.
  const tar = spawn("tar", ["-x", "-f", "-", "-C", fresh, "--no-same-owner"], { stdio: ["pipe", "ignore", "pipe"] });
  let errors = "";
  tar.stderr.on("data", (d: Buffer) => (errors += d.toString()));
  const closed = new Promise<number>((resolve) => tar.once("close", (code) => resolve(code ?? 1)));
  try {
    await pipeline(fs.createReadStream(archive), zlib.createZstdDecompress(), tar.stdin);
  } catch {
    tar.kill();
  }
  if ((await closed) !== 0 || !exists(path.join(fresh, "bin", "ollama"))) {
    fs.rmSync(fresh, { recursive: true, force: true });
    // The server's output goes to the app's log; the learner gets a sentence they can act on.
    if (errors) console.error(`ollama unpack: ${errors.trim()}`);
    throw new RuntimeError("The Ollama download couldn't be unpacked.");
  }
  await stopManaged();
  fs.rmSync(managedDir(), { recursive: true, force: true });
  fs.renameSync(fresh, managedDir());
}

/** Downloads and installs Ollama, reporting the download's progress. */
export async function install(onBytes: (done: number, total: number) => void, signal: AbortSignal): Promise<void> {
  const name = assetName();
  if (!name) throw new RuntimeError("There is no automatic Ollama install for this system.");
  const r = await release();
  const file = path.join(dataDir(), "downloads", name);
  onBytes(0, r.bytes);
  await download(r, file, onBytes, signal);
  try {
    if (process.platform === "win32") await installWindows(file);
    else if (process.platform === "darwin") await installMac(file);
    else await installLinux(file);
  } finally {
    fs.rmSync(file, { force: true });
  }
}

/** "127.0.0.1:11500" from "http://127.0.0.1:11500", for OLLAMA_HOST. */
const listenOn = (host: string) => {
  const url = new URL(host);
  return `${url.hostname === "localhost" ? "127.0.0.1" : url.hostname.replace(/^\[|\]$/g, "")}:${url.port || "11434"}`;
};
const defaultPort = (host: string) => (new URL(host).port || "11434") === "11434";

async function waitFor(host: string, signal?: AbortSignal): Promise<boolean> {
  const deadline = Date.now() + START_TIMEOUT_MS;
  while (Date.now() < deadline && !signal?.aborted) {
    if (await version(host)) return true;
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

/**
 * Starts Ollama for the address in the settings. The desktop apps serve the
 * default port; any other port, or no app, means running `ollama serve` here.
 */
export async function start(host: string, signal?: AbortSignal): Promise<void> {
  if (!isLocal(host)) throw new RuntimeError("Ollama runs on another computer at this address. Start it there.");
  if (await version(host)) return;
  const found = findOllama();
  if (!found) throw new RuntimeError("Ollama isn't installed on this computer.");
  if (found.kind === "app" && defaultPort(host)) {
    const launch = process.platform === "darwin" ? spawn("/usr/bin/open", ["-a", found.file], { stdio: "ignore" }) : spawn(found.file, [], { detached: true, stdio: "ignore", windowsHide: true });
    launch.on("error", () => undefined);
    launch.unref();
  } else {
    if (!found.cli) throw new RuntimeError("Ollama's command-line program wasn't found, so it can't serve this address.");
    serve(found.cli, host);
  }
  if (!(await waitFor(host, signal))) throw new RuntimeError("Ollama didn't start. Open it yourself, then try again.");
}

function serve(cli: string, host: string) {
  const logs = path.join(dataDir(), "logs");
  fs.mkdirSync(logs, { recursive: true });
  const out = fs.openSync(path.join(logs, "ollama.log"), "a");
  // Detached, so the app's server can restart without taking Ollama down; the shell stops it on quit.
  const child = spawn(cli, ["serve"], { detached: true, stdio: ["ignore", out, out], windowsHide: true, env: { ...process.env, OLLAMA_HOST: listenOn(host) } });
  child.on("error", () => undefined);
  if (child.pid) fs.writeFileSync(pidFile(), JSON.stringify({ pid: child.pid, cli }));
  child.unref();
  fs.closeSync(out);
}

/** Stops the copy this app started, if one is running. */
export async function stopManaged(): Promise<void> {
  let pid: number | undefined;
  try {
    pid = (JSON.parse(fs.readFileSync(pidFile(), "utf8")) as { pid?: number }).pid;
  } catch {
    return;
  }
  fs.rmSync(pidFile(), { force: true });
  if (!pid) return;
  try {
    if (process.platform === "win32") await run("taskkill", ["/pid", String(pid), "/t", "/f"]);
    else process.kill(-pid, "SIGTERM");
  } catch {
    // Already gone.
  }
}
