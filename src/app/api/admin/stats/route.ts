import { NextResponse } from "next/server";
import { fail } from "@/server/http";
import { isAdmin, report } from "@/server/metrics";
import { currentUser } from "@/server/session";

const RANGES = [7, 30, 90];

/** Usage figures, for admins only. Everyone else gets the same 404 as a page that isn't there. */
export async function GET(req: Request) {
  const user = await currentUser();
  if (!isAdmin(user)) return fail(404, "Not found.");
  const asked = Number(new URL(req.url).searchParams.get("days"));
  return NextResponse.json(report(RANGES.includes(asked) ? asked : 30));
}
