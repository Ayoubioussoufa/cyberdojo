/**
 * The Workshop labs: structure, links, French parity, and the safety invariant
 * that every lab attacks only the learner's own localhost server. Runs in
 * `pnpm test`, without a browser.
 */
import { lessons, modules } from "../src/lib/content";
import { WORKSHOP, workshopLabs, type Step } from "../src/data/workshop";

let bad = 0;
const fail = (msg: string) => {
  bad++;
  console.error(`✗ ${msg}`);
};

const pages = new Set([...lessons("en").map((d) => `/courses/${d.meta.slug}/`), ...modules("en").map((d) => `/modules/${d.meta.slug}/`)]);
const ids = new Set<string>();
const stepText = (s: Step[]) => s.map((x) => `${x.text}\n${x.code ?? ""}`).join("\n");

/** A URL in a step that points anywhere but the learner's own machine is forbidden. */
const OFF_BOX = /https?:\/\/(?!127\.0\.0\.1|localhost|\[::1\])[a-z0-9.-]+/i;

for (const lab of WORKSHOP) {
  const where = `workshop ${lab.id}`;
  if (ids.has(lab.id)) fail(`${where}: duplicate id`);
  ids.add(lab.id);
  if (!/^[a-z][a-z0-9-]*$/.test(lab.id)) fail(`${where}: id should be kebab-case`);
  if (!lab.title || !lab.tagline || !lab.tag) fail(`${where}: missing title, tagline or tag`);
  if (lab.minutes < 5 || lab.minutes > 180) fail(`${where}: minutes out of range`);
  if (!lab.needs.length) fail(`${where}: no "needs"`);
  if (lab.intro.length < 1) fail(`${where}: no intro`);
  if (!lab.isolate.trim()) fail(`${where}: no isolation note`);
  if (!lab.observe.trim() || !lab.detect.trim()) fail(`${where}: missing observe or detect`);
  for (const phase of ["build", "attack", "defend"] as const) {
    const steps = lab[phase];
    if (!steps.length) fail(`${where}: no ${phase} steps`);
    if (steps.some((s) => !s.text.trim())) fail(`${where}: an empty ${phase} step`);
  }

  // Safety: the attack targets the learner's own machine, and nothing in the lab aims off-box.
  if (!/127\.0\.0\.1|localhost/.test(stepText(lab.attack))) fail(`${where}: the attack must name 127.0.0.1 / localhost`);
  for (const phase of ["build", "attack", "defend"] as const) {
    const off = OFF_BOX.exec(stepText(lab[phase]));
    if (off) fail(`${where}: ${phase} points off the learner's machine: ${off[0]}`);
  }
  if (!/127\.0\.0\.1/.test(lab.isolate) && !/127\.0\.0\.1/.test(stepText(lab.build))) fail(`${where}: nothing binds to 127.0.0.1`);

  if (!lab.learn.length) fail(`${where}: no "learn more" links`);
  for (const l of lab.learn) if (!pages.has(l.href)) fail(`${where}: dead link ${l.href}`);
}

// French parity: the text around the steps is translated and in step with English.
const fr = workshopLabs("fr");
WORKSHOP.forEach((en, i) => {
  const c = fr[i];
  const where = `workshop ${en.id} (fr)`;
  if (!c || c.id !== en.id) return fail(`${where}: French lab out of step`);
  if (c.title === en.title) fail(`${where}: title not translated`);
  if (c.tagline === en.tagline) fail(`${where}: tagline not translated`);
  if (c.intro.length !== en.intro.length) fail(`${where}: intro has ${c.intro.length} paragraphs, English has ${en.intro.length}`);
  if (c.intro.some((p, j) => p === en.intro[j])) fail(`${where}: an intro paragraph is not translated`);
  if (c.observe === en.observe) fail(`${where}: observe not translated`);
  if (c.detect === en.detect) fail(`${where}: detect not translated`);
  if (c.learn.length !== en.learn.length) fail(`${where}: learn links differ`);
  // The steps are deliberately the same in both languages (commands and code).
  if (c.build.map((s) => s.text).join() !== en.build.map((s) => s.text).join()) fail(`${where}: build steps should match English`);
});

console.log(bad ? `\n${bad} problem${bad === 1 ? "" : "s"}` : `✓ workshop: ${WORKSHOP.length} labs, every attack on localhost, links resolve, French in step`);
process.exit(bad ? 1 : 0);
