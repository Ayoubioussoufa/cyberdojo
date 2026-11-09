/** The dojo's modules: one ladder of flag challenges each, in the order to attempt them. */
export type BeltName = "White" | "Yellow" | "Orange" | "Green" | "Blue";

export interface DojoModule {
  id: string;
  range: string;
  title: string;
  belt: BeltName;
  /** What finishing it lets you do. */
  skill: string;
  /** Teaches from scratch, shown above the terminal. */
  intro: string[];
  /** Commands the module practises. */
  tools: string[];
  /** A lesson that goes deeper. */
  lesson?: { href: string; title: string };
  credit: { label: string; href: string; note: string };
}

const LUMINARIUM = { label: "Linux Luminarium", href: "https://pwn.college/linux-luminarium/", note: "Ideas follow pwn.college's Linux Luminarium (BSD-2-Clause). Exercises written for CyberDojo." };
const FUNDAMENTALS = { label: "Playing With Programs", href: "https://pwn.college/fundamentals/", note: "Covers topics also taught in pwn.college's Playing With Programs. Exercises written for CyberDojo." };
const INTRO = { label: "Intro to Cybersecurity", href: "https://pwn.college/intro-to-cybersecurity/", note: "Covers topics also taught in pwn.college's Intro to Cybersecurity. Exercises written for CyberDojo." };

export const DOJO: DojoModule[] = [
  {
    id: "streams",
    range: "dojo-streams",
    title: "Pipes and streams",
    belt: "White",
    skill: "move data between programs without touching a mouse",
    intro: [
      "Every program starts with three open channels: standard input (0), standard output (1) and standard error (2). By default all three lead to your terminal. The program doesn't choose where they go: the shell decides before it starts, and the program just reads and writes.",
      "That one design is why small tools combine so well. `>` points output at a file, `<` feeds a file in, `2>` catches errors, and `|` connects one program's output to the next one's input.",
    ],
    tools: [">", ">>", "2>", "<", "|", "2>&1", "grep", "sed", "tee"],
    lesson: { href: "/courses/0006-pipes-and-redirection/", title: "Pipes and redirection" },
    credit: LUMINARIUM,
  },
  {
    id: "permissions",
    range: "dojo-permissions",
    title: "Permissions",
    belt: "White",
    skill: "read a permission string and grant the least that works",
    intro: [
      "On every file access the kernel asks one question: is this user the owner, in the group, or neither? It picks that one class and checks its three bits: read, write, execute. `-rw-r-----` means the owner may read and write, the group may read, and others get nothing.",
      "You'll use `chown`, `chgrp` and `chmod`, each through a narrow `sudo` rule. Notice how much power each one really hands over.",
    ],
    tools: ["id", "ls -l", "chown", "chgrp", "chmod", "umask", "sudo -l"],
    lesson: { href: "/courses/0007-users-and-permissions/", title: "Users and permissions" },
    credit: LUMINARIUM,
  },
  {
    id: "data",
    range: "dojo-data",
    title: "Bytes and encodings",
    belt: "Yellow",
    skill: "recognise and reverse hex and base64 on sight",
    intro: [
      "A computer stores only bytes: numbers from 0 to 255. Text is an agreement about what those numbers mean, and `A` is 65 under ASCII. Hex writes each byte as two digits from 0 to f, so 65 becomes `41`. Base64 writes any bytes using only 64 printable characters, so they survive systems made for text.",
      "None of this is encryption. Encoding has no key, so anyone can reverse it, and telling the difference is a daily skill in log and malware analysis.",
    ],
    tools: ["xxd", "xxd -r -p", "base64 -d", "tr"],
    lesson: { href: "/courses/0015-bits-and-ip-addresses/", title: "Bits and IP addresses" },
    credit: FUNDAMENTALS,
  },
  {
    id: "sql",
    range: "dojo-sql",
    title: "Questioning a database",
    belt: "Yellow",
    skill: "answer questions from a database with SELECT",
    intro: [
      "A relational database keeps data in tables: columns name the fields and each row is one record. You ask with SQL, and you describe the result you want, not the steps to get it. `SELECT value FROM secrets WHERE tag = 'flag'` reads: from this table, keep these rows, show this column.",
      "Learn this well: SIEMs and log platforms use the same way of thinking, and you can't understand SQL injection until you can read the query being attacked.",
    ],
    tools: ["SELECT", "WHERE", "LIKE", "substr", "ORDER BY", "LIMIT", "count", "sqlite_master"],
    lesson: { href: "/courses/0037-databases-and-sql/", title: "Databases and SQL" },
    credit: FUNDAMENTALS,
  },
  {
    id: "web",
    range: "dojo-web",
    title: "Talking to the web",
    belt: "Orange",
    skill: "speak HTTP by hand and see what a browser hides",
    intro: [
      "HTTP is plain text. A client sends a request: a method, a path and some headers, sometimes with a body. The server sends back a status code, headers and a body. A browser does this for you and then hides most of it, and `curl` shows you all of it.",
      "These servers are simulated inside your browser, on made-up hosts. Nothing leaves this page, and `curl` here only reaches the sites each challenge sets up.",
    ],
    tools: ["curl", "-i", "-L", "-H", "-d", "-c", "-b"],
    lesson: { href: "/courses/0035-how-the-web-works/", title: "How the web works" },
    credit: FUNDAMENTALS,
  },
  {
    id: "crypto",
    range: "dojo-crypto",
    title: "XOR and its traps",
    belt: "Green",
    skill: "explain why key reuse and missing integrity break encryption",
    intro: [
      "XOR compares two bits and gives 1 when they differ. Its key property is that it undoes itself: `A ^ K ^ K = A`. Encrypt by XORing with a key, and decrypt by doing exactly the same again.",
      "Used perfectly, this can't be broken. The failures come from how it's used, and each challenge here shows one of the mistakes that modern ciphers are designed around.",
    ],
    tools: ["xor", "xxd", "sort", "uniq -c"],
    lesson: { href: "/courses/0038-hashes-and-symmetric-crypto/", title: "Hashes and symmetric crypto" },
    credit: INTRO,
  },
  {
    id: "access",
    range: "dojo-access",
    title: "Access control",
    belt: "Green",
    skill: "tell discretionary from mandatory access control and audit both",
    intro: [
      "Under discretionary access control, the owner of a file decides who may use it, which is how Linux permissions work. Under mandatory access control, the system's policy decides and nobody can override it, not even the owner.",
      "The classic mandatory model is Bell-LaPadula, built for military secrets: you can't read above your level, and you can't write below it. You'll apply these rules to data with `awk` the way an auditor would.",
    ],
    tools: ["find -group", "sudo -l", "awk", "grep -v"],
    lesson: { href: "/courses/0041-identity-and-access/", title: "Identity and access" },
    credit: INTRO,
  },
  {
    id: "audit",
    range: "dojo-audit",
    title: "Privilege audit",
    belt: "Blue",
    skill: "find excess privilege on a Linux host and remove it",
    intro: [
      "A program marked SUID runs as its owner, not as the person who started it. That's how `passwd` can edit a file only root may touch. It also means a flaw in any root-owned SUID program can hand root to anyone.",
      "On pwn.college you can practise misusing such programs. Here you take the other seat: list them, compare them with a baseline, remove what isn't needed, and check what root trusts.",
    ],
    tools: ["find -perm", "sort", "uniq -u", "chmod u-s"],
    lesson: { href: "/courses/0057-auditing-for-privilege-escalation/", title: "Auditing for privilege escalation" },
    credit: FUNDAMENTALS,
  },
];

