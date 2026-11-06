/**
 * XOR, one-time pads and what goes wrong with them. Original exercises on the
 * topics of pwn.college's Cryptography module, from the defender's side.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { ana, fail, fromHex, hex, randomHex, say, tool, xorHex } from "./kit";
import type { Shell } from "@/lib/shell/shell";

/** `xor HEX HEX ...` prints the bytes XORed together, in hex. */
function xorTool(sh: Shell) {
  tool(sh, "xor", (ctx) => {
    const parts = ctx.args.length ? ctx.args : ctx.stdin.trim().split(/\s+/).filter(Boolean);
    if (parts.length < 2) return fail("usage: xor HEX HEX [HEX...]\n");
    if (parts.some((p) => !/^([0-9a-fA-F]{2})+$/.test(p))) return fail("xor: every argument must be whole bytes of hex\n");
    return say(`${xorHex(...parts.map((p) => p.toLowerCase()))}\n`);
  });
}

const box = () => {
  const shell = ana();
  xorTool(shell);
  return shell;
};

const put = (sh: Shell, name: string, text: string) => sh.fs.put(`/home/ana/${name}`, `${text}\n`, { owner: "ana" });

export const CRYPTO: Mission[] = [
  {
    id: "dojo-xor-1",
    title: "XOR, one byte",
    brief: "XOR compares bits: the result is 1 where they differ. `a5` is `10100101` and `f0` is `11110000`. This box has a tool: `xor HEX HEX`. Work the answer out on paper first, then check it with the tool and submit the hex.",
    hints: ["`10100101` XOR `11110000` is `01010101`.", "`xor a5 f0`"],
    build: () => ({ shell: box(), flag: "55" }),
    passed: submitted,
    solve: () => ["xor a5 f0", "submit 55"],
    debrief: "XOR undoes itself: `A ^ K ^ K = A`. Almost every cipher you'll meet is built on that single property.",
  },
  {
    id: "dojo-xor-2",
    title: "Decrypt a one-time pad",
    brief: "`cipher.hex` was made by XORing a flag with the key in `key.hex`. Apply the key again, and turn the hex back into text.",
    hints: ["`xor $(cat cipher.hex) $(cat key.hex)` gives the plaintext in hex.", "Pipe that into `xxd -r -p`."],
    build: (rng) => {
      const flag = flagFrom(rng);
      const key = randomHex(rng, flag.length);
      const shell = box();
      put(shell, "cipher.hex", xorHex(hex(flag), key));
      put(shell, "key.hex", key);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["xor $(cat cipher.hex) $(cat key.hex) | xxd -r -p", `submit ${w.flag}`],
    debrief: "With a truly random key as long as the message, used once, this can't be broken. Its problem is practical: getting that key to the other side is as hard as sending the message.",
  },
  {
    id: "dojo-xor-3",
    title: "Secret isn't the same as safe",
    brief: "A bank accepts orders encrypted with a one-time pad. `order.hex` is the encrypted form of `PAY 0100`. You don't have the key. Change the order so it decrypts to `PAY 9900`, and send your forgery with `bank <hex>`.",
    hints: ["`cipher ^ old ^ new` swaps the text without the key.", "`echo -n 'PAY 0100' | xxd -p` and the same for the new text.", "`xor $(cat order.hex) <old hex> <new hex>`, then `bank` that result."],
    build: (rng) => {
      const key = randomHex(rng, 8);
      const shell = box();
      const state: Record<string, unknown> = { paid: "" };
      put(shell, "order.hex", xorHex(hex("PAY 0100"), key));
      tool(shell, "bank", (ctx) => {
        const c = ctx.args[0] ?? "";
        if (!/^[0-9a-f]{16}$/i.test(c)) return fail("usage: bank <16 hex digits>\n");
        const text = fromHex(xorHex(c.toLowerCase(), key));
        state.paid = text;
        return say(`Order decrypted: ${text}\nExecuted.\n`);
      });
      return { shell, state };
    },
    passed: (w) => w.state?.paid === "PAY 9900",
    solve: () => [`bank $(xor $(cat order.hex) ${hex("PAY 0100")} ${hex("PAY 9900")})`],
    debrief: "The bank decrypted a message nobody with the key ever wrote. Encryption alone gives no integrity. That's why modern systems use authenticated encryption such as AES-GCM, which rejects tampered data.",
  },
  {
    id: "dojo-xor-4",
    title: "Never use a key twice",
    brief: "Someone reused a pad. `one.hex` is the encryption of the text in `known.txt`, and `two.hex` is a flag under the same key. Recover the flag without ever seeing the key. Both are the same length.",
    hints: ["`c1 ^ c2` cancels the key and leaves `p1 ^ p2`.", "XOR that with the known plaintext.", "`xor $(cat one.hex) $(cat two.hex) $(echo -n $(cat known.txt) | xxd -p) | xxd -r -p`"],
    build: (rng) => {
      const flag = flagFrom(rng);
      const known = "wire 500 to acct";
      const pad = known.padEnd(flag.length, ".").slice(0, flag.length);
      const key = randomHex(rng, flag.length);
      const shell = box();
      put(shell, "one.hex", xorHex(hex(pad), key));
      put(shell, "two.hex", xorHex(hex(flag), key));
      put(shell, "known.txt", pad);
      return { shell, flag };
    },
    passed: submitted,
    solve: (w) => ["xor $(cat one.hex) $(cat two.hex) $(echo -n $(cat known.txt) | xxd -p) | xxd -r -p", `submit ${w.flag}`],
    debrief: "One reused key broke a perfect cipher. Real systems have failed this way: the same mistake with stream cipher nonces broke WEP, and that's why each message needs a fresh nonce.",
  },
  {
    id: "dojo-xor-5",
    title: "Patterns leak through",
    brief: "`blocks.txt` is a log encrypted in ECB mode, shown with one 16-byte block per line. In ECB, the same plaintext block always gives the same ciphertext. Find the block that repeats most and submit it.",
    hints: ["Identical lines become neighbours after `sort`.", "`sort blocks.txt | uniq -c | sort -rn | head -1`"],
    build: (rng) => {
      const top = randomHex(rng, 16);
      const rows = Array.from({ length: 180 }, () => randomHex(rng, 16));
      for (let i = 0; i < 25; i++) rows.push(top);
      const shell = ana();
      put(shell, "blocks.txt", rng.shuffle(rows).join("\n"));
      return { shell, flag: top };
    },
    passed: submitted,
    solve: (w) => ["sort blocks.txt | uniq -c | sort -rn | head -1", `submit ${w.flag}`],
    debrief: "Nobody broke the cipher, yet you learned which record repeats. Good modes hide repetition with a fresh IV or nonce. ECB in a code review is a finding every time.",
  },
];
