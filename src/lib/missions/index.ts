/** Terminal missions, grouped into ladders. Each lesson embeds one with @range. */
import { MISSIONS_LATER } from "./later";
import { MISSIONS_ZERO } from "./linux";
import type { RangeSet } from "./kit";

export type { Built, Mission, RangeSet } from "./kit";

export const RANGES: Record<string, RangeSet> = { ...MISSIONS_ZERO, ...MISSIONS_LATER };
