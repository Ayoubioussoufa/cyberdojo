/**
 * The messages behind every "Copy for my AI tutor" button. Each one stands on
 * its own: paste it into any AI assistant and it has everything it needs. The
 * French site writes them in French, so the tutor answers in French.
 */
import type { Store } from "./progress";
import type { DocBrief, Question } from "./types";
import type { Lang } from "@/i18n/lang";

const SAY = {
  en: {
    role: "You are my cybersecurity tutor. I am a Master's student starting from zero, so assume nothing: define every term, use a simple everyday analogy first, then the precise technical explanation. Be honest when I'm wrong. Verify anything version-specific against the primary source, and name that source.",
    notAnswered: "   My answer: (not answered yet)",
    myAnswer: "   My answer: ",
    key: "   Answer key: ",
    why: "   Course explanation: ",
    labels: { lesson: "Lesson", machine: "Machine", project: "Project", module: "Module", tool: "Tool guide", other: "Handbook page" },
    worked: (label: string, title: string, summary: string) => `I just worked through "${label}: ${title}" (${summary})`,
    plan: "Please do this:\n1. Go through each question below. Where I was wrong or didn't answer, explain the misconception and teach the idea from scratch. Where I was right, add one thing I probably don't know yet.\n2. Grade my written answers and definitions: what's right, what's missing, what's wrong, then give a model answer.\n3. Finish with the 3 ideas I should review, and 3 new questions to test me, without giving the answers until I reply.",
    questions: "=== QUESTIONS ===",
    written: "=== MY WRITTEN ANSWERS ===",
    blankWritten: "(left blank: please teach me this one)",
    definitions: "=== MY DEFINITIONS ===",
    blankWord: "(blank: please define it for me)",
    oneFrom: (title: string) => `From "${title}", I want to really understand this question:`,
    oneAsk: "Explain why the right answer is right and why each other option is wrong. Then give me a similar question to try, without the answer.",
    stuck: (title: string) => `I'm stuck on a Linux terminal exercise called "${title}". Don't give me the final command. Guide me with one question or one hint at a time.`,
    task: "The task:",
    typed: "What I typed so far:",
    nothing: "(nothing yet)",
    last: "Last output:",
    none: "(none)",
    drill: (prompt: string, given: string, answer: string, why: string) => `I got this practice exercise wrong.\nExercise: ${prompt}\nMy answer: ${given}\nRight answer: ${answer}\nExplanation given: ${why}`,
    drillAsk: "Teach me the method step by step, then give me one similar exercise to try.",
    gate: (month: number, title: string) => `I want to test myself on Month ${month} of my roadmap: ${title}. These are the exit-gate milestones:`,
    gateAsk: "Quiz me one milestone at a time. Ask me to explain or do each one, then tell me honestly whether I've passed. Don't move on until I've tried.",
  },
  fr: {
    role: "Tu es mon tuteur en cybersécurité. Je suis étudiant en master et je pars de zéro : ne suppose rien, définis chaque terme, commence par une analogie simple de la vie courante, puis donne l'explication technique précise. Dis-moi franchement quand je me trompe. Vérifie tout ce qui dépend d'une version auprès de la source primaire, et cite cette source. Réponds en français.",
    notAnswered: "   Ma réponse : (pas encore répondu)",
    myAnswer: "   Ma réponse : ",
    key: "   Corrigé : ",
    why: "   Explication du cours : ",
    labels: { lesson: "Leçon", machine: "Machine", project: "Projet", module: "Module", tool: "Guide d'outil", other: "Page du manuel" },
    worked: (label: string, title: string, summary: string) => `Je viens de travailler « ${label} : ${title} » (${summary})`,
    plan: "Fais ceci, s'il te plaît :\n1. Reprends chaque question ci-dessous. Là où je me suis trompé ou n'ai pas répondu, explique l'idée fausse et enseigne la notion depuis le début. Là où j'ai juste, ajoute une chose que je ne sais probablement pas encore.\n2. Note mes réponses rédigées et mes définitions : ce qui est juste, ce qui manque, ce qui est faux, puis donne une réponse modèle.\n3. Termine par les 3 idées que je dois réviser, et 3 nouvelles questions pour me tester, sans donner les réponses avant que je réponde.",
    questions: "=== QUESTIONS ===",
    written: "=== MES RÉPONSES RÉDIGÉES ===",
    blankWritten: "(laissé vide : enseigne-moi celle-ci, s'il te plaît)",
    definitions: "=== MES DÉFINITIONS ===",
    blankWord: "(vide : définis-le pour moi, s'il te plaît)",
    oneFrom: (title: string) => `Dans « ${title} », je veux vraiment comprendre cette question :`,
    oneAsk: "Explique pourquoi la bonne réponse est juste et pourquoi chacune des autres est fausse. Puis donne-moi une question semblable à essayer, sans la réponse.",
    stuck: (title: string) => `Je bloque sur un exercice de terminal Linux appelé « ${title} ». Ne me donne pas la commande finale. Guide-moi avec une question ou un indice à la fois.`,
    task: "La consigne :",
    typed: "Ce que j'ai tapé jusqu'ici :",
    nothing: "(rien pour l'instant)",
    last: "Dernière sortie :",
    none: "(aucune)",
    drill: (prompt: string, given: string, answer: string, why: string) => `J'ai raté cet exercice d'entraînement.\nExercice : ${prompt}\nMa réponse : ${given}\nBonne réponse : ${answer}\nExplication donnée : ${why}`,
    drillAsk: "Enseigne-moi la méthode étape par étape, puis donne-moi un exercice semblable à essayer.",
    gate: (month: number, title: string) => `Je veux me tester sur le mois ${month} de mon parcours : ${title}. Voici les objectifs de validation :`,
    gateAsk: "Interroge-moi sur un objectif à la fois. Demande-moi d'expliquer ou de faire chacun, puis dis-moi franchement si je l'ai validé. Ne passe pas au suivant avant que j'aie essayé.",
  },
} satisfies Record<Lang, unknown>;

const letter = (i: number) => String.fromCharCode(65 + i);

function questionBlock(q: Question, n: number, store: Store, lang: Lang): string {
  const say = SAY[lang];
  const pick = store.picks[q.id];
  const lines = [`Q${n}. ${q.prompt}`, ...q.options.map((o, i) => `   ${letter(i)}) ${o}`)];
  lines.push(pick === undefined ? say.notAnswered : `${say.myAnswer}${letter(pick)}) ${q.options[pick]}`);
  lines.push(`${say.key}${letter(q.correct)}) ${q.options[q.correct]}`);
  lines.push(`${say.why}${q.why}`);
  return lines.join("\n");
}

/** One button: every question, my picks, my written answers and my definitions. */
export function fullMessage(doc: DocBrief, store: Store, lang: Lang = "en"): string {
  const say = SAY[lang];
  const l = say.labels;
  const label = doc.kind === "lesson" ? `${l.lesson} ${doc.number}` : doc.kind === "machine" ? l.machine : doc.kind === "project" ? l.project : doc.kind === "module" ? l.module : doc.kind === "tool" ? l.tool : l.other;
  const parts = [say.role, say.worked(label, doc.title, doc.summary), say.plan];
  if (doc.questions.length) {
    parts.push(`${say.questions}\n${doc.questions.map((q, i) => questionBlock(q, i + 1, store, lang)).join("\n\n")}`);
  }
  if (doc.written.length) {
    parts.push(`${say.written}\n${doc.written.map((w, i) => `W${i + 1}. ${w.prompt}\n${say.myAnswer}${store.written[w.id]?.trim() || say.blankWritten}`).join("\n\n")}`);
  }
  if (doc.words.length) {
    parts.push(`${say.definitions}\n${doc.words.map((w) => `${w}: ${store.words[`${doc.slug}:${w}`]?.trim() || say.blankWord}`).join("\n")}`);
  }
  return parts.join("\n\n");
}

/** Just one question, for "I don't get this one". */
export function questionMessage(doc: DocBrief, q: Question, store: Store, lang: Lang = "en"): string {
  const say = SAY[lang];
  return [say.role, say.oneFrom(doc.title), questionBlock(q, 1, store, lang), say.oneAsk].join("\n\n");
}

export function missionMessage(title: string, brief: string, history: string[], lastOutput: string, lang: Lang = "en"): string {
  const say = SAY[lang];
  return [
    say.role,
    say.stuck(title),
    `${say.task}\n${brief}`,
    `${say.typed}\n${history.length ? history.map((h) => `$ ${h}`).join("\n") : say.nothing}`,
    `${say.last}\n${lastOutput || say.none}`,
  ].join("\n\n");
}

export function drillMessage(prompt: string, answer: string, given: string, why: string, lang: Lang = "en"): string {
  const say = SAY[lang];
  return [say.role, say.drill(prompt, given, answer, why), say.drillAsk].join("\n\n");
}

export function gateMessage(month: number, title: string, gates: string[], lang: Lang = "en"): string {
  const say = SAY[lang];
  return [say.role, `${say.gate(month, title)}\n${gates.map((g) => `- ${g}`).join("\n")}`, say.gateAsk].join("\n\n");
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
