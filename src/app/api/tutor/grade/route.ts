import { NextResponse } from "next/server";
import { isLang } from "@/i18n/lang";
import { fail } from "@/server/http";
import { grade } from "@/server/tutor/answer";
import { body, refuse } from "@/server/tutor/guard";
import { readSettings } from "@/server/tutor/settings";
import { lastGrade } from "@/server/tutor/store";

/** The last grade a written question received, or null. */
export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const question = new URL(req.url).searchParams.get("question") ?? "";
  if (!question || question.length > 200) return fail(400, "That request wasn't valid.");
  return NextResponse.json(await lastGrade(question));
}

export async function POST(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const b = await body(req, 12_000);
  if (!b || typeof b.href !== "string" || !isLang(b.lang) || typeof b.questionId !== "string" || typeof b.answer !== "string" || !b.answer.trim()) return fail(400, "That request wasn't valid.");
  const settings = await readSettings();
  if (!settings.chatModel) return fail(409, "Pick a model for the tutor first.");
  const result = await grade(settings, b.href, b.lang, b.questionId, b.answer.trim(), req.signal);
  return typeof result === "string" ? fail(result === "Not found." ? 404 : 502, result) : NextResponse.json(result);
}
