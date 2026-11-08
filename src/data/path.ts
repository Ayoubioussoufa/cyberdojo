/**
 * Where everything that isn't a lesson sits on the 24-month path. Lessons fall
 * into place by their month. The handbook, machines and project parts are
 * placed here, each with the reason it comes at that moment.
 */
export interface Placed {
  /** guide:slug, machine:slug or project:P01:1 (the project's part). */
  ref: string;
  why: string;
}

export const PLACEMENT: Record<number, { before?: Placed[]; after?: Placed[] }> = {
  0: {
    before: [
      { ref: "guide:a1-the-whole-plan", why: "See the whole journey once, so that every later step makes sense." },
      { ref: "guide:a2-how-to-use-this-plan", why: "Learn how a month runs, and what an exit gate is." },
    ],
    after: [
      { ref: "guide:j1-the-learning-system", why: "Set up your notes now, before you've anything to lose." },
      { ref: "guide:s1-how-memory-works", why: "Learn how memory works before you start filling it: it changes how you study every lesson." },
      { ref: "guide:i1-weekly-schedules", why: "Put real hours in your calendar before Month 1 begins." },
      { ref: "guide:d3-using-ai-well", why: "Learn the rules for your AI tutor before you start leaning on it." },
    ],
  },
  1: {
    before: [{ ref: "guide:e1-platforms", why: "Meet the outside training sites that each month points you to." }],
    after: [
      { ref: "guide:f1-project-standards", why: "Read this once before your first project: it says what \"finished\" means." },
      { ref: "guide:n1-templates", why: "Copy the note templates that you'll fill in from now on." },
      { ref: "guide:s2-memorising-what-must-be-instant", why: "Ports and commands are piling up, so start flashcards for the facts that must be instant." },
      { ref: "project:P01:1", why: "You've built a lab and learned Linux, so use them for something real." },
    ],
  },
  2: {
    before: [
      { ref: "guide:s3-studying-hands-on", why: "Labs get longer from here, so learn how to get stuck well and keep a lab notebook." },
      { ref: "guide:h3-write-ups-and-reports", why: "Your first written case is coming, so learn what makes one good." },
    ],
    after: [{ ref: "project:P02:1", why: "You can read packets now. Solve your first real case." }],
  },
  3: {
    after: [
      { ref: "project:P01:2", why: "With firewalls and hardening learned, finish your lab and measure it." },
      { ref: "project:P02:2", why: "Two more cases turn one exercise into a portfolio piece." },
      { ref: "machine:lantern", why: "Everything you've learned so far, joined up on one machine." },
    ],
  },
  4: {
    before: [{ ref: "guide:s4-staying-in-it", why: "The first excitement fades around now. Set up the habits that carry you through two years." }],
    after: [{ ref: "project:P03:1", why: "You can code now, so build tools that you'll keep using." }],
  },
  5: {
    after: [
      { ref: "project:P03:2", why: "Add the Windows skills you've just learned to your toolkit." },
      { ref: "project:P04:1", why: "Start the Windows lab that many later projects run on." },
    ],
  },
  6: {
    before: [{ ref: "guide:c1-the-jobs", why: "Halfway through the foundations, see what the jobs really involve." }],
    after: [
      { ref: "project:P05:1", why: "Write a real web app properly before you learn how they fail." },
      { ref: "guide:h1-cv-and-online-presence", why: "You've got real work to show now, so make it findable." },
    ],
  },
  7: { after: [{ ref: "project:P04:2", why: "You understand identity now, so finish your Active Directory lab." }] },
  8: {
    before: [{ ref: "guide:d1-ai-what-changed", why: "See how AI is changing this work, before you specialise." }],
    after: [{ ref: "project:P05:2", why: "Prove you understand web flaws: add them, catch them and fix them." }],
  },
  9: {
    after: [
      { ref: "machine:keystone", why: "Follow one intrusion through real Windows events." },
      { ref: "project:P06:1", why: "Run your own small SOC on the lab that you built." },
      { ref: "guide:h2-networking-and-internships", why: "You can now talk about real work, so start meeting people." },
    ],
  },
  10: { after: [{ ref: "project:P07:1", why: "Run a scoped test of your own lab, and write it up as a professional would." }] },
  11: {
    after: [
      { ref: "machine:harbor", why: "Handle a live incident from start to finish." },
      { ref: "project:P08:1", why: "Turn what you've seen into detections that are tested." },
    ],
  },
  12: {
    after: [
      { ref: "project:P09:1", why: "Show that you can speak the language of the business." },
      { ref: "guide:c2-choosing-your-track", why: "Twelve months in, you've got evidence to choose a direction." },
      { ref: "guide:g1-certifications", why: "Decide which exam, if any, fits the track you're leaning towards." },
      { ref: "guide:k1-staying-current", why: "Set a small habit for keeping up, which lasts beyond this course." },
    ],
  },
  13: { after: [{ ref: "project:P10:1", why: "Build a deliberately flawed cloud environment that you control." }] },
  14: {
    after: [
      { ref: "machine:switchboard", why: "Practise a cloud breach in the browser before doing it in AWS." },
      { ref: "project:P10:2", why: "Detect it, respond, and prove the fix." },
    ],
  },
  15: {
    after: [
      { ref: "project:P11:1", why: "Investigate a compromised machine, and defend your conclusions." },
      { ref: "project:P12:1", why: "Turn public reporting into detections that you can test." },
    ],
  },
  16: { after: [{ ref: "project:P13:1", why: "Analyse real samples, safely, and leave detections behind." }] },
  17: { after: [{ ref: "project:P14:1", why: "Build the pipeline that stops the flaws you've studied." }] },
  18: {
    before: [{ ref: "guide:d2-llm-security-primer", why: "A short map of AI risks, before the month's lessons." }],
    after: [
      { ref: "machine:parrot", why: "Fix a leaking assistant in the browser, and measure the result." },
      { ref: "project:P15:1", why: "Now do it for real, on an assistant that you built." },
    ],
  },
  19: { after: [{ ref: "project:P14:2", why: "Extend your pipeline so that it deploys to a hardened cluster." }] },
  20: { after: [{ ref: "project:P16:1", why: "Build an assistant, and a way of proving what it's worth." }] },
  21: {
    after: [
      { ref: "project:P16:2", why: "Finish your evaluation: it's the part interviewers ask about." },
      { ref: "guide:h4-interviews", why: "Interviews are close, so start rehearsing out loud." },
    ],
  },
  23: { after: [{ ref: "guide:h5-negotiation-and-offers", why: "Offers may come soon, so learn how to answer them." }] },
  24: { after: [{ ref: "guide:l1-after-24-months", why: "Decide what the next 12 months look like." }] },
};

/** Lessons that build each skill area, by lesson number. */
export const SKILL_LESSONS: Record<string, number[]> = {
  "Networking & protocols": [15, 16, 17, 18, 19, 20, 21, 22, 23],
  Linux: [4, 5, 6, 7, 8, 9, 24, 25],
  "Windows & Active Directory": [30, 31, 32, 33, 34, 43, 44, 45],
  "Scripting (Python, Bash, PowerShell)": [24, 26, 27, 28, 29, 34],
  "Web application security": [35, 36, 37, 46, 47, 48, 49, 50],
  "Cryptography (applied)": [38, 39, 40],
  "SOC / SIEM operations": [51, 52, 53, 54],
  "Detection engineering": [52, 53, 58],
  "Incident response & DFIR": [59, 65],
  "Threat intelligence": [53, 66],
  "Malware analysis": [67],
  "Penetration testing": [55, 56, 57],
  "Cloud security": [63, 64],
  "Containers & Kubernetes": [29, 74],
  "AppSec & DevSecOps": [68, 69],
  "GRC & risk": [10, 60, 61, 62],
  "Security architecture": [21, 41, 74],
  "AI / LLM security": [70, 71, 72, 73, 75, 76, 77],
  "Technical writing & reporting": [14, 50, 59],
  "Communication & presenting": [60, 78],
};

/** Dojo belts: each one is earned by finishing everything up to that month. */
export const BELTS = [
  { name: "White belt", month: -1, colour: "#e9e6da", meaning: "You've started." },
  { name: "Yellow belt", month: 0, colour: "#e6c229", meaning: "You understand what security is, and how a computer works." },
  { name: "Orange belt", month: 3, colour: "#e8862e", meaning: "You can run Linux and read a network." },
  { name: "Green belt", month: 6, colour: "#3f9b5c", meaning: "You've got the foundations: code, Windows, web and crypto." },
  { name: "Blue belt", month: 9, colour: "#2f6fb5", meaning: "You can work an alert the way a SOC does." },
  { name: "Purple belt", month: 12, colour: "#7a4fb0", meaning: "You can detect, respond, and talk to the business." },
  { name: "Brown belt", month: 18, colour: "#7a5230", meaning: "You've handled cloud, forensics, malware, AppSec and AI." },
  { name: "Black belt", month: 24, colour: "#1c1e21", meaning: "You're ready for the job." },
];
