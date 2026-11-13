/**
 * The desktop app: one window showing the CyberDojo site, served by a local
 * server this process starts and stops. The page gets no Node access and no
 * preload script: everything it needs comes over HTTP from that server, the
 * same way the website works.
 */
import fs from "node:fs";
import path from "node:path";
import { app, BrowserWindow, dialog, Menu, session, shell, type MenuItemConstructorOptions } from "electron";
import { startServer, type Server } from "./server";

/** Must match DESKTOP_COOKIE in src/server/desktop.ts. */
const WINDOW_COOKIE = "cyberdojo-desktop";
const BACKGROUND = "#10171f";
const SPLASH = `data:text/html;charset=utf-8,${encodeURIComponent(
  `<body style="margin:0;height:100vh;display:grid;place-items:center;background:${BACKGROUND};color:#97a4b3;font:15px ui-monospace,Consolas,Menlo,monospace"><p>guest@cyberdojo:~$ starting<span style="color:#f2a93b">_</span></p></body>`,
)}`;

let server: Server | null = null;
let win: BrowserWindow | null = null;

const logFile = () => path.join(app.getPath("userData"), "logs", "main.log");
function log(line: string) {
  try {
    fs.mkdirSync(path.dirname(logFile()), { recursive: true });
    fs.appendFileSync(logFile(), `[${new Date().toISOString()}] ${line}\n`);
  } catch {
    // A log that can't be written must not stop the app.
  }
}

const isWeb = (url: string) => /^https?:\/\//i.test(url);

function createWindow(): BrowserWindow {
  const w = new BrowserWindow({
    width: 1320,
    height: 880,
    minWidth: 380,
    minHeight: 560,
    backgroundColor: BACKGROUND,
    title: "CyberDojo",
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, sandbox: true, nodeIntegration: false, spellcheck: false },
  });
  // Course links to other sites open in the learner's browser, never inside the app.
  w.webContents.setWindowOpenHandler(({ url }) => {
    if (isWeb(url)) void shell.openExternal(url);
    return { action: "deny" };
  });
  w.webContents.on("will-navigate", (event, url) => {
    if (url === SPLASH || (server && new URL(url).origin === server.origin)) return;
    event.preventDefault();
    if (isWeb(url)) void shell.openExternal(url);
  });
  w.on("closed", () => {
    win = null;
  });
  return w;
}

function menu(): Menu {
  const template: MenuItemConstructorOptions[] = [
    ...(process.platform === "darwin" ? [{ role: "appMenu" } as const] : []),
    { role: "editMenu" },
    { role: "viewMenu" },
    { role: "windowMenu" },
  ];
  return Menu.buildFromTemplate(template);
}

async function open() {
  win = createWindow();
  await win.loadURL(SPLASH);
  if (!server) {
    server = await startServer(log);
    log(`server ready at ${server.origin}`);
    await session.defaultSession.cookies.set({ url: server.origin, name: WINDOW_COOKIE, value: server.token, httpOnly: true, sameSite: "strict" });
  }
  await win?.loadURL(`${server.origin}/`);
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
  app.on("will-quit", () => server?.stop());

  void app.whenReady().then(async () => {
    Menu.setApplicationMenu(menu());
    // The course never needs the camera, the microphone, the location or notifications.
    session.defaultSession.setPermissionRequestHandler((_contents, _permission, allow) => allow(false));
    try {
      await open();
    } catch (e) {
      const reason = e instanceof Error ? e.message : String(e);
      log(`failed to start: ${reason}`);
      dialog.showErrorBox("CyberDojo couldn't start", `${reason}\n\nLog: ${logFile()}`);
      app.quit();
    }
  });
}
