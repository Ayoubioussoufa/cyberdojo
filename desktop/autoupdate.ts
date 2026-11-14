/**
 * Automatic updates, where the system allows them without a paid certificate:
 * the Windows installer and the Linux AppImage can download a new version in the
 * background and replace themselves on quit. macOS needs an Apple-signed build to
 * self-update, and a .deb is managed by apt, so those keep the manual notice in
 * desktop/updates.ts: the app tells the learner and opens the release page.
 *
 * It reads the project's public GitHub releases through electron-updater; nothing
 * about the learner is sent. Everything is wrapped so that a failure here only
 * falls back to the manual notice and never stops the app.
 */
import { app } from "electron";
import type { AppUpdater, UpdateInfo } from "electron-updater";

export interface AutoUpdateHandlers {
  log: (line: string) => void;
  /** A new version finished downloading and is ready to install. */
  onReady: (version: string) => void;
  /** A by-hand check found nothing newer. */
  onUpToDate: () => void;
  /** The check or download failed; `byHand` says whether the learner asked. */
  onError: (byHand: boolean) => void;
}

/**
 * Only a packaged Windows install or Linux AppImage can replace itself here.
 * macOS self-update needs Apple signing; a Debian package is updated through apt.
 */
export function canAutoInstall(): boolean {
  if (!app.isPackaged) return false;
  if (process.platform === "win32") return true;
  if (process.platform === "linux") return Boolean(process.env.APPIMAGE);
  return false;
}

/** electron-updater, loaded defensively: a bundling or load problem becomes "no auto-update", not a crash. */
function load(log: (line: string) => void): AppUpdater | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return (require("electron-updater") as { autoUpdater: AppUpdater }).autoUpdater;
  } catch (e) {
    log(`auto-update unavailable: ${String(e)}`);
    return null;
  }
}

let updater: AppUpdater | null = null;
let manual = false;

/**
 * Wires the updater once and returns a function to run a check. The download is
 * automatic; `onReady` fires when it's installed and ready. Returns null when
 * this system can't auto-update, so the caller uses the manual notice instead.
 */
export function wireAutoUpdate(h: AutoUpdateHandlers): ((byHand: boolean) => void) | null {
  if (!canAutoInstall()) return null;
  if (!updater) {
    const u = load(h.log);
    if (!u) return null;
    updater = u;
    try {
      u.autoDownload = true;
      u.autoInstallOnAppQuit = true;
      u.allowPrerelease = false;
      u.allowDowngrade = false;
      u.logger = { info: h.log, warn: h.log, error: h.log, debug: () => {} } as AppUpdater["logger"];
      // The releases to read: inferred from the bundled app-update.yml, set again here in case it's missing.
      const gh = /github\.com\/([^/]+)\/([^/.]+)/.exec(repoFromPackage());
      if (gh) u.setFeedURL({ provider: "github", owner: gh[1] as string, repo: gh[2] as string });
      u.on("update-available", (info: UpdateInfo) => h.log(`auto-update: ${info.version} available, downloading`));
      u.on("update-downloaded", (info: UpdateInfo) => {
        manual = false;
        h.onReady(info.version);
      });
      u.on("update-not-available", () => {
        if (manual) h.onUpToDate();
        manual = false;
      });
      u.on("error", (err: Error) => {
        h.log(`auto-update error: ${err.message}`);
        const was = manual;
        manual = false;
        h.onError(was);
      });
    } catch (e) {
      h.log(`auto-update setup failed: ${String(e)}`);
      updater = null;
      return null;
    }
  }
  return (byHand: boolean) => {
    manual = byHand;
    updater?.checkForUpdates().catch((e: unknown) => {
      h.log(`auto-update check failed: ${String(e)}`);
      const was = manual;
      manual = false;
      h.onError(was);
    });
  };
}

/** Quit and install the downloaded update now. */
export function installNow(): void {
  try {
    updater?.quitAndInstall();
  } catch {
    // If it can't, the update still installs on the next quit (autoInstallOnAppQuit).
  }
}

function repoFromPackage(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require("node:fs") as typeof import("node:fs");
    const path = require("node:path") as typeof import("node:path");
    const pkg = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), "package.json"), "utf8")) as { repository?: string };
    return pkg.repository ?? "";
  } catch {
    return "";
  }
}
