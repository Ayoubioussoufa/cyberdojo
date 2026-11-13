import { NextResponse } from "next/server";
import { fail } from "@/server/http";
import { refuse } from "@/server/tutor/guard";
import { hardware } from "@/server/tutor/hardware";
import { adviseOne, lookUp, validModel } from "@/server/tutor/models";

/** Any model by name: its download size and how it would run on this computer, before downloading it. */
export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const name = (new URL(req.url).searchParams.get("name") ?? "").trim();
  if (!validModel(name)) return fail(400, "That isn't a valid model name.");
  const bytes = await lookUp(name);
  if (bytes === undefined) return fail(502, "The model's registry couldn't be reached. Check the connection and try again.");
  if (bytes === null) return fail(404, "No model by that name on Ollama or Hugging Face.");
  return NextResponse.json(adviseOne(name, bytes, await hardware()));
}
