/**
 * The messages behind every "Copy for my AI tutor" button. Each one stands on
 * its own: paste it into any AI assistant and it has everything it needs.
 */
import type { Store } from "./progress";
import type { DocBrief, Question } from "./types";

const ROLE =
  "You are my cybersecurity tutor. I am a Master's student starting from zero, so assume nothing: define every term, use a simple everyday analogy first, then the precise technical explanation. Be honest when I'm wrong. Verify anything version-specific against the primary source, and name that source.";

const letter = (i: number) => String.fromCharCode(65 + i);

function questionBlock(q: Question, n: number, store: Store): string {
  const pick = store.picks[q.id];
  const lines = [`Q${n}. ${q.prompt}`, ...q.options.map((o, i) => `   ${letter(i)}) ${o}`)];
  lines.push(pick === undefined ? "   My answer: (not answered yet)" : `   My answer: ${letter(pick)}) ${q.options[pick]}`);
  lines.push(`   Answer key: ${letter(q.correct)}) ${q.options[q.correct]}`);
  lines.push(`   Course explanation: ${q.why}`);
  return lines.join("\n");
}

/** One button: every question, my picks, my written answers and my definitions. */
export function fullMessage(doc: DocBrief, store: Store): string {
  const label = doc.kind === "lesson" ? `Lesson ${doc.number}` : doc.kind === "machine" ? "Machine" : doc.kind === "project" ? "Project" : doc.kind === "module" ? "Module" : doc.kind === "tool" ? "Tool guide" : "Handbook page";
  const parts = [
    ROLE,
    `I just worked through "${label}: ${doc.title}" (${doc.summary})`,
    "Please do this:\n1. Go through each question below. Where I was wrong or didn't answer, explain the misconception and teach the idea from scratch. Where I was right, add one thing I probably don't know yet.\n2. Grade my written answers and definitions: what's right, what's missing, what's wrong, then give a model answer.\n3. Finish with the 3 ideas I should review, and 3 new questions to test me, without giving the answers until I reply.",
  ];
  if (doc.questions.length) {
    parts.push(`=== QUESTIONS ===\n${doc.questions.map((q, i) => questionBlock(q, i + 1, store)).join("\n\n")}`);
  }
  if (doc.written.length) {
    parts.push(
      `=== MY WRITTEN ANSWERS ===\n${doc.written
        .map((w, i) => `W${i + 1}. ${w.prompt}\n   My answer: ${store.written[w.id]?.trim() || "(left blank: please teach me this one)"}`)
        .join("\n\n")}`,
    );
  }
  if (doc.words.length) {
    parts.push(
      `=== MY DEFINITIONS ===\n${doc.words
        .map((w) => `${w}: ${store.words[`${doc.slug}:${w}`]?.trim() || "(blank: please define it for me)"}`)
        .join("\n")}`,
    );
  }
  return parts.join("\n\n");
}

/** Just one question, for "I don't get this one". */
export function questionMessage(doc: DocBrief, q: Question, store: Store): string {
  return [
    ROLE,
    `From "${doc.title}", I want to really understand this question:`,
    questionBlock(q, 1, store),
    "Explain why the right answer is right and why each other option is wrong. Then give me a similar question to try, without the answer.",
  ].join("\n\n");
}

export function missionMessage(title: string, brief: string, history: string[], lastOutput: string): string {
  return [
    ROLE,
    `I'm stuck on a Linux terminal exercise called "${title}". Don't give me the final command. Guide me with one question or one hint at a time.`,
    `The task:\n${brief}`,
    `What I typed so far:\n${history.length ? history.map((h) => `$ ${h}`).join("\n") : "(nothing yet)"}`,
    `Last output:\n${lastOutput || "(none)"}`,
  ].join("\n\n");
}

export function drillMessage(prompt: string, answer: string, given: string, why: string): string {
  return [ROLE, `I got this practice exercise wrong.\nExercise: ${prompt}\nMy answer: ${given}\nRight answer: ${answer}\nExplanation given: ${why}`, "Teach me the method step by step, then give me one similar exercise to try."].join("\n\n");
}

export function gateMessage(month: number, title: string, gates: string[]): string {
  return [
    ROLE,
    `I want to test myself on Month ${month} of my roadmap: ${title}. These are the exit-gate milestones:\n${gates.map((g) => `- ${g}`).join("\n")}`,
    "Quiz me one milestone at a time. Ask me to explain or do each one, then tell me honestly whether I've passed. Don't move on until I've tried.",
  ].join("\n\n");
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok;
  }
}
