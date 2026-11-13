/**
 * The desktop app's menus, in the page's language: the menu bar, and the
 * right-click menu, which Electron doesn't provide on its own.
 */
import { BrowserWindow, Menu, clipboard, shell, type ContextMenuParams, type MenuItemConstructorOptions } from "electron";

export type Lang = "en" | "fr";

const WORDS = {
  en: {
    file: "File", go: "Go", help: "Help", view: "View",
    tutor: "Ask the tutor", setup: "Tutor setup", data: "Your data", openData: "Open the data folder",
    back: "Back", forward: "Forward", home: "Today", roadmap: "Roadmap", lessons: "Lessons", practice: "Practice", progress: "Progress",
    reload: "Reload", find: "Search the course",
    updates: "Check for updates…", logs: "Open the logs folder", issue: "Report a problem", source: "Source code", about: "About CyberDojo",
    cut: "Cut", copy: "Copy", paste: "Paste", selectAll: "Select all", copyLink: "Copy link address", openLink: "Open link in your browser", askAbout: "Ask the tutor about this",
  },
  fr: {
    file: "Fichier", go: "Aller", help: "Aide", view: "Affichage",
    tutor: "Demander au tuteur", setup: "Configuration du tuteur", data: "Vos données", openData: "Ouvrir le dossier de données",
    back: "Précédent", forward: "Suivant", home: "Aujourd'hui", roadmap: "Parcours", lessons: "Leçons", practice: "Pratique", progress: "Progression",
    reload: "Recharger", find: "Chercher dans le cours",
    updates: "Rechercher des mises à jour…", logs: "Ouvrir le dossier des journaux", issue: "Signaler un problème", source: "Code source", about: "À propos de CyberDojo",
    cut: "Couper", copy: "Copier", paste: "Coller", selectAll: "Tout sélectionner", copyLink: "Copier l'adresse du lien", openLink: "Ouvrir le lien dans votre navigateur", askAbout: "Demander au tuteur",
  },
} as const;

export const words = (lang: Lang) => WORDS[lang];

export interface MenuActions {
  /** Opens a path of the site, in the page's language. */
  go: (path: string) => void;
  back: () => void;
  forward: () => void;
  openData: () => void;
  openLogs: () => void;
  checkUpdates: () => void;
  about: () => void;
  /** Where to report problems and read the code; null until the project is public. */
  repo: string | null;
  dev: boolean;
}

export function appMenu(lang: Lang, a: MenuActions): Menu {
  const w = words(lang);
  const mac = process.platform === "darwin";
  const template: MenuItemConstructorOptions[] = [
    ...(mac ? [{ role: "appMenu" } as const] : []),
    {
      label: w.file,
      submenu: [
        { label: w.tutor, accelerator: "CmdOrCtrl+T", click: () => a.go("/tutor/") },
        { label: w.setup, click: () => a.go("/tutor/setup/") },
        { type: "separator" },
        { label: w.data, click: () => a.go("/account/") },
        { label: w.openData, click: a.openData },
        ...(mac ? [] : [{ type: "separator" } as const, { role: "quit" } as const]),
      ],
    },
    { role: "editMenu" },
    {
      label: w.go,
      submenu: [
        { label: w.back, accelerator: mac ? "Cmd+[" : "Alt+Left", click: a.back },
        { label: w.forward, accelerator: mac ? "Cmd+]" : "Alt+Right", click: a.forward },
        { type: "separator" },
        { label: w.home, accelerator: mac ? "Cmd+Shift+H" : "Alt+Home", click: () => a.go("/") },
        { label: w.roadmap, accelerator: "CmdOrCtrl+1", click: () => a.go("/roadmap/") },
        { label: w.lessons, accelerator: "CmdOrCtrl+2", click: () => a.go("/courses/") },
        { label: w.practice, accelerator: "CmdOrCtrl+3", click: () => a.go("/practice/") },
        { label: w.progress, accelerator: "CmdOrCtrl+4", click: () => a.go("/skills/") },
        { label: w.tutor, accelerator: "CmdOrCtrl+5", click: () => a.go("/tutor/") },
      ],
    },
    {
      label: w.view,
      submenu: [
        { role: "reload", label: w.reload },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
        ...(a.dev ? [{ role: "toggleDevTools" } as const] : []),
      ],
    },
    { role: "windowMenu" },
    {
      label: w.help,
      submenu: [
        { label: w.updates, click: a.checkUpdates },
        { label: w.logs, click: a.openLogs },
        ...(a.repo
          ? [
              { label: w.issue, click: () => void shell.openExternal(`${a.repo}/issues`) },
              { label: w.source, click: () => void shell.openExternal(a.repo as string) },
            ]
          : []),
        ...(mac ? [] : [{ type: "separator" } as const, { label: w.about, click: a.about }]),
      ],
    },
  ];
  return Menu.buildFromTemplate(template);
}

/** What a right-click offers: edit actions in a text box, copy for a selection, link actions, and asking the tutor. */
export function contextMenu(win: BrowserWindow, p: ContextMenuParams, lang: Lang, ask: (text: string) => void): Menu | null {
  const w = words(lang);
  const items: MenuItemConstructorOptions[] = [];
  const selection = p.selectionText.trim();
  if (p.isEditable) {
    items.push({ role: "cut", label: w.cut, enabled: p.editFlags.canCut }, { role: "copy", label: w.copy, enabled: p.editFlags.canCopy }, { role: "paste", label: w.paste, enabled: p.editFlags.canPaste }, { type: "separator" }, { role: "selectAll", label: w.selectAll });
  } else if (selection) {
    items.push({ role: "copy", label: w.copy });
    items.push({ label: w.askAbout, click: () => ask(selection.slice(0, 2000)) });
  }
  if (p.linkURL && /^https?:/i.test(p.linkURL)) {
    if (items.length) items.push({ type: "separator" });
    items.push({ label: w.copyLink, click: () => clipboard.writeText(p.linkURL) });
    if (!p.linkURL.startsWith(new URL(win.webContents.getURL()).origin)) items.push({ label: w.openLink, click: () => void shell.openExternal(p.linkURL) });
  }
  if (!items.length) {
    const nav = win.webContents.navigationHistory;
    items.push({ label: w.back, enabled: nav.canGoBack(), click: () => nav.goBack() }, { label: w.forward, enabled: nav.canGoForward(), click: () => nav.goForward() }, { type: "separator" }, { role: "reload", label: w.reload });
  }
  return Menu.buildFromTemplate(items);
}
