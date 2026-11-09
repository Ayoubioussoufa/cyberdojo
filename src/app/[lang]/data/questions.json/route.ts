import { allQuestions } from "@/lib/content";
import { LANGS, isLang } from "@/i18n/lang";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

/** Fetched by /review only once there is something to review. */
export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return Response.json(allQuestions(isLang(lang) ? lang : "en").map((x) => ({ q: x.q, title: x.title, href: x.href })));
}
