/** The command line under the header: what each kind of line means, and where it leads. */
import { SECTIONS, completions, knownPaths, listing, parse, rank, resolvePath, type Target } from "../src/lib/prompt";

let failed = 0;
const eq = (what: string, got: unknown, want: unknown) => {
  const a = JSON.stringify(got);
  const b = JSON.stringify(want);
  if (a !== b) {
    failed++;
    console.error(`FAIL ${what}\n  got  ${a}\n  want ${b}`);
  }
};

// Reading a line
eq("a name", parse("handbook"), { name: "go", query: "handbook" });
eq("two words", parse("  sign   in "), { name: "go", query: "sign in" });
eq("help", parse("help"), { name: "help" });
eq("man alone is help", parse("man"), { name: "help" });
eq("man with a page is a name", parse("man nmap"), { name: "go", query: "nmap" });
eq("cd", parse("cd .."), { name: "cd", arg: ".." });
eq("open is cd", parse("open flashcards"), { name: "cd", arg: "flashcards" });
eq("a bare path is cd", parse("/practice/mix"), { name: "cd", arg: "/practice/mix" });
eq("a bare parent is cd", parse(".."), { name: "cd", arg: ".." });
eq("home is cd", parse("~"), { name: "cd", arg: "~" });
eq("a slash inside a name is not a path", parse("TCP/IP"), { name: "go", query: "TCP/IP" });
eq("ls", parse("ls"), { name: "ls", arg: "" });
eq("ls a folder", parse("ls /courses"), { name: "ls", arg: "/courses" });
eq("commands ignore case", parse("PWD"), { name: "pwd" });
eq("sudo anything", parse("sudo rm -rf /"), { name: "sudo" });
eq("history", parse("history"), { name: "history" });

// Paths, from where you are
eq("up one", resolvePath("/practice/flashcards/", ".."), "/practice/");
eq("up past the top", resolvePath("/library/", "../../.."), "/");
eq("home", resolvePath("/courses/0001-x/", "~"), "/");
eq("from home", resolvePath("/courses/", "~/tools"), "/tools/");
eq("absolute", resolvePath("/courses/", "/practice/mix"), "/practice/mix/");
eq("relative", resolvePath("/practice/", "flashcards"), "/practice/flashcards/");
eq("dot", resolvePath("/practice/", "./mix/"), "/practice/mix/");

// Ranking
const course: Target[] = [
  { label: "Keeping input out of the code", href: "/courses/0047-keeping-input-out-of-the-code/", detail: "Lesson", tier: 0 },
  { label: "Kerberos and NTLM", href: "/courses/0044-kerberos-and-ntlm/", detail: "Lesson", tier: 0 },
  { label: "Kerberos", href: "/courses/0044-kerberos-and-ntlm/#kerberos", detail: "Term", tier: 0 },
  { label: "Nmap", href: "/tools/nmap/", detail: "Tool", tier: 0 },
  { label: "Network Mapper", href: "/tools/nmap/", detail: "Tool", tier: 0 },
  { label: "Zmap", href: "/tools/all/#zmap", detail: "Tool", tier: 0 },
];
const page: Target[] = [
  { label: "Handbook", href: "/guides/", detail: "~/guides/", tier: 2 },
  { label: "Practice what you read", href: "/practice/", detail: "~/practice/", tier: 2 },
  { label: "Web Security Academy: SQL injection", href: "https://portswigger.net/web-security/sql-injection", detail: "portswigger.net ↗", tier: 2 },
  { label: "Go further", href: "#go-further", detail: "on this page", tier: 1 },
];
const all = [...SECTIONS, ...page, ...course];
const top = (q: string) => rank(all, q, 1)[0]?.href;

eq("a section by name", top("practice"), "/practice/");
eq("a section by another name", top("cheat sheets"), "/sheets/");
eq("sign in", top("sign in"), "/signin/");
eq("login", top("login"), "/signin/");
eq("what the page shows", top("handbook"), "/guides/");
eq("a heading on the page", top("go further"), "#go-further");
eq("a site linked from the page, by its host", top("portswigger"), "https://portswigger.net/web-security/sql-injection");
eq("a lesson by number", top("0047"), "/courses/0047-keeping-input-out-of-the-code/");
eq("a tool by its other name", top("network mapper"), "/tools/nmap/");
eq("a tool from the A to Z, by its anchor", top("zmap"), "/tools/all/#zmap");
eq("an exact name beats a longer one", top("kerberos"), "/courses/0044-kerberos-and-ntlm/#kerberos");
eq("one row per destination", rank(all, "nmap").filter((t) => t.href === "/tools/nmap/").length, 1);
eq("nothing for nonsense", rank(all, "qqqzzz"), []);
eq("one letter only matches the start of a word", rank(all, "x").length, 0);

// Known pages, completion and listing
const known = knownPaths(all);
eq("parents are known", known.has("/courses/"), true);
eq("a page keeps its title", known.get("/tools/nmap/"), "Nmap");
eq("an anchor doesn't name its page", known.get("/tools/all/"), "Tools from A to Z");
eq("complete a start", completions("/", "/pra", known).map((t) => t.href), ["/practice/"]);
eq("complete inside", completions("/practice/", "fl", known).map((t) => t.href), ["/practice/flashcards/"]);
eq("complete a parent", completions("/practice/mix/", "..", known).map((t) => t.href)[0], "/practice/");
eq("list a folder", listing("/courses/", known).map((t) => t.href), ["/courses/0044-kerberos-and-ntlm/", "/courses/0047-keeping-input-out-of-the-code/"]);

if (failed) {
  console.error(`${failed} prompt check${failed === 1 ? "" : "s"} failed`);
  process.exit(1);
}
console.log("prompt: every check passed");
