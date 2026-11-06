import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Drill } from "@/components/Drill";
import { Range } from "@/components/Range";
import { DRILLS, DRILL_LIST } from "@/lib/drills";
import { RANGES } from "@/lib/missions";

export const dynamicParams = false;
export const generateStaticParams = () => [...DRILL_LIST.map((d) => d.id), ...Object.keys(RANGES)].map((drill) => ({ drill }));

type Props = { params: Promise<{ drill: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { drill } = await params;
  return { title: DRILLS[drill]?.title ?? RANGES[drill]?.title ?? "Practice" };
}

export default async function Page({ params }: Props) {
  const { drill } = await params;
  if (!DRILLS[drill] && !RANGES[drill]) notFound();
  return (
    <div className="page narrow">
      <p className="back"><Link href="/practice/">← All practice</Link></p>
      {DRILLS[drill] ? <Drill id={drill} roundSize={12} /> : <Range id={drill} />}
    </div>
  );
}
