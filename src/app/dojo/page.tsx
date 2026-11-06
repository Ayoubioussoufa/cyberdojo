import type { Metadata } from "next";
import { DojoHub } from "@/components/DojoHub";
import { DOJO } from "@/data/dojo";
import { RANGES } from "@/lib/missions";

export const metadata: Metadata = { title: "Dojo", description: "Flag challenges in a browser terminal: pipes, permissions, HTTP, SQL, encodings, XOR and access control." };

export default function Page() {
  const modules = DOJO.map((m) => ({ ...m, missions: (RANGES[m.range]?.missions ?? []).map((x) => ({ id: x.id, title: x.title })) }));
  return <div className="page"><DojoHub modules={modules} /></div>;
}
