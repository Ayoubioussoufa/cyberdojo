/** Bytes, hex and encodings. Original exercises on the topics of pwn.college's data-handling material. */
import { flagFrom, submitted, type Mission } from "../kit";
import { ana, hex } from "./kit";

const rot13 = (s: string) => s.replace(/[a-z]/gi, (c) => {
  const b = c <= "Z" ? 65 : 97;
  return String.fromCharCode(((c.charCodeAt(0) - b + 13) % 26) + b);
});

const words = ["harbor", "lantern", "cobalt", "juniper", "meadow"];


export const DATA: Mission[] = [
  {
    id: "dojo-data-1",
    title: "Text is numbers",
    brief: "Computers store text as numbers. `A` is 65, or `41` in hex. Turn the word in `word.txt` into hex and submit the hex digits. `echo -n` leaves out the invisible newline.",
    hints: ["`xxd -p` prints bytes as plain hex.", "`echo -n $(cat word.txt) | xxd -p`"],
    build: (rng) => {
      const w = rng.pick(words);
      const shell = ana();
      shell.fs.put("/home/ana/word.txt", `${w}\n`, { owner: "ana" });
      return { shell, flag: hex(w) };
    },
    passed: submitted,
    solve: (w) => ["echo -n $(cat word.txt) | xxd -p", `submit ${w.flag}`],
    debrief: "Each byte becomes two hex digits, so hex is exact and easy to compare. That's why hashes, keys and packet dumps are written in it.",
  },
  {
    id: "dojo-data-2",
    title: "Hex back to text",
    brief: "`message.hex` is a flag written as hex. Turn it back into text.",
    hints: ["`-r` reverses: hex in, bytes out.", "`xxd -r -p message.hex`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/message.hex", `${hex(flag)}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["xxd -r -p message.hex", `submit ${w.flag}`],
    debrief: "Encoding is a change of format, with no key and no secrecy. If you can see the method, you can reverse it.",
  },
  {
    id: "dojo-data-3",
    title: "Read a hex dump",
    brief: "`sample.bin` has unprintable bytes that wreck the terminal if you `cat` it. A hex dump shows the bytes safely: offset on the left, hex in the middle, printable text on the right. Dump it and read the first 8 hex digits, which identify the file type. Submit them, without spaces.",
    hints: ["`xxd sample.bin | head -1`", "The file starts with `7f 45 4c 46`: an ELF program. Submit the digits joined up."],
    build: (rng) => {
      const shell = ana();
      shell.fs.put("/home/ana/sample.bin", `\x7fELF\x01\x01${"x".repeat(rng.int(30, 60))}\n`, { owner: "ana" });
      return { shell, flag: "7f454c46" };
    },
    passed: submitted,
    solve: () => ["xxd -p sample.bin | head -1", "xxd sample.bin | head -1", "submit 7f454c46"],
    debrief: "The first bytes are the magic number, and they name the real type whatever the extension claims. `invoice.pdf.exe` can't lie to `xxd`.",
  },
  {
    id: "dojo-data-4",
    title: "Base64",
    brief: "`token.b64` looks like random letters. The `=` at the end gives it away: it's base64. Decode it.",
    hints: ["`base64 -d token.b64`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/token.b64", `${btoa(`user=ana;flag=${flag};`)}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["base64 -d token.b64", `submit ${w.flag}`],
    debrief: "Base64 lets any bytes travel through systems built for text, such as email and JSON. It hides nothing. Seeing a secret in base64 in a config file is the same as seeing it in plain text.",
  },
  {
    id: "dojo-data-5",
    title: "Layers",
    brief: "Attackers wrap things to get past filters. `payload.txt` is base64, and what's inside is hex. Peel both layers with one pipeline.",
    hints: ["Each step's output feeds the next.", "`base64 -d payload.txt | xxd -r -p`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const shell = ana();
      shell.fs.put("/home/ana/payload.txt", `${btoa(hex(flag))}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["base64 -d payload.txt | xxd -r -p", `submit ${w.flag}`],
    debrief: "Layered encoding is common in malicious scripts and proves nothing about what's inside. Decode outside the target, with tools that only transform text, and never run the result.",
  },
  {
    id: "dojo-data-6",
    title: "Rotated letters",
    brief: "`note.txt` is ROT13: each letter moved 13 places along the alphabet. Applying it twice gives the original. Use `tr` to rotate it back.",
    hints: ["`tr` maps one set of characters onto another.", "`tr 'A-Za-z' 'N-ZA-Mn-za-m' < note.txt`"],
    build: (rng) => {
      const flag = `CD{${rng.pick(words)}${rng.int(1000, 9999)}}`;
      const shell = ana();
      shell.fs.put("/home/ana/note.txt", `${rot13(`the flag is ${flag}`)}\n`, { owner: "ana" });
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["tr 'A-Za-z' 'N-ZA-Mn-za-m' < note.txt", `submit ${w.flag}`],
    debrief: "This looks like encryption, but there's no key: whoever knows the method can read it. Real encryption stays safe even when everyone knows the method.",
  },
];
