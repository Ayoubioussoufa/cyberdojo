import { NextResponse } from "next/server";
import { clientIp, sameOrigin, smallJson } from "@/server/http";
import { readHit, record } from "@/server/metrics";
import { currentUser } from "@/server/session";

/**
 * A page view, or seconds spent on a page. Always answers 204: the browser has
 * nothing to do with the result, and a stranger learns nothing by probing.
 */
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!sameOrigin(req)) return done;
  const body = await smallJson(req);
  const hit = body && readHit(body);
  if (!hit) return done;
  try {
    record(hit, await currentUser(), req.headers.get("user-agent") ?? "", clientIp(req));
  } catch (e) {
    // Statistics must never break a page.
    console.error("track:", e);
  }
  return done;
}
