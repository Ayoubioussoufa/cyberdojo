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
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { build as bundle } from "esbuild";
import { build as pack, type Configuration } from "electron-builder";

const require = createRequire(import.meta.url);
const ROOT = process.cwd();
const OUT = path.join(ROOT, "desktop", "build");
const APP = path.join(OUT, "app");
const SERVER = path.join(OUT, "server");
const DIST_DIR = ".next-desktop";
const SHIPPED = ["server.js", "package.json", "node_modules", DIST_DIR];
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")) as { version: string; repository?: string };

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
  fs.writeFileSync(path.join(APP, "package.json"), JSON.stringify({ name: "cyberdojo", productName: "CyberDojo", version: pkg.version, description: "Cybersecurity from zero, with a tutor that runs on your computer.", author: "CyberDojo", repository: pkg.repository, main: "main.js" }, null, 2));
}

async function stage() {
  fs.rmSync(OUT, { recursive: true, force: true });
  run(tsx, ["scripts/build-tutor-index.ts"]);
  run(next, ["build"], DESKTOP_ENV);
  // Only the server itself is shipped. Next also traces whatever the content loader could read from
  // the repository (the Markdown, the notes, a local database), and none of that belongs in an installer:
  // pages are pre-rendered, and the tutor reads its own index.
  // pnpm links packages with symlinks, which installers handle badly: copy what they point to.
  for (const part of SHIPPED) fs.cpSync(path.join(ROOT, DIST_DIR, "standalone", part), path.join(SERVER, part), { recursive: true, dereference: true });
  fs.cpSync(path.join(ROOT, DIST_DIR, "static"), path.join(SERVER, DIST_DIR, "static"), { recursive: true });
  fs.copyFileSync(path.join(ROOT, ".tutor", "index.json"), path.join(SERVER, "tutor-index.json"));
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
  artifactName: "CyberDojo-${version}-${os}-${arch}.${ext}",
  win: { target: "nsis" },
  nsis: { oneClick: false, allowToChangeInstallationDirectory: true },
  mac: { target: ["dmg", "zip"], category: "public.app-category.education" },
  linux: { target: ["AppImage", "deb"], category: "Education", maintainer: "CyberDojo" },
  publish: null,
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
    await pack({ config, dir: flag === "--dir" });
  } else {
    console.error("Usage: tsx scripts/desktop.ts dev | stage | start | dist [--dir] | pack [--dir]");
    process.exit(1);
  }
}

void main();
