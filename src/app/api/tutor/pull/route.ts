import { fail } from "@/server/http";
import { body, refuse } from "@/server/tutor/guard";
import { validModel } from "@/server/tutor/models";
import { OllamaError, pull } from "@/server/tutor/ollama";
import { readSettings } from "@/server/tutor/settings";

/** Downloads a model through Ollama and passes its progress lines on. Closing the request cancels the download. */
export async function POST(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const model = (await body(req, 500))?.model;
  if (typeof model !== "string" || !validModel(model)) return fail(400, "That isn't a valid model name.");
  try {
    const stream = await pull((await readSettings()).host, model, req.signal);
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-store" } });
  } catch (e) {
    return fail(502, e instanceof OllamaError ? e.message : "The download couldn't start.");
  }
}
