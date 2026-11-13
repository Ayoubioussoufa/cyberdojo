import { NextResponse } from "next/server";
import { fail } from "@/server/http";
import { refuse } from "@/server/tutor/guard";
import { validModel } from "@/server/tutor/models";
import { OllamaError, remove } from "@/server/tutor/ollama";
import { readSettings, writeSettings } from "@/server/tutor/settings";

/** Deletes a downloaded model to free disk space. Deleting the tutor's own model leaves it with none. */
export async function DELETE(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const name = new URL(req.url).searchParams.get("name") ?? "";
  if (!validModel(name)) return fail(400, "That isn't a valid model name.");
  const settings = await readSettings();
  if (name === settings.embedModel || name === `${settings.embedModel}:latest`) return fail(400, "The search model can't be deleted from here.");
  try {
    await remove(settings.host, name);
  } catch (e) {
    return fail(502, e instanceof OllamaError ? e.message : "That didn't work. Try again.");
  }
  if (name === settings.chatModel || name === `${settings.chatModel}:latest`) await writeSettings({ chatModel: "" });
  return NextResponse.json({ ok: true });
}
