import { NextResponse } from "next/server";
import { fail } from "@/server/http";
import { body, refuse } from "@/server/tutor/guard";
import { readSettings, writeSettings } from "@/server/tutor/settings";

export async function PUT(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const patch = await body(req, 2000);
  if (!patch) return fail(400, "That request wasn't valid.");
  const wrong = await writeSettings(patch);
  if (wrong) return fail(400, wrong);
  return NextResponse.json(await readSettings());
}
