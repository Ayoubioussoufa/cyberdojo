import { glossary } from "@/lib/content";

export const dynamic = "force-static";

export const GET = () => Response.json(glossary());
