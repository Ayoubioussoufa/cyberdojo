import { NextResponse } from "next/server";
import type { TutorStatus } from "@/lib/tutor-types";
import { refuse } from "@/server/tutor/guard";
import { hardware } from "@/server/tutor/hardware";
import { autoStart, currentJob } from "@/server/tutor/jobs";
import { advise, EMBED_BYTES } from "@/server/tutor/models";
import { hasModel, installed, loaded, version } from "@/server/tutor/ollama";
import { assetName, findOllama, isLocal, knownInstallBytes } from "@/server/tutor/runtime";
import { readSettings } from "@/server/tutor/settings";
import { indexStatus, startIndexing } from "@/server/tutor/vectors";

/** Everything the setup page, the tutor and the nav need to know, in one answer. */
export async function GET(req: Request) {
  const no = await refuse(req);
  if (no) return no;
  const settings = await readSettings();
  const running = await version(settings.host);
  const [models, inMemory, hw] = await Promise.all([running ? installed(settings.host).catch(() => []) : [], running ? loaded(settings.host) : [], hardware()]);
  const canEmbed = hasModel(models, settings.embedModel);
  let index = await indexStatus(settings, canEmbed);
  // The search index builds itself as soon as it can: nothing for the learner to press.
  if (index.state === "idle") {
    await startIndexing(settings);
    index = await indexStatus(settings, canEmbed);
  }
  const local = isLocal(settings.host);
  const found = local ? findOllama() : null;
  autoStart(settings.chatModel, running !== null, local, found !== null);
  const { models: catalog, recommended } = advise(hw);
  const status: TutorStatus = {
    platform: process.platform,
    ollama: {
      running: running !== null,
      version: running,
      found: found?.kind ?? null,
      local,
      canInstall: local && assetName() !== null,
      installBytes: local && !found && !running ? knownInstallBytes() : null,
    },
    installed: models,
    loaded: inMemory,
    settings,
    hardware: hw,
    catalog,
    recommended,
    embedBytes: EMBED_BYTES,
    index,
    job: currentJob(),
  };
  return NextResponse.json(status);
}
