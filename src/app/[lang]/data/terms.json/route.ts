import { glossary } from "@/lib/content";
import { LANGS, isLang } from "@/i18n/lang";

export const dynamic = "force-static";
export const dynamicParams = false;
export const generateStaticParams = () => LANGS.map((lang) => ({ lang }));

export async function GET(_: Request, { params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  return Response.json(glossary(isLang(lang) ? lang : "en"));
}
