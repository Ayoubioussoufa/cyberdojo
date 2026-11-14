/**
 * The desktop app: one window showing the CyberDojo site, served by a local
 * server this process starts and stops. The page gets no Node access and no
 * preload script: everything it needs comes over HTTP from that server, the
 * same way the website works.
 *
 * This file adds what a browser tab would have and a window doesn't: menus,
 * a right-click menu, back and forward on the mouse, a remembered size and
 * place, and the last page read reopened at launch.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, dialog, Menu, screen, session, shell } from "electron";
import { appMenu, contextMenu, type Lang } from "./menu";
import { startServer, type Server } from "./server";
import { installNow, wireAutoUpdate } from "./autoupdate";
import { findUpdate } from "./updates";

/** Must match DESKTOP_COOKIE in src/server/desktop.ts. */
const WINDOW_COOKIE = "cyberdojo-desktop";
const BACKGROUND = "#10171f";
const SPLASH = `data:text/html;charset=utf-8,${encodeURIComponent(
  `<body style="margin:0;height:100vh;display:grid;place-items:center;background:${BACKGROUND};color:#97a4b3;font:15px ui-monospace,Consolas,Menlo,monospace"><p>guest@cyberdojo:~$ starting<span style="color:#f2a93b">_</span></p></body>`,
)}`;
const DAY_MS = 24 * 60 * 60 * 1000;

let server: Server | null = null;
let win: BrowserWindow | null = null;
/** Set once the learner has agreed to close, so the close handler lets the window go. */
let closing = false;
/** Quitting (Cmd+Q, the Quit menu) rather than closing the window: on a Mac the two differ. */
let quitting = false;

const userData = () => app.getPath("userData");
const logDir = () => path.join(userData(), "logs");
const logFile = () => path.join(logDir(), "main.log");
function log(line: string) {
  try {
    fs.mkdirSync(logDir(), { recursive: true });
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // A log that can't be written must not stop the app.
  }
}

/** What the window remembers between launches. */
interface State {
  bounds?: { x: number; y: number; width: number; height: number };
  maximized?: boolean;
  zoom?: number;
  /** The last page open, as a path on the local server. */
  path?: string;
  updateCheckedAt?: number;
  /** A version the learner was already told about. */
  updateSeen?: string;
}

const stateFile = () => path.join(userData(), "window.json");
function readState(): State {
  try {
    return JSON.parse(fs.readFileSync(stateFile(), "utf8")) as State;
  } catch {
    return {};
  }
}
function writeState(patch: Partial<State>) {
  try {
    fs.writeFileSync(stateFile(), JSON.stringify({ ...readState(), ...patch }, null, 2));
  } catch (e) {
    log(`window state not saved: ${String(e)}`);
  }
}

/** Saved bounds are used only if they still land on a screen: a monitor may have been unplugged. */
function onScreen(b: State["bounds"]): b is NonNullable<State["bounds"]> {
  if (!b) return false;
  return screen.getAllDisplays().some(({ workArea: a }) => b.x < a.x + a.width - 80 && b.x + b.width > a.x + 80 && b.y >= a.y - 10 && b.y < a.y + a.height - 80);
}

const isWeb = (url: string) => /^https?:\/\//i.test(url);
const ours = (url: string) => {
  try {
    return !!server && new URL(url).origin === server.origin;
  } catch {
    return false;
  }
};

/** The page's language, read from its address: French pages live under /fr/. */
function pageLang(): Lang {
  const url = win?.webContents.getURL() ?? "";
  return ours(url) && new URL(url).pathname.startsWith("/fr/") ? "fr" : "en";
}

/** The repository, from the app's package.json; null until it's set. */
function repo(): string | null {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(app.getAppPath(), "package.json"), "utf8")) as { repository?: string };
    return pkg.repository && /^https:\/\/github\.com\/[\w.-]+\/[\w.-]+$/.test(pkg.repository) ? pkg.repository : null;
  } catch {
    return null;
  }
}

function go(sitePath: string) {
  if (!win || !server) return;
  const prefix = pageLang() === "fr" ? "/fr" : "";
  void win.loadURL(`${server.origin}${prefix}${sitePath}`);
}

const SAY = {
  en: {
    stillRunning: "The tutor is still downloading.",
    stillDetail: "If you quit now the download stops. A model download picks up where it stopped next time; an Ollama install starts again.",
    quit: "Quit", stay: "Keep downloading",
    upToDate: "CyberDojo is up to date.", noCheck: "Updates couldn't be checked. Check your connection, or try again later.",
    newVersion: (v: string) => `CyberDojo ${v} is available.`, newDetail: "Download the installer from the release page, then run it. Your progress and chats stay where they are.",
    ready: (v: string) => `CyberDojo ${v} is ready to install.`, readyDetail: "It downloaded in the background. Restart now to use it, or it installs the next time you quit. Your progress and chats stay where they are.",
    restart: "Restart now",
    download: "Open the release page", later: "Later",
    about: (v: string) => `CyberDojo ${v}`, aboutDetail: "Cybersecurity from zero, with a tutor that runs on your computer.",
    failed: "CyberDojo couldn't start",
  },
  fr: {
    stillRunning: "Le tuteur est encore en train de télécharger.",
    stillDetail: "Si vous quittez maintenant, le téléchargement s'arrête. Un téléchargement de modèle reprendra là où il s'est arrêté ; une installation d'Ollama recommencera.",
    quit: "Quitter", stay: "Continuer le téléchargement",
    upToDate: "CyberDojo est à jour.", noCheck: "Impossible de vérifier les mises à jour. Vérifiez votre connexion, ou réessayez plus tard.",
    newVersion: (v: string) => `CyberDojo ${v} est disponible.`, newDetail: "Téléchargez l'installateur depuis la page de la version, puis lancez-le. Votre progression et vos échanges restent en place.",
    ready: (v: string) => `CyberDojo ${v} est prêt à être installé.`, readyDetail: "Il a été téléchargé en arrière-plan. Redémarrez maintenant pour l'utiliser, ou il s'installera au prochain arrêt. Votre progression et vos échanges restent en place.",
    restart: "Redémarrer maintenant",
    download: "Ouvrir la page de la version", later: "Plus tard",
    about: (v: string) => `CyberDojo ${v}`, aboutDetail: "La cybersécurité depuis zéro, avec un tuteur qui tourne sur votre ordinateur.",
    failed: "CyberDojo n'a pas pu démarrer",
  },
};

interface StatusPeek {
  job?: { state: string } | null;
  settings?: { welcomed?: string };
}

/** Asks the local server what the tutor is doing, the way the window would. */
async function tutorStatus(): Promise<StatusPeek | null> {
  if (!server) return null;
  try {
    const res = await fetch(`${server.origin}/api/tutor/status/`, { headers: { Cookie: `${WINDOW_COOKIE}=${server.token}` }, signal: AbortSignal.timeout(8000) });
    return res.ok ? ((await res.json()) as StatusPeek) : null;
  } catch {
    return null;
  }
}

/**
 * The manual notice, for macOS and the Debian package, which can't replace
 * themselves without a paid certificate: the release page opens in the browser.
 */
async function manualUpdate(byHand: boolean) {
  const say = SAY[pageLang()];
  const where = repo();
  let found: Awaited<ReturnType<typeof findUpdate>> = null;
  try {
    if (!where) throw new Error("no repository set");
    found = await findUpdate(where, app.getVersion());
  } catch (e) {
    log(`update check: ${String(e)}`);
    if (byHand && win) await dialog.showMessageBox(win, { type: "info", message: say.noCheck });
    return;
  }
  if (!found) {
    if (byHand && win) await dialog.showMessageBox(win, { type: "info", message: say.upToDate });
    return;
  }
  if (!byHand && readState().updateSeen === found.version) return;
  writeState({ updateSeen: found.version });
  if (!win) return;
  const { response } = await dialog.showMessageBox(win, { type: "info", message: say.newVersion(found.version), detail: say.newDetail, buttons: [say.download, say.later], defaultId: 0, cancelId: 1 });
  if (response === 0) void shell.openExternal(found.url);
}

/** Download-and-replace for Windows and the Linux AppImage; null on macOS, the .deb and in dev. */
const autoCheck = wireAutoUpdate({
  log,
  onReady: (version) => {
    if (!win) return;
    const say = SAY[pageLang()];
    void dialog
      .showMessageBox(win, { type: "info", message: say.ready(version), detail: say.readyDetail, buttons: [say.restart, say.later], defaultId: 0, cancelId: 1 })
      .then(({ response }) => {
        if (response === 0) installNow();
      });
  },
  onUpToDate: () => {
    if (win) void dialog.showMessageBox(win, { type: "info", message: SAY[pageLang()].upToDate });
  },
  // If the updater itself fails, the learner still gets the manual notice and the release page.
  onError: (byHand) => void manualUpdate(byHand),
});

function checkUpdates(byHand: boolean) {
  writeState({ updateCheckedAt: Date.now() });
  if (autoCheck) autoCheck(byHand);
  else void manualUpdate(byHand);
}

function setMenu() {
  Menu.setApplicationMenu(
    appMenu(pageLang(), {
      go,
      back: () => win?.webContents.navigationHistory.goBack(),
      forward: () => win?.webContents.navigationHistory.goForward(),
      openData: () => void shell.openPath(userData()),
      openLogs: () => {
        fs.mkdirSync(logDir(), { recursive: true });
        void shell.openPath(logDir());
      },
      checkUpdates: () => void checkUpdates(true),
      about: () => {
        const say = SAY[pageLang()];
        if (win) void dialog.showMessageBox(win, { type: "info", message: say.about(app.getVersion()), detail: say.aboutDetail });
      },
      repo: repo(),
      dev: !app.isPackaged,
    }),
  );
}

/** Hands a selected passage to the tutor. The page's tutor panel defines this function. */
function askAbout(text: string) {
  void win?.webContents.executeJavaScript(`window.cyberdojoAsk && window.cyberdojoAsk(${JSON.stringify(text)})`, true).catch(() => undefined);
}

function createWindow(state: State): BrowserWindow {
  const w = new BrowserWindow({
    ...(onScreen(state.bounds) ? state.bounds : { width: 1320, height: 880 }),
    minWidth: 380,
    minHeight: 560,
    backgroundColor: BACKGROUND,
    title: "CyberDojo",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  if (state.maximized) w.maximize();
  // Course links to other sites open in the learner's browser, never inside the app.
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (isWeb(url) && !ours(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  w.webContents.on("will-navigate", (event, url) => {
    if (url === SPLASH || ours(url)) return;
    event.preventDefault();
    if (isWeb(url)) void shell.openExternal(url);
  });
  w.webContents.on("context-menu", (_e, params) => contextMenu(w, params, pageLang(), askAbout)?.popup({ window: w }));
  // The mouse's back and forward buttons, on Windows and Linux.
  w.on("app-command", (_e, command) => {
    if (command === "browser-backward") w.webContents.navigationHistory.goBack();
    if (command === "browser-forward") w.webContents.navigationHistory.goForward();
  });
  // A two-finger swipe on a Mac trackpad.
  w.on("swipe", (_e, direction) => {
    if (direction === "left") w.webContents.navigationHistory.goBack();
    if (direction === "right") w.webContents.navigationHistory.goForward();
  });
  // The menus follow the page's language.
  let lang = pageLang();
  const relabel = () => {
    if (pageLang() === lang) return;
    lang = pageLang();
    setMenu();
  };
  w.webContents.on("did-navigate", relabel);
  w.webContents.on("did-navigate-in-page", relabel);
  w.webContents.on("render-process-gone", (_e, details) => {
    log(`page crashed: ${details.reason}`);
    if (details.reason !== "clean-exit") w.webContents.reload();
  });
  w.on("close", (event) => {
    if (closing) return;
    event.preventDefault();
    void (async () => {
      const status = await tutorStatus();
      if (status?.job?.state === "running") {
        const say = SAY[pageLang()];
        const { response } = await dialog.showMessageBox(w, { type: "question", message: say.stillRunning, detail: say.stillDetail, buttons: [say.stay, say.quit], defaultId: 0, cancelId: 0 });
        if (response !== 1) {
          quitting = false;
          return;
        }
      }
      const url = w.webContents.getURL();
      writeState({
        bounds: w.isMaximized() || w.isFullScreen() ? readState().bounds : w.getBounds(),
        maximized: w.isMaximized(),
        zoom: w.webContents.getZoomFactor(),
        ...(ours(url) ? { path: new URL(url).pathname + new URL(url).search } : {}),
      });
      closing = true;
      w.close();
    })();
  });
  w.on("closed", () => {
    win = null;
    closing = false;
    // The close handler held the quit back to ask first; finish it now.
    if (quitting) app.quit();
  });
  return w;
}

/** The page to open: the tutor's welcome on a first launch, otherwise the last page read. */
async function firstPage(state: State): Promise<string> {
  const status = await tutorStatus();
  if (status?.settings && status.settings.welcomed !== "1") return "/tutor/setup/?welcome=1";
  const last = state.path;
  return last && last.startsWith("/") && !last.startsWith("//") && !last.startsWith("/api/") ? last : "/";
}

async function open() {
  const state = readState();
  win = createWindow(state);
  await win.loadURL(SPLASH);
  if (!server) {
    server = await startServer(log);
    log(`server ready at ${server.origin}`);
    await session.defaultSession.cookies.set({ url: server.origin, name: WINDOW_COOKIE, value: server.token, httpOnly: true, sameSite: "strict" });
  }
  await win?.loadURL(`${server.origin}${await firstPage(state)}`);
  if (state.zoom) win?.webContents.setZoomFactor(state.zoom);
  setMenu();
  if (!state.updateCheckedAt || Date.now() - state.updateCheckedAt > DAY_MS) setTimeout(() => void checkUpdates(false), 15_000);
}

/** The copy of Ollama this app started (see src/server/tutor/runtime.ts), stopped with the app. Ollama's own desktop app is left alone. */
function stopOllama() {
  const file = path.join(userData(), "ollama.pid");
  let pid: number | undefined;
  try {
    pid = (JSON.parse(fs.readFileSync(file, "utf8")) as { pid?: number }).pid;
    fs.rmSync(file, { force: true });
  } catch {
    return;
  }
  if (!pid) return;
  try {
    if (process.platform === "win32") spawnSync("taskkill", ["/pid", String(pid), "/t", "/f"], { windowsHide: true });
    else process.kill(-pid, "SIGTERM");
    log(`stopped ollama ${pid}`);
  } catch {
    // Already gone.
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (win?.isMinimized()) win.restore();
    win?.focus();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    if (!win) void open();
  });
  app.on("before-quit", () => {
    quitting = true;
  });
  app.on("will-quit", () => {
    server?.stop();
    stopOllama();
  });

  void app.whenReady().then(async () => {
    setMenu();
    // The course never needs the camera, the microphone, the location or notifications.
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, allow) => allow(false));
    try {
      await open();
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      log(`failed to start: ${reason}`);
      dialog.showErrorBox(SAY.en.failed, `${reason}\n\nLog: ${logFile()}`);
      app.quit();
    }
  });
}
