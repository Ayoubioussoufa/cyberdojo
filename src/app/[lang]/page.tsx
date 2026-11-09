import { Home } from "@/components/Home";
import { buildPath } from "@/lib/path";
import { langOf, type LangParams } from "@/i18n/server";

export default async function Page({ params }: LangParams) {
  return <Home path={buildPath(await langOf(params))} />;
}
