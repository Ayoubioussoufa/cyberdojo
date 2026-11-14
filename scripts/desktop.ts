/**
 * Builds the desktop app.
 *
 *   tsx scripts/desktop.ts dev         the Electron window on `next dev`
 *   tsx scripts/desktop.ts stage       everything the app ships, in desktop/build/
 *   tsx scripts/desktop.ts start       stage, then run the staged app unpackaged
 *   tsx scripts/desktop.ts dist        stage, then installers for this OS in desktop/dist/
 *   tsx scripts/desktop.ts dist --dir  stage, then the unpacked app only (no installer)
 *   tsx scripts/desktop.ts pack [--dir] installers from what is already staged
 *
 * Stage = the tutor's index, the site built as a standalone server with the
 * desktop flag on, and the Electron main process bundled into one file.
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import net from "node:net";
import os from "node:os";
import path from "node:path";
import { build as bundle } from "esbuild";
import { build as pack, type Configuration } from "electron-builder";
import { copyResolvingLinks, flattenModules, links } from "./flatten";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const OUT = path.join(ROOT, "desktop", "build");
const APP = path.join(OUT, "app");
const SERVER = path.join(OUT, "server");
const DIST_DIR = ".next-desktop";
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { version: string; repository?: string };
const ghMatch = /github\.com\/([^/]+)\/([^/.]+)/.exec(pkg.repository ?? "");
const ghRepo = ghMatch ? { owner: ghMatch[1] as string, repo: ghMatch[2] as string } : null;

const DESKTOP_ENV = { ...process.env, NEXT_PUBLIC_CYBERDOJO_DESKTOP: "1", NEXT_TELEMETRY_DISABLED: "1" };

function run(file: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const { status } = spawnSync(process.execPath, [file, ...args], { cwd: ROOT, env, stdio: "inherit" });
  if (status !== 0) process.exit(status ?? 1);
}

const tsx = require.resolve("tsx/cli");
const next = require.resolve("next/dist/bin/next");
const electron = require.resolve("electron/cli.js");

async function bundleMain() {
  fs.mkdirSync(APP, { recursive: true });
  await bundle({ entryPoints: [path.join(ROOT, "desktop", "main.ts")], outfile: path.join(APP, "main.js"), bundle: true, platform: "node", format: "cjs", target: "node22", external: ["electron"], logLevel: "warning" });
  // The repository is where the app looks for updates and sends "Report a problem".
  // The packaged app is this folder alone: no dependencies, so nothing from node_modules is shipped beside the server's own.
  fs.writeFileSync(path.join(APP, "package.json"), JSON.stringify({ name: "cyberdojo", productName: "CyberDojo", version: pkg.version, description: "Cybersecurity from zero, with a tutor that runs on your computer.", author: "CyberDojo", repository: pkg.repository, desktopName: "cyberdojo.desktop", main: "main.js" }, null, 2));
}

/** A free port on this computer. */
function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer().once("error", reject);
    probe.listen(0, "localhost", () => {
      const { port } = probe.address() as net.AddressInfo;
      probe.close(() => resolve(port));
    });
  });
}

/**
 * Starts the staged server from a copy in another folder, as an installed app
 * would run it, and asks it for a page and for the tutor's status (which loads
 * the native database module). A server that only works where it was built,
 * because something in it points back into the repository, fails here.
 */
async function smoke() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "cyberdojo-smoke-"));
  const copy = path.join(dir, "server");
  fs.cpSync(SERVER, copy, { recursive: true, verbatimSymlinks: true });
  const port = await freePort();
  const token = "smoke-test-token";
  const child = spawn(process.execPath, [path.join(copy, "server.js")], {
    cwd: copy,
    env: { ...process.env, PORT: String(port), HOSTNAME: "localhost", NODE_ENV: "production", NEXT_PUBLIC_CYBERDOJO_DESKTOP: "1", CYBERDOJO_DESKTOP_TOKEN: token, CYBERDOJO_DB: path.join(dir, "smoke.db"), CYBERDOJO_DATA: dir, CYBERDOJO_TUTOR_INDEX: path.join(copy, "tutor-index.json"), NEXT_TELEMETRY_DISABLED: "1" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (d: Buffer) => (output += d.toString()));
  child.stderr.on("data", (d: Buffer) => (output += d.toString()));
  const ask = async (p: string) => {
    try {
      const res = await fetch(`http://localhost:${port}${p}`, { headers: { Cookie: `cyberdojo-desktop=${token}` }, signal: AbortSignal.timeout(20_000) });
      return res.status;
    } catch {
      return 0;
    }
  };
  try {
    const deadline = Date.now() + 60_000;
    while ((await ask("/api/auth/me/")) === 0) {
      if (child.exitCode !== null || Date.now() > deadline) throw new Error(`the staged server didn't start:\n${output.slice(-2000)}`);
      await new Promise((r) => setTimeout(r, 300));
    }
    for (const p of ["/courses/", "/tutor/setup/", "/api/tutor/status/"]) {
      const status = await ask(p);
      if (status !== 200) throw new Error(`the staged server answered ${status} to ${p}:\n${output.slice(-2000)}`);
    }
    console.log("smoke: the staged server runs from another folder");
  } finally {
    child.kill();
    await new Promise((r) => setTimeout(r, 500));
    fs.rmSync(dir, { recursive: true, force: true, maxRetries: 5 });
  }
}

async function stage() {
  fs.rmSync(OUT, { recursive: true, force: true });
  run(tsx, ["scripts/build-tutor-index.ts"]);
  run(next, ["build"], DESKTOP_ENV);
  // Only the server itself is shipped. Next also traces whatever the content loader could read from
  // the repository (the Markdown, the notes, a local database), and none of that belongs in an installer:
  // pages are pre-rendered, and the tutor reads its own index.
  const standalone = path.join(ROOT, DIST_DIR, "standalone");
  fs.mkdirSync(SERVER, { recursive: true });
  for (const file of ["server.js", "package.json"]) fs.copyFileSync(path.join(standalone, file), path.join(SERVER, file));
  // pnpm's links can't go into an installer: see scripts/flatten.ts.
  const placed = flattenModules(standalone, path.join(SERVER, "node_modules"));
  copyResolvingLinks(path.join(standalone, DIST_DIR), path.join(SERVER, DIST_DIR), placed);
  fs.cpSync(path.join(ROOT, DIST_DIR, "static"), path.join(SERVER, DIST_DIR, "static"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, ".tutor", "index.json"), path.join(SERVER, "tutor-index.json"));
  const left = links(SERVER);
  if (left.length) throw new Error(`the staged server still has links, which installers break:\n${left.slice(0, 10).join("\n")}`);
  await smoke();
  await bundleMain();
}

const config: Configuration = {
  appId: "app.cyberdojo.desktop",
  productName: "CyberDojo",
  electronVersion: (require("electron/package.json") as { version: string }).version,
  directories: { app: APP, output: path.join(ROOT, "desktop", "dist"), buildResources: path.join(ROOT, "desktop") },
  icon: path.join(ROOT, "desktop", "icon.png"),
  asar: true,
  // The app is main.js alone. Without this, the builder finds no dependencies in its folder, looks in
  // the repository instead and packs the website's node_modules into the archive.
  files: ["main.js", "package.json", "!**/node_modules/**"],
  // The server runs in a plain Node process, which can't read inside the app archive, so it sits
  // beside it. It is copied here and not through extraResources, which leaves node_modules out.
  afterPack: async ({ appOutDir, packager }) => {
    fs.cpSync(SERVER, path.join(packager.getResourcesDir(appOutDir), "server"), { recursive: true });
  },
  // Names without the version, so a link to releases/latest/download/<name> keeps working from one release to the next.
  artifactName: "CyberDojo-${os}-${arch}.${ext}",
  win: { target: "nsis" },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true, artifactName: "CyberDojo-Setup-${arch}.${ext}" },
  // No Apple certificate yet. Apple silicon refuses to run unsigned code at all, so the app is signed ad hoc ("-"):
  // macOS then asks the learner once (Privacy & Security, Open Anyway) instead of calling the app damaged.
  // The hardened runtime would reject Electron's own frameworks under an ad-hoc signature, so it is off.
  mac: { target: ["dmg", "zip"], category: "public.app-category.education", identity: "-", hardenedRuntime: false },
  linux: { target: ["AppImage", "deb"], category: "Education", maintainer: "CyberDojo <noreply@github.com>", synopsis: "Cybersecurity from zero, with a local AI tutor" },
  // The GitHub provider makes electron-builder write the update metadata (latest.yml, latest-linux.yml,
  // app-update.yml) that the Windows and AppImage auto-updater reads. The build never uploads, though
  // (`publish: "never"` passed to pack): the workflow's release job publishes every file itself.
  publish: ghRepo ? { provider: "github", owner: ghRepo.owner, repo: ghRepo.repo, releaseType: "release" } : null,
};

async function main() {
  const [command, flag] = process.argv.slice(2);
  if (command === "dev") {
    run(tsx, ["scripts/build-tutor-index.ts"]);
    await bundleMain();
    run(electron, [APP], { ...DESKTOP_ENV, CYBERDOJO_DESKTOP_DEV: "1" });
  } else if (command === "stage") {
    await stage();
  } else if (command === "start") {
    await stage();
    run(electron, [APP]);
  } else if (command === "dist" || command === "pack") {
    if (command === "dist") await stage();
    // Generate the update metadata but never upload: the release workflow publishes.
    await pack({ config, dir: flag === "--dir", publish: "never" });
  } else {
    console.error("Usage: tsx scripts/desktop.ts dev | stage | start | dist [--dir] | pack [--dir]");
    process.exit(1);
  }
}

void main();
