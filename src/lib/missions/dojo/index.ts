/** The dojo's challenges: one ladder per module. src/data/dojo.ts describes each. */
import type { RangeSet } from "../kit";
import { ACCESS } from "./access";
import { AUDIT } from "./audit";
import { CRYPTO } from "./crypto";
import { DATA } from "./data";
import { PERMISSIONS } from "./permissions";
import { SQL } from "./sql";
import { STREAMS } from "./streams";
import { WEB } from "./web";

export const MISSIONS_DOJO: Record<string, RangeSet> = {
  "dojo-streams": { title: "Pipes and streams", missions: STREAMS },
  "dojo-permissions": { title: "Permissions", missions: PERMISSIONS },
  "dojo-data": { title: "Bytes and encodings", missions: DATA },
  "dojo-sql": { title: "Questioning a database", missions: SQL },
  "dojo-web": { title: "Talking to the web", missions: WEB },
  "dojo-crypto": { title: "XOR and its traps", missions: CRYPTO },
  "dojo-access": { title: "Access control", missions: ACCESS },
  "dojo-audit": { title: "Privilege audit", missions: AUDIT },
};
