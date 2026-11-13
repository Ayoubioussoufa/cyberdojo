import { NextResponse } from "next/server";
import { fail } from "@/server/http";
import { body, refuse } from "@/server/tutor/guard";
import { cancelJob, currentJob, startSetup } from "@/server/tutor/jobs";
import { validModel } from "@/server/tutor/models";

/**
 * Starts the setup in the background: Ollama if it's missing or stopped, then
 * the models in `pull`, then `use` becomes the tutor's model. The status route
 * reports progress.
 */
export async function POST(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const b = await body(req, 2000);
  const pull = b?.pull ?? [];
  const use = b?.use;
  if (!Array.isArray(pull) || pull.length > 4 || !pull.every((m): m is string => typeof m === "string" && validModel(m)) || (use !== undefined && (typeof use !== "string" || !validModel(use)))) {
    return fail(400, "That request wasn't valid.");
  }
  const wrong = await startSetup(pull, use);
  if (wrong) return fail(409, wrong);
  return NextResponse.json(currentJob());
}

/** Stops the setup. A model download resumes where it stopped the next time it's asked for. */
export async function DELETE(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  cancelJob();
  return NextResponse.json({ ok: true });
}
