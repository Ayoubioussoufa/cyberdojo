/**
 * The desktop app: windows showing the CyberDojo site, served by a local
 * server this process starts and stops. The page gets no Node access and no
 * preload script: everything it needs comes over HTTP from that server, the
 * same way the website works.
 *
 * This file makes the app behave like a browser that only shows the course:
 * several windows, each with its own back-and-forward history, links opened in
 * a new window, menus, a right-click menu, back and forward on the mouse, and
 * every window (size, place, history) reopened as it was at the next launch.
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
/** Every open window, oldest first. Menus, dialogs and "go" act on the one in front. */
const windows = new Set<BrowserWindow>();
const front = (): BrowserWindow | null => BrowserWindow.getFocusedWindow() ?? [...windows].at(-1) ?? null;
/** Windows the learner has agreed to close: the close handler lets them go. */
const released = new WeakSet<BrowserWindow>();
/** The start-up screen, once the real windows have taken over: closing it changes nothing to remember. */
const standIns = new WeakSet<BrowserWindow>();
/** Quitting (Cmd+Q, the Quit menu) rather than closing a window: on a Mac the two differ. */
let quitting = false;
/** Pages kept per window between launches; older ones are dropped. */
const MAX_ENTRIES = 50;

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

type Bounds = { x: number; y: number; width: number; height: number };

/** One window as it was left: where it sat, and the pages in its history as paths on the local server. */
interface SavedWindow {
  bounds?: Bounds;
  maximized?: boolean;
  zoom?: number;
  entries: { path: string; title: string }[];
  /** The page that was showing, as an index into entries. */
  index: number;
}

/** What the app remembers between launches. */
interface State {
  /** Every window open at the last quit, the one in front last. */
  windows?: SavedWindow[];
  /** From versions before 0.4, which had one window: its place and its last page. */
  bounds?: Bounds;
  maximized?: boolean;
  zoom?: number;
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

/** A page's path, query and anchor: what a window's history keeps, independent of the server's port. */
const sitePath = (url: string) => {
  const u = new URL(url);
  return u.pathname + u.search + u.hash;
};
const isSitePath = (p: unknown): p is string => typeof p === "string" && p.startsWith("/") && !p.startsWith("//") && !p.startsWith("/api/");

/** The page's language, read from its address: French pages live under /fr/. */
function pageLang(w: BrowserWindow | null = front()): Lang {
  const url = w?.webContents.getURL() ?? "";
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

function go(to: string) {
  const w = front();
  if (!w || !server) return;
  const prefix = pageLang(w) === "fr" ? "/fr" : "";
  void w.loadURL(`${server.origin}${prefix}${to}`);
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
  const win = front();
  const say = SAY[pageLang(win)];
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
  const now = front();
  if (!now) return;
  const { response } = await dialog.showMessageBox(now, { type: "info", message: say.newVersion(found.version), detail: say.newDetail, buttons: [say.download, say.later], defaultId: 0, cancelId: 1 });
  if (response === 0) void shell.openExternal(found.url);
}

/** Download-and-replace for Windows and the Linux AppImage; null on macOS, the .deb and in dev. */
const autoCheck = wireAutoUpdate({
  log,
  onReady: (version) => {
    const win = front();
    if (!win) return;
    const say = SAY[pageLang(win)];
    void dialog
      .showMessageBox(win, { type: "info", message: say.ready(version), detail: say.readyDetail, buttons: [say.restart, say.later], defaultId: 0, cancelId: 1 })
      .then(({ response }) => {
        if (response === 0) installNow();
      });
  },
  onUpToDate: () => {
    const win = front();
    if (win) void dialog.showMessageBox(win, { type: "info", message: SAY[pageLang(win)].upToDate });
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
      back: () => front()?.webContents.navigationHistory.goBack(),
      forward: () => front()?.webContents.navigationHistory.goForward(),
      newWindow: () => newWindow(),
      openData: () => void shell.openPath(userData()),
      openLogs: () => {
        fs.mkdirSync(logDir(), { recursive: true });
        void shell.openPath(logDir());
      },
      checkUpdates: () => void checkUpdates(true),
      about: () => {
        const win = front();
        const say = SAY[pageLang(win)];
        if (win) void dialog.showMessageBox(win, { type: "info", message: say.about(app.getVersion()), detail: say.aboutDetail });
      },
      repo: repo(),
      dev: !app.isPackaged,
    }),
  );
}

/** Hands a selected passage to the tutor. The page's tutor panel defines this function. */
function askAbout(w: BrowserWindow, text: string) {
  void w.webContents.executeJavaScript(`window.cyberdojoAsk && window.cyberdojoAsk(${JSON.stringify(text)})`, true).catch(() => undefined);
}

/** A window's history as it stands, without the start-up screen, for reopening it at the next launch. */
function snapshot(w: BrowserWindow): SavedWindow | null {
  const nav = w.webContents.navigationHistory;
  const active = nav.getActiveIndex();
  let entries: SavedWindow["entries"] = [];
  let index = 0;
  nav.getAllEntries().forEach((e, i) => {
    if (!ours(e.url)) return;
    if (i <= active) index = entries.length;
    entries.push({ path: sitePath(e.url), title: e.title });
  });
  if (!entries.length) return null;
  const drop = Math.max(0, entries.length - MAX_ENTRIES);
  entries = entries.slice(drop);
  return { bounds: w.getNormalBounds(), maximized: w.isMaximized(), zoom: w.webContents.getZoomFactor(), entries, index: Math.max(0, index - drop) };
}

/** Writes down every open window, the one in front last, so the next launch reopens them all. */
function saveSession() {
  const inFront = front();
  const order = [...windows].filter((w) => w !== inFront).concat(inFront ? [inFront] : []);
  const saved = order.map(snapshot).filter((x): x is SavedWindow => x !== null);
  if (saved.length) writeState({ windows: saved, path: undefined, bounds: undefined, maximized: undefined, zoom: undefined });
}

let saveTimer: NodeJS.Timeout | undefined;
/** After each move between pages, so a crash or a power cut loses little. */
function saveSoon() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!quitting) saveSession();
  }, 1500);
}

function createWindow(place: Pick<SavedWindow, "bounds" | "maximized" | "zoom"> = {}, show = true): BrowserWindow {
  const w = new BrowserWindow({
    show,
    ...(onScreen(place.bounds) ? place.bounds : { width: 1320, height: 880 }),
    minWidth: 380,
    minHeight: 560,
    backgroundColor: BACKGROUND,
    title: "CyberDojo",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  windows.add(w);
  if (place.maximized) {
    if (show) w.maximize();
    else w.once("show", () => w.maximize());
  }
  if (place.zoom) {
    const zoom = place.zoom;
    w.webContents.once("did-finish-load", () => w.webContents.setZoomFactor(zoom));
  }
  // A course link opened "in a new window" (Ctrl+click, middle click, Shift+click) gets an app window;
  // links to other sites open in the learner's browser, never inside the app.
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (ours(url)) newWindow(sitePath(url), w);
    else if (isWeb(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  w.webContents.on("will-navigate", (event, url) => {
    if (url === SPLASH || ours(url)) return;
    event.preventDefault();
    if (isWeb(url)) void shell.openExternal(url);
  });
  w.webContents.on("context-menu", (_e, params) =>
    contextMenu(w, params, pageLang(w), { ask: (text) => askAbout(w, text), openInWindow: (url) => newWindow(sitePath(url), w), newWindow: () => newWindow(undefined, w) })?.popup({ window: w }),
  );
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
  // The page's back and forward buttons (src/components/HistoryButtons.tsx) learn from here what this
  // window's history allows: after a restore, the page itself can't see the pages reopened before it.
  const tellPage = () => {
    if (!ours(w.webContents.getURL())) return;
    const n = w.webContents.navigationHistory;
    const can = JSON.stringify({ back: n.canGoBack(), forward: n.canGoForward() });
    void w.webContents.executeJavaScript(`window.__cyberdojoHistory=${can};window.dispatchEvent(new Event("cyberdojo-history"))`, true).catch(() => undefined);
  };
  w.webContents.on("did-finish-load", tellPage);
  w.webContents.on("did-navigate-in-page", tellPage);
  // The menus follow the language of the page in front.
  const moved = () => {
    setMenu();
    saveSoon();
  };
  w.webContents.on("did-navigate", moved);
  w.webContents.on("did-navigate-in-page", moved);
  w.on("focus", setMenu);
  w.webContents.on("render-process-gone", (_e, details) => {
    log(`page crashed: ${details.reason}`);
    if (details.reason !== "clean-exit") w.webContents.reload();
  });
  w.on("close", (event) => {
    // Another window stays open, so nothing running is at risk: this one just goes.
    if (released.has(w) || windows.size > 1) return;
    event.preventDefault();
    void (async () => {
      const status = await tutorStatus();
      if (status?.job?.state === "running") {
        const say = SAY[pageLang(w)];
        const { response } = await dialog.showMessageBox(w, { type: "question", message: say.stillRunning, detail: say.stillDetail, buttons: [say.stay, say.quit], defaultId: 0, cancelId: 0 });
        if (response !== 1) {
          quitting = false;
          return;
        }
      }
      // Quitting already wrote down every window; closing the last one by hand writes down this one.
      if (!quitting) saveSession();
      released.add(w);
      w.close();
    })();
  });
  w.on("closed", () => {
    windows.delete(w);
    // A window closed by hand while others stay is dropped from the next launch, as in a browser.
    if (!quitting && windows.size > 0 && !standIns.has(w)) saveSession();
    // The close handler held the quit back to ask first; finish it now.
    if (quitting && windows.size === 0) app.quit();
  });
  return w;
}

/** Opens another window on a page of the course: the one in front's page when none is given. */
function newWindow(to?: string, from: BrowserWindow | null = front()): BrowserWindow | null {
  if (!server) return null;
  const path = isSitePath(to) ? to : from && ours(from.webContents.getURL()) ? sitePath(from.webContents.getURL()) : "/";
  // A little down and to the right of the window it came from, so both stay visible.
  const b = from?.getNormalBounds();
  const w = createWindow({ bounds: b && { ...b, x: b.x + 28, y: b.y + 28 }, zoom: from?.webContents.getZoomFactor() });
  void w.loadURL(`${server.origin}${path}`);
  return w;
}

/** Reopens a window's pages, so its back and forward work as they did before the app closed. */
async function reopen(w: BrowserWindow, saved: SavedWindow) {
  if (!server) return;
  const entries = saved.entries.filter((e) => isSitePath(e.path)).map((e) => ({ url: `${server!.origin}${e.path}`, title: typeof e.title === "string" ? e.title : "" }));
  if (!entries.length) {
    await w.loadURL(`${server.origin}/`);
    return;
  }
  const index = Math.min(Math.max(0, Math.floor(saved.index) || 0), entries.length - 1);
  try {
    await w.webContents.navigationHistory.restore({ entries, index });
  } catch (e) {
    log(`history not restored: ${String(e)}`);
    await w.loadURL(entries[index]!.url);
  }
}

/** The tutor's welcome on a first launch; null once the learner has been welcomed. */
async function welcome(): Promise<string | null> {
  const status = await tutorStatus();
  return status?.settings && status.settings.welcomed !== "1" ? "/tutor/setup/?welcome=1" : null;
}

/** The windows from the last launch, or one window built from an older version's state. */
function savedWindows(state: State): SavedWindow[] {
  const list = (state.windows ?? []).filter((w) => Array.isArray(w?.entries) && w.entries.length > 0);
  if (list.length) return list;
  return [{ bounds: state.bounds, maximized: state.maximized, zoom: state.zoom, entries: [{ path: isSitePath(state.path) ? state.path : "/", title: "" }], index: 0 }];
}

async function open() {
  const state = readState();
  const saved = savedWindows(state);
  // The start-up screen shows where the window in front will be, while the server starts.
  const last = saved.at(-1) as SavedWindow;
  const first = createWindow(last);
  await first.loadURL(SPLASH);
  if (!server) {
    server = await startServer(log);
    log(`server ready at ${server.origin}`);
    await session.defaultSession.cookies.set({ url: server.origin, name: WINDOW_COOKIE, value: server.token, httpOnly: true, sameSite: "strict" });
  }
  const greet = await welcome();
  if (greet) {
    await first.loadURL(`${server.origin}${greet}`);
  } else {
    // Electron restores a history only into a window that has loaded nothing yet, and this one has shown
    // the start-up screen. So every saved window opens fresh behind it, the one in front last, and the
    // start-up screen steps aside once they're ready.
    const opened = saved.map((s) => {
      const w = createWindow(s, false);
      return { w, ready: reopen(w, s) };
    });
    await Promise.race([Promise.all(opened.map((o) => o.ready)), new Promise((r) => setTimeout(r, 15_000))]);
    for (const { w } of opened) if (!w.isDestroyed()) w.show();
    opened.at(-1)?.w.focus();
    standIns.add(first);
    released.add(first);
    first.close();
  }
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
    const win = front();
    if (win?.isMinimized()) win.restore();
    win?.focus();
  });
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
  app.on("activate", () => {
    if (windows.size === 0) void open();
  });
  app.on("before-quit", () => {
    // Every window is still open here: write them all down before they start closing.
    if (!quitting && windows.size > 0) saveSession();
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
