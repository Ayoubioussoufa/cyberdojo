import { NextResponse } from "next/server";
import { isLang } from "@/i18n/lang";
import type { Thread } from "@/lib/tutor-types";
import { refuse } from "@/server/tutor/guard";
import { pageChunks } from "@/server/tutor/corpus";
import { chats, isThread } from "@/server/tutor/store";

const TITLE = 70;
const title = (text: string | null) => {
  const line = (text ?? "").replace(/\s+/g, " ").trim();
  return line.length > TITLE ? `${line.slice(0, TITLE - 1)}…` : line;
};

/**
 * The learner's chats, newest first: `threads` from the tutor's own page,
 * `pages` held beside lessons, titled with the page's name.
 */
export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const langParam = new URL(req.url).searchParams.get("lang");
  const lang = isLang(langParam) ? langParam : "en";
  const rows = await chats();
  const threads: Thread[] = rows.filter((r) => isThread(r.page)).map((r) => ({ href: r.page, title: title(r.first), updatedAt: r.updatedAt, count: r.count }));
  // Only course pages: a chat held on a menu page has no lesson to go back to.
  const pages: Thread[] = rows.flatMap((r) => {
    const title = isThread(r.page) ? undefined : pageChunks(r.page, lang)[0]?.title;
    return title ? [{ href: r.page, title, updatedAt: r.updatedAt, count: r.count }] : [];
  });
  return NextResponse.json({ threads, pages });
}
