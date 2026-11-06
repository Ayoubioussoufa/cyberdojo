import { Home } from "@/components/Home";
import { allQuestions, lessonMetas } from "@/lib/content";
import { PHASES, phaseOf } from "@/lib/data";

export default function Page() {
  const metas = lessonMetas();
  const phases = PHASES.map((p) => ({ ...p, lessons: metas.filter((m) => phaseOf(m.month) === p.n).map((m) => m.slug) }));
  return <Home lessons={metas} phases={phases} questionIds={allQuestions().map((q) => q.q.id)} />;
}
