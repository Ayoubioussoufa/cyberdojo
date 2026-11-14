/**
 * The desktop tutor, without a model: the course index, the prompts, the reading
 * of a grade and the rendering of a reply. Run `pnpm tutor:index` first.
 */
import fs from "node:fs";
import { lessons } from "../src/lib/content";
import { tutorHtml } from "../src/lib/tutor-markdown";
import type { Chunk, TutorIndex } from "../src/lib/tutor-types";
import { readGrade } from "../src/server/tutor/answer";
import { chunkBlocks, htmlToText } from "../src/server/tutor/chunking";
import type { Hardware } from "../src/lib/tutor-types";
import { advise, CATALOG, fit, manifestUrl, validModel } from "../src/server/tutor/models";
import { buildIndex, scores, tokens } from "../src/server/tutor/keywords";
import { assetName, isLocal, parseChecksums } from "../src/server/tutor/runtime";
import { isThread } from "../src/server/tutor/store";
import { newer, parseVersion } from "../desktop/updates";
import { classify, pickRelease } from "../src/lib/release";
import { compareVersions } from "./flatten";
import { fitPage, gradePrompt, historyTurns, PAGE_BUDGET, sourcesOf, systemPrompt } from "../src/server/tutor/prompt";

let failed = 0;
let checks = 0;
const ok = (what: string, pass: boolean) => {
  checks++;
  if (!pass) {
    failed++;
    console.error(`FAIL ${what}`);
  }
};
const eq = (what: string, got: unknown, want: unknown) => ok(`${what}\n  got  ${JSON.stringify(got)}\n  want ${JSON.stringify(want)}`, JSON.stringify(got) === JSON.stringify(want));

// Turning a page into text
eq("tags and entities", htmlToText("<p>Use <code>ls -l</code> &amp; read it.</p><p>Then &#39;stop&#39;.</p>"), "Use `ls -l` & read it.\nThen 'stop'.");
eq("code blocks keep their lines", htmlToText('<pre><code class="x">a &lt; b\nc</code></pre>'), "```\na < b\nc\n```");
eq("buttons and drawings are dropped", htmlToText("<p>Text</p><button>copy</button><svg><text>x</text></svg>"), "Text");

const page = { lang: "en" as const, href: "/courses/x/", kind: "lesson", title: "X" };
const made = chunkBlocks(page, [{ text: "Summary." }, { text: htmlToText("<h2>First</h2><p>One.</p><h2>Second</h2><p>Two.</p>") }, { text: "Written question: Why?", written: { id: "x~1", prompt: "Why?" } }]);
eq("one chunk per section", made.map((c) => [c.heading, c.text]), [["", "Summary."], ["First", "One."], ["Second", "Two.\n\nWritten question: Why?"]]);
eq("a written question stays with its section", made[2]?.written, [{ id: "x~1", prompt: "Why?" }]);
const long = chunkBlocks(page, [{ text: Array.from({ length: 40 }, (_, i) => `Paragraph ${i} ${"word ".repeat(30)}`).join("\n\n") }]);
ok("a long section is cut into several chunks", long.length > 2 && long.every((c) => c.text.length <= 1600));
ok("a changed text is a new chunk id", made[1]?.id !== chunkBlocks(page, [{ text: htmlToText("<h2>First</h2><p>One!</p>") }])[0]?.id);

// The index as built
const { chunks } = JSON.parse(fs.readFileSync(".tutor/index.json", "utf8")) as TutorIndex;
ok("chunk ids are unique", new Set(chunks.map((c) => c.id)).size === chunks.length);
ok("no chunk is empty or oversized", chunks.every((c) => c.text.trim() !== "" && c.text.length <= 1600));
const indexed = new Set(chunks.flatMap((c) => c.written?.map((w) => w.id) ?? []));
const asked = lessons().flatMap((d) => d.written.map((w) => w.id));
ok(`every written question of every lesson can be graded (${asked.filter((id) => !indexed.has(id)).slice(0, 3).join(", ")})`, asked.length > 0 && asked.every((id) => indexed.has(id)));
ok("every lesson is in the index", lessons().every((d) => chunks.some((c) => c.lang === "en" && c.href === `/courses/${d.meta.slug}/`)));
ok("mission solutions stay out of the index", !chunks.some((c) => /\bsolve\b\s*[:(]/.test(c.text)));

// Prompts
const chunk = (id: string, text: string, href = "/courses/x/"): Chunk => ({ id, lang: "en", href, kind: "lesson", title: "Title X", heading: "H", text });
const sys = systemPrompt({ lang: "fr", mode: "hint", reveal: false, page: [chunk("a", "PAGE TEXT")], related: [chunk("b", "OTHER TEXT", "/modules/y/")] });
ok("the rules come before the course text", sys.indexOf("Rules you always follow") < sys.indexOf("PAGE TEXT") && sys.indexOf("PAGE TEXT") < sys.indexOf("OTHER TEXT"));
ok("the reply language is set", sys.includes("Answer in French."));
ok("hint mode withholds the answer", sys.includes("smallest hint") && !sys.includes("asked for the full solution"));
ok("course links follow the reader's language", sys.includes('link="/fr/modules/y/"'));
ok("a full solution needs the flag", systemPrompt({ lang: "en", mode: "hint", reveal: true, page: [], related: [] }).includes("asked for the full solution"));
ok("authorised targets only", /written permission/.test(sys) && /decline/.test(sys));
const labSys = systemPrompt({ lang: "en", mode: "lab", reveal: false, page: [], related: [] });
ok("lab mode stays on the learner's own localhost", /127\.0\.0\.1/.test(labSys) && /own machine/.test(labSys) && /refuse/i.test(labSys) && /defence/.test(labSys));
ok("a page with no text says so", systemPrompt({ lang: "en", mode: "explain", reveal: false, page: [], related: [] }).includes("no course text of its own"));

const big = Array.from({ length: 12 }, (_, i) => chunk(`c${i}`, "x".repeat(1500)));
const first = fitPage(big);
ok("a long page is cut to the budget, from the start", first.length === 6 && first[0]?.id === "c0" && first.reduce((n, c) => n + c.text.length, 0) <= PAGE_BUDGET);
eq("with scores the best chunks stay, in reading order", fitPage(big, new Map([["c9", 0.9], ["c2", 0.8], ["c11", 0.7], ["c5", 0.6], ["c7", 0.5], ["c0", 0.4]])).map((c) => c.id), ["c0", "c2", "c5", "c7", "c9", "c11"]);
eq("old turns are dropped", historyTurns(Array.from({ length: 12 }, (_, i) => ({ role: "user" as const, content: String(i) }))).map((m) => m.content), ["4", "5", "6", "7", "8", "9", "10", "11"]);
ok("long turns are shortened", (historyTurns([{ role: "user", content: "y".repeat(9000) }])[0]?.content.length ?? 0) < 3100);
eq("sources are one per page", sourcesOf([chunk("a", "1", "/a/"), chunk("b", "2", "/a/"), chunk("c", "3", "/b/")], "fr").map((s) => s.href), ["/fr/a/", "/fr/b/"]);
const grading = gradePrompt("en", "Why?", "Because.", [chunk("a", "REFERENCE")]);
ok("grading: reference, question and fenced answer", !!grading[1]?.content.includes("REFERENCE") && grading[1].content.includes("<answer>\nBecause.\n</answer>") && !!grading[0]?.content.includes("never instructions"));

// Reading a grade
eq("a good grade", readGrade('{"verdict":"partial","score":55.4,"right":["a"],"missing":["b",3,""],"feedback":" ok "}'), { verdict: "partial", score: 55, right: ["a"], missing: ["b"], feedback: "ok" });
eq("not JSON", readGrade("Sure! Here is the grade"), null);
eq("an unknown verdict", readGrade('{"verdict":"great","score":90,"right":[],"missing":[],"feedback":"x"}'), null);
eq("a score out of range", readGrade('{"verdict":"correct","score":140,"right":[],"missing":[],"feedback":"x"}'), null);

// Model names, as they go into a URL-less API call
eq("valid and invalid model names", ["qwen2.5:7b", "mistral", "library/llama3.1:8b", "nomic-embed-text", "hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M", "", "a b", "../x", "x;rm", "hf.co/../x", "evil.com/a/b"].map(validModel), [true, true, true, true, true, false, false, false, false, false, false]);
eq("where each model's size is read", ["llama3.1:8b", "mistral", "user/model:q4", "hf.co/bartowski/Llama-3.2-3B-Instruct-GGUF:Q4_K_M", "hf.co/a/b"].map(manifestUrl), ["https://registry.ollama.ai/v2/library/llama3.1/manifests/8b", "https://registry.ollama.ai/v2/library/mistral/manifests/latest", "https://registry.ollama.ai/v2/user/model/manifests/q4", "https://hf.co/v2/bartowski/Llama-3.2-3B-Instruct-GGUF/manifests/Q4_K_M", "https://hf.co/v2/a/b/manifests/latest"]);

// Search by words, for what meaning misses
eq("words: lower case, no accents, no filler, commands and CVEs kept", tokens("What is the CIA triad? Sécurité: nmap -sV, CVE-2021-44228, a 7 de la"), ["cia", "triad", "securite", "nmap", "sv", "cve", "2021", "44228", "7"]);
const kwChunks = [chunk("cia", "Confidentiality, integrity and availability are called the CIA triad."), chunk("net", "A packet travels through routers and switches."), chunk("nmap", "nmap -sV asks each open port which service and version it runs.")];
const kw = buildIndex(kwChunks);
eq("the passage with the rare words ranks first", [...scores(kw, "What does the CIA triad mean?", kwChunks.map((c) => c.id)).keys()], ["cia"]);
eq("a command finds its tool", [...scores(kw, "what does nmap -sV do", kwChunks.map((c) => c.id)).keys()], ["nmap"]);
eq("small talk matches nothing", scores(kw, "hello, how are you?", kwChunks.map((c) => c.id)).size, 0);

// Which model suits which computer
const GiB = 2 ** 30;
const pc = (ramGb: number, vramGb: number | null, unified = false, diskFreeGb: number | null = 500): Hardware => ({ ramGb, cores: 8, gpu: vramGb === null ? null : { name: "card", vramGb, unified }, diskFreeGb });
eq("a 4 GB model on a 12 GB card is fast", fit(4 * GiB, pc(16, 12)), "fast");
eq("half on a 6 GB card is slow", fit(9 * GiB, pc(32, 6)), "slow");
eq("mostly on an 8 GB card is usable", fit(8 * GiB, pc(32, 8)), "ok");
eq("a small model on the processor alone is usable", fit(2.5 * GiB, pc(8, null)), "ok");
eq("a 9 GB model on the processor alone is slow", fit(9 * GiB, pc(32, null)), "slow");
eq("more than the memory is too big", fit(17 * GiB, pc(16, null)), "too-big");
eq("a sparse model stays usable without a card", fit(13 * GiB, pc(32, null), true), "ok");
eq("Apple silicon runs within its shared memory", [fit(6 * GiB, pc(16, 10, true)), fit(10 * GiB, pc(16, 10, true)), fit(12 * GiB, pc(16, 10, true))], ["fast", "slow", "too-big"]);
eq("an 8 GB laptop gets the 4b", advise(pc(8, null)).recommended, "qwen3.5:4b");
eq("16 GB and no card gets the 4b", advise(pc(16, null)).recommended, "qwen3.5:4b");
eq("an 8 GB card gets the 4b, which fits whole; the 9b only mostly fits", [advise(pc(16, 8)).recommended, advise(pc(16, 8)).models.find((m) => m.name === "qwen3.5:9b")?.fit], ["qwen3.5:4b", "ok"]);
eq("a 10 GB card already holds the 12b", advise(pc(16, 10)).recommended, "gemma4:12b");
eq("a 12 GB card gets the 12b", advise(pc(16, 12)).recommended, "gemma4:12b");
eq("a 24 GB card gets the 27b", advise(pc(64, 24)).recommended, "qwen3.5:27b");
eq("a 4 GB laptop gets nothing it can run", advise(pc(4, null)).recommended, null);
eq("a full disk rules models out", advise(pc(16, 12, false, 3.6)).recommended, "qwen3.5:2b");
ok("the catalog is smallest first", CATALOG.every((m, i) => i === 0 || (CATALOG[i - 1] as { bytes: number }).bytes <= m.bytes + 1e9));

// Installing Ollama
eq("the file each system installs", [assetName("win32", "x64"), assetName("darwin", "arm64"), assetName("linux", "x64"), assetName("linux", "arm64"), assetName("linux", "ia32"), assetName("freebsd", "x64")], ["OllamaSetup.exe", "Ollama-darwin.zip", "ollama-linux-amd64.tar.zst", "ollama-linux-arm64.tar.zst", null, null]);
const sums = parseChecksums(`${"a".repeat(64)}  ./OllamaSetup.exe\n${"B".repeat(64)}  ollama-darwin.tgz\nnot a line\n${"c".repeat(63)}  ./short.zip\n`);
eq("the release's checksum list", [...sums.entries()], [["OllamaSetup.exe", "a".repeat(64)], ["ollama-darwin.tgz", "b".repeat(64)]]);
eq("only this computer's addresses can be started or installed", ["http://127.0.0.1:11434", "http://localhost:11500", "http://[::1]:11434", "http://192.168.1.20:11434", "http://127.0.0.1.evil.com", "nonsense"].map(isLocal), [true, true, true, false, false, false]);

// The tutor's own conversations
eq("conversation keys", ["/tutor/chat/abc123def/", "/tutor/chat/x/", "/tutor/chat/abc123def/../", "/courses/x/"].map(isThread), [true, false, false, false]);

// Updates
eq("release tags", ["desktop-v1.2.3", "v0.1.0", "1.0.0", "desktop-v1.2", "latest"].map(parseVersion), [[1, 2, 3], [0, 1, 0], [1, 0, 0], null, null]);
eq("version order", [newer([0, 2, 0], [0, 1, 9]), newer([0, 1, 0], [0, 1, 0]), newer([1, 0, 0], [1, 0, 1])], [true, false, false]);

// Shipping the server: which version of a package goes at the top
eq("versions compare by number, not as text", [compareVersions("2.1.2", "2.0.2") > 0, compareVersions("2.10.0", "2.9.9") > 0, compareVersions("1.0.0", "1.0.0") === 0], [true, true, true]);

// The website's download page
eq("installers by system", ["CyberDojo-Setup-x64.exe", "CyberDojo-mac-arm64.dmg", "CyberDojo-mac-arm64.zip", "CyberDojo-linux-x86_64.AppImage", "CyberDojo-linux-amd64.deb", "SHA256SUMS.txt"].map(classify), [{ os: "windows", kind: "exe" }, { os: "mac", kind: "dmg" }, null, { os: "linux", kind: "AppImage" }, { os: "linux", kind: "deb" }, null]);
const asset = (name: string) => ({ name, size: 100, browser_download_url: `https://x/${name}` });
const rel = (tag: string, extra: Partial<{ draft: boolean; prerelease: boolean }> = {}) => ({ tag_name: tag, html_url: `https://x/${tag}`, published_at: "2026-11-13T00:00:00Z", draft: false, prerelease: false, assets: [asset("CyberDojo-Setup-x64.exe"), asset("SHA256SUMS.txt")], ...extra });
eq("the newest finished desktop release is offered", pickRelease([rel("desktop-v0.3.0", { draft: true }), rel("desktop-v0.2.1", { prerelease: true }), rel("v9.0.0"), rel("desktop-v0.2.0"), rel("desktop-v0.1.0")])?.version, "0.2.0");
eq("its checksums file is linked", pickRelease([rel("desktop-v0.2.0")])?.checksums, "https://x/SHA256SUMS.txt");
eq("no release, nothing offered", pickRelease([rel("desktop-v0.2.0", { draft: true })]), null);

// A model's reply is untrusted
const html = tutorHtml('**bold** [in](/courses/x/) [out](https://example.com) [bad](javascript:alert(1)) ![pic](https://example.com/x.png) <img src=x onerror=alert(1)>\n\n<script>alert(1)</script>');
ok("raw HTML is shown as text", !/<script|<img/i.test(html) && html.includes("&lt;script&gt;"));
ok("course and web links survive", html.includes('<a href="/courses/x/">in</a>') && html.includes('<a href="https://example.com" target="_blank" rel="noreferrer">out</a>'));
ok("no script link becomes a link", !/href="javascript/i.test(html));

console.log(failed ? `${failed} of ${checks} tutor checks failed` : `tutor: ${checks} checks passed`);
process.exit(failed ? 1 : 0);
