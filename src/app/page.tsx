import { Home } from "@/components/Home";
import { allQuestions } from "@/lib/content";
import { buildPath } from "@/lib/path";

export default function Page() {
  return <Home path={buildPath()} questionIds={allQuestions().map((q) => q.q.id)} />;
}
