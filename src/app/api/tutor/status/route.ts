import { NextResponse } from "next/server";
import type { TutorStatus } from "@/lib/tutor-types";
import { refuse } from "@/server/tutor/guard";
import { CATALOG, hardware } from "@/server/tutor/models";
import { hasModel, installed, version } from "@/server/tutor/ollama";
import { readSettings } from "@/server/tutor/settings";
import { indexStatus, startIndexing } from "@/server/tutor/vectors";

/** Everything the setup page and the tutor panel need to know, in one answer. */
export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const settings = await readSettings();
  const running = await version(settings.host);
  const models = running ? await installed(settings.host).catch(() => []) : [];
  const canEmbed = hasModel(models, settings.embedModel);
  let index = await indexStatus(settings, canEmbed);
  // The search index builds itself as soon as it can: nothing for the learner to press.
  if (index.state === "idle") {
    await startIndexing(settings);
    index = await indexStatus(settings, canEmbed);
  }
  const status: TutorStatus = { platform: process.platform, ollama: { running: running !== null, version: running }, installed: models, settings, hardware: hardware(), catalog: CATALOG, index };
  return NextResponse.json(status);
}
