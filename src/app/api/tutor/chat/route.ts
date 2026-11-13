import { NextResponse } from "next/server";
import { isLang } from "@/i18n/lang";
import { isMode } from "@/lib/tutor-types";
import { fail } from "@/server/http";
import { answer } from "@/server/tutor/answer";
import { body, refuse } from "@/server/tutor/guard";
import { readSettings } from "@/server/tutor/settings";
import { clearHistory, history } from "@/server/tutor/store";

/** A whole page copied for review, with every question and answer, is the largest message. */
const MAX_BODY = 60_000;

const pageOf = (req: Request) => {
  const page = new URL(req.url).searchParams.get("page") ?? "";
  return page.startsWith("/") && page.length <= 300 ? page : null;
};

export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const page = pageOf(req);
  if (!page) return fail(400, "That request wasn't valid.");
  return NextResponse.json(await history(page));
}

export async function DELETE(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const page = pageOf(req);
  if (!page) return fail(400, "That request wasn't valid.");
  await clearHistory(page);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const b = await body(req, MAX_BODY);
  if (!b || typeof b.href !== "string" || !b.href.startsWith("/") || b.href.length > 300 || !isLang(b.lang) || !isMode(b.mode) || typeof b.message !== "string" || !b.message.trim()) {
    return fail(400, "That request wasn't valid.");
  }
  const settings = await readSettings();
  if (!settings.chatModel) return fail(409, "Pick a model for the tutor first.");
  const stream = answer(settings, { href: b.href, lang: b.lang, mode: b.mode, reveal: b.reveal === true, message: b.message.trim() }, req.signal);
  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
}
