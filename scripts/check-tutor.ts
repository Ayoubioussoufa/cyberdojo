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
import { validModel } from "../src/server/tutor/models";
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
eq("valid and invalid model names", ["qwen2.5:7b", "mistral", "library/llama3.1:8b", "nomic-embed-text", "", "a b", "../x", "x;rm"].map(validModel), [true, true, true, true, false, false, false, false]);

// A model's reply is untrusted
const html = tutorHtml('**bold** [in](/courses/x/) [out](https://example.com) [bad](javascript:alert(1)) ![pic](https://example.com/x.png) <img src=x onerror=alert(1)>\n\n<script>alert(1)</script>');
ok("raw HTML is shown as text", !/<script|<img/i.test(html) && html.includes("&lt;script&gt;"));
ok("course and web links survive", html.includes('<a href="/courses/x/">in</a>') && html.includes('<a href="https://example.com" target="_blank" rel="noreferrer">out</a>'));
ok("no script link becomes a link", !/href="javascript/i.test(html));

console.log(failed ? `${failed} of ${checks} tutor checks failed` : `tutor: ${checks} checks passed`);
process.exit(failed ? 1 : 0);
