/**
 * Colours the code blocks of course pages, when the page is built: the reader's
 * browser gets plain HTML with colours, and downloads no highlighter. Shiki uses
 * the same grammars as VS Code. Each token carries a colour for the dark theme and
 * one for the light theme as CSS variables, and globals.css picks one per theme.
 * Each block can take keyboard focus, so a reader who can't use a mouse can still
 * scroll a long line sideways.
 *
 * A block that names its language (```python) is coloured in that language. A
 * block that names none is coloured as shell only when its first word is a real
 * command, so program output, logs and tables stay plain.
 */
import { createHighlighterCoreSync, type HighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import bash from "shiki/langs/bash.mjs";
import c from "shiki/langs/c.mjs";
import diff from "shiki/langs/diff.mjs";
import dockerfile from "shiki/langs/dockerfile.mjs";
import html from "shiki/langs/html.mjs";
import http from "shiki/langs/http.mjs";
import ini from "shiki/langs/ini.mjs";
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import powershell from "shiki/langs/powershell.mjs";
import python from "shiki/langs/python.mjs";
import sql from "shiki/langs/sql.mjs";
import toml from "shiki/langs/toml.mjs";
import typescript from "shiki/langs/typescript.mjs";
import xml from "shiki/langs/xml.mjs";
import yaml from "shiki/langs/yaml.mjs";
import dark from "shiki/themes/github-dark-default.mjs";
import light from "shiki/themes/github-light-default.mjs";

const THEMES = { dark: "github-dark-default", light: "github-light-default" } as const;

/**
 * GitHub's light theme is made for a white page; on the course's grey code
 * background three of its colours fall below WCAG AA (4.5:1). These darker
 * versions of the same hues pass (scripts/check-css.ts checks them).
 */
export const LIGHT_FIXES: Record<string, string> = { "#6e7781": "#4f5964", "#8250df": "#6639ba", "#cf222e": "#a40e26" };

/** Other names writers use for the same languages. */
const ALIASES: Record<string, string> = {
  sh: "bash", shell: "bash", shellscript: "bash", console: "bash", zsh: "bash", terminal: "bash",
  ps1: "powershell", pwsh: "powershell", ps: "powershell",
  py: "python", python3: "python",
  js: "javascript", ts: "typescript",
  yml: "yaml", docker: "dockerfile", conf: "ini", cfg: "ini",
};

/** First words that mean "this block is commands to type". */
const COMMANDS = new Set(
  `apt apt-get awk base64 bash cat cd chmod chown cosign cp crontab curl cut dd df dig docker du echo env export
  file find gcc getent git gpg grep gunzip gzip hashcat head host hostname hydra id ip iptables jq john journalctl
  kill kubectl last less ln ls lsblk lsof make man mkdir mount mv nc ncat netstat nft nikto nmap nslookup openssl
  passwd pip pip3 ping pnpm ps pwd python python3 rm scp sed semgrep sftp sha256sum sort sqlite3 ss ssh ssh-copy-id
  ssh-keygen sshd strace strings su sudo systemctl tail tar tcpdump tee testssl.sh top touch tr traceroute trivy
  tshark ufw uname uniq usermod useradd vim wc wget which whoami xxd yara zgrep syft grype kind helm terraform
  npm node npx go cargo rustc java javac docker-compose podman lynis nuclei sqlmap gobuster ffuf whois`.split(/\s+/),
);

let instance: HighlighterCore | null = null;
const highlighter = () =>
  (instance ??= createHighlighterCoreSync({
    themes: [dark, light],
    langs: [bash, c, diff, dockerfile, html, http, ini, javascript, json, powershell, python, sql, toml, typescript, xml, yaml],
    engine: createJavaScriptRegexEngine(),
  }));

/** "bash" when the block starts with a command (after an optional `$ ` prompt or `sudo`), otherwise null. */
export function guessLang(code: string): string | null {
  const first = code.split("\n").find((l) => l.trim() && !l.trim().startsWith("#"));
  if (!first) return null;
  const words = first.trim().replace(/^\$\s+/, "").split(/\s+/);
  const word = words[0] === "sudo" ? (words[1] ?? "") : (words[0] ?? "");
  return COMMANDS.has(word) || /^\.{1,2}\//.test(word) ? "bash" : null;
}

/** The block as coloured HTML, or null to leave it to the plain renderer. Never throws: a page always builds. */
export function highlight(code: string, lang: string | undefined): string | null {
  const asked = (lang ?? "").trim().split(/\s+/)[0]?.toLowerCase() ?? "";
  const name = asked ? (ALIASES[asked] ?? asked) : guessLang(code);
  if (!name) return null;
  const h = highlighter();
  if (!h.getLoadedLanguages().includes(name)) return null;
  try {
    return h
      .codeToHtml(code, { lang: name, themes: THEMES, defaultColor: false })
      .replace(/^<pre class="shiki[^"]*"[^>]*>/, `<pre class="shiki" data-lang="${name}" tabindex="0">`)
      .replace(/--shiki-light:(#[0-9a-fA-F]{6})/g, (all, hex: string) => `--shiki-light:${LIGHT_FIXES[hex.toLowerCase()] ?? hex}`)
      .replace("<code>", `<code class="language-${name}">`);
  } catch {
    return null;
  }
}
