/**
 * Where a program's output goes. The exercise ideas follow pwn.college's Linux
 * Luminarium (BSD-2-Clause, see THIRD_PARTY_NOTICES.md); text and code are ours.
 */
import type { Ctx } from "@/lib/shell/commands";
import { flagFrom, submitted, type Mission } from "../kit";
import { ana, challenge, content, noise, say } from "./kit";

export const STREAMS: Mission[] = [
  {
    id: "dojo-stream-1",
    title: "Catch it in a file",
    brief: "`/challenge/run` refuses to print its secret to the screen, in case someone is looking over your shoulder. It only speaks when its output is going somewhere else. Send its output to a file called `out.txt`, read the file, and submit the flag.",
    hints: ["`>` after a command sends its standard output into a file.", "`/challenge/run > out.txt`", "Then `cat out.txt`."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      challenge(shell, "run", (ctx) => (ctx.piped ? say(`${flag}\n`) : say("Not on the screen. Send my output somewhere else.\n")));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/run > out.txt", "cat out.txt", `submit ${w.flag}`],
    debrief: "A program writes to file descriptor 1 and has no idea where that leads. The shell sets that up before the program starts. Programs can check whether they're talking to a terminal, which is why `ls` changes its layout when piped.",
  },
  {
    id: "dojo-stream-2",
    title: "Append, don't overwrite",
    brief: "`/challenge/half 1` prints the first half of a code and `/challenge/half 2` prints the second. Build `code.txt` holding both lines, first half on top. `>` empties the file each time, so you need its sibling.",
    hints: ["`>>` adds to the end of a file instead of replacing it.", "`/challenge/half 1 > code.txt`, then `/challenge/half 2 >> code.txt`"],
    build: (rng) => {
      const a = flagFrom(rng);
      const b = flagFrom(rng);
      const shell = ana();
      challenge(shell, "half", (ctx) => say(ctx.args[0] === "1" ? `${a}\n` : ctx.args[0] === "2" ? `${b}\n` : "Which half? Run: /challenge/half 1\n"));
      return { shell, state: { want: `${a}\n${b}\n` } };
    },
    passed: (w) => content(w, "/home/ana/code.txt") === w.state?.want,
    solve: () => ["/challenge/half 1 > code.txt", "/challenge/half 2 >> code.txt"],
    notEnough: () => ["/challenge/half 1 > code.txt", "/challenge/half 2 > code.txt"],
    debrief: "Mixing these up costs real evidence. `>` on a log file during an investigation destroys what was in it. When in doubt, use `>>`.",
  },
  {
    id: "dojo-stream-3",
    title: "Errors travel separately",
    brief: "`/challenge/noisy` floods standard output with progress lines, and the flag is on standard error. Send only standard error to `err.txt`, then read it.",
    hints: ["Standard error is file descriptor 2, so `2>` redirects it.", "`/challenge/noisy 2> err.txt > /dev/null`, then `cat err.txt`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const lines = noise(rng, 400);
      const shell = ana();
      challenge(shell, "noisy", () => ({ stdout: lines, stderr: `warning: ${flag}\n`, code: 0 }));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/noisy 2> err.txt > /dev/null", "cat err.txt", `submit ${w.flag}`],
    debrief: "Two streams exist so that errors still reach you when output is piped away. This is why `find / -name x 2>/dev/null` hides the permission errors and keeps the results.",
  },
  {
    id: "dojo-stream-4",
    title: "Feed a program from a file",
    brief: "`/challenge/gate` reads one word from standard input and compares it with its passphrase. The passphrase is in `pass.txt`. Don't retype it: give the file to the program as its input.",
    hints: ["`<` connects a file to a program's standard input.", "`/challenge/gate < pass.txt`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const pass = rng.pick(["ember", "cobalt", "juniper", "quartz"]) + rng.int(100, 999);
      const shell = ana();
      shell.fs.put("/home/ana/pass.txt", `${pass}\n`, { owner: "ana" });
      challenge(shell, "gate", (ctx: Ctx) => (ctx.stdin.trim() === pass ? say(`Accepted. ${flag}\n`) : say("I read my input from a redirect, and that wasn't the passphrase.\n")));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/gate < pass.txt", `submit ${w.flag}`],
    debrief: "`command < file` and `cat file | command` look alike, but the first gives the program the file directly. Scripts use this to feed answers to tools written for a person at a keyboard.",
  },
  {
    id: "dojo-stream-5",
    title: "Search what scrolls past",
    brief: "`/challenge/flood` prints thousands of lines, and one holds the flag. Don't save it this time. Pipe it straight into a search.",
    hints: ["`|` connects one program's output to the next one's input.", "`/challenge/flood | grep 'CD{'`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const lines = noise(rng, 2500).split("\n");
      lines.splice(rng.int(100, 2300), 0, `node-${rng.int(1, 9)} reported ${flag}`);
      const shell = ana();
      challenge(shell, "flood", () => say(lines.join("\n")));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/flood | grep 'CD{'", `submit ${w.flag}`],
    debrief: "This shape is most of log analysis: a source, a pipe, a filter. Nothing was written to disk, which matters on a machine you are investigating.",
  },
  {
    id: "dojo-stream-6",
    title: "Search the errors too",
    brief: "`/challenge/mixed` writes noise on standard output and the flag on standard error, mixed among more noise. A pipe carries only standard output, so `grep` won't see it. Merge the two streams first.",
    hints: ["`2>&1` means send stream 2 to wherever stream 1 goes.", "`/challenge/mixed 2>&1 | grep 'CD{'`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const out = noise(rng, 300);
      const errs = `${noise(rng, 300)}error ${flag}\n${noise(rng, 100)}`;
      const shell = ana();
      challenge(shell, "mixed", () => ({ stdout: out, stderr: errs, code: 0 }));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/mixed 2>&1 | grep 'CD{'", `submit ${w.flag}`],
    notEnough: () => ["/challenge/mixed | grep 'CD{'"],
    debrief: "Order matters: `cmd > f 2>&1` captures both, while `cmd 2>&1 > f` doesn't, because `2>&1` copies where stream 1 points at that moment.",
  },
  {
    id: "dojo-stream-7",
    title: "Throw away the decoys",
    brief: "`/challenge/decoys` prints many lines that look like flags. All but one are marked `DECOY`. Keep the lines holding a flag, then remove the decoys.",
    hints: ["`grep -v` keeps the lines that don't match.", "`/challenge/decoys | grep 'CD{' | grep -v DECOY`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const rows = Array.from({ length: 200 }, () => `DECOY ${flagFrom(rng)}`);
      rows.splice(rng.int(0, 199), 0, `REAL ${flag}`);
      const out = rng.shuffle(rows).join("\n");
      const shell = ana();
      challenge(shell, "decoys", () => say(`${out}\n`));
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["/challenge/decoys | grep 'CD{' | grep -v DECOY", `submit ${w.flag}`],
    debrief: "When you can't describe what you want, describe what you don't. SOC analysts do this all day, removing known-good lines until something odd is left.",
  },
  {
    id: "dojo-stream-8",
    title: "Clean it with sed",
    brief: "`scrambled.txt` holds a flag with `#` pushed between its characters. Remove every `#` as the text passes through.",
    hints: ["`sed 's/old/new/g'` replaces every match on each line.", "`sed 's/#//g' scrambled.txt`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/scrambled.txt", `${[...flag].join("#")}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["sed 's/#//g' scrambled.txt", `submit ${w.flag}`],
    debrief: "Filters can change text as well as select it. The `g` matters: without it, `sed` replaces only the first match on each line.",
  },
  {
    id: "dojo-stream-9",
    title: "Keep a copy as it passes",
    brief: "Run `/challenge/flood`, save all of its output to `evidence.txt`, and at the same time show only the line with the flag. One pipeline, one run: this source never repeats itself.",
    hints: ["`tee` copies its input to a file and also passes it on.", "`/challenge/flood | tee evidence.txt | grep 'CD{'`"],
    build: (rng) => {
      const lines = noise(rng, 800).split("\n");
      const flag = flagFrom(rng);
      lines.splice(rng.int(50, 700), 0, `sensor ${flag}`);
      const out = lines.join("\n");
      const shell = ana();
      let runs = 0;
      challenge(shell, "flood", () => (++runs === 1 ? say(out) : say("Already sent, and this source never repeats. Restart the mission to try again.\n")));
      return { shell, flag, state: { out } };
    },
    passed: (w) => submitted(w) && content(w, "/home/ana/evidence.txt") === w.state?.out,
    solve: (w) => ["/challenge/flood | tee evidence.txt | grep 'CD{'", `submit ${w.flag}`],
    notEnough: (w) => [`submit ${w.flag}`],
    debrief: "`tee` is how you watch a command and keep the record, which is the habit behind every good incident timeline.",
  },
];
