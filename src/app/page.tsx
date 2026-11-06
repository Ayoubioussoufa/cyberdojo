import { Home } from "@/components/Home";
import { buildPath } from "@/lib/path";

export default function Page() {
  return <Home path={buildPath()} />;
}
