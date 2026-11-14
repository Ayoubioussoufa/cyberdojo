import { NextResponse } from "next/server";
import { sameOrigin, smallJson } from "@/server/http";
import { readFeedback, saveFeedback } from "@/server/metrics";
import { currentUser } from "@/server/session";

/**
 * A thumbs-up or thumbs-down on the page that is open, with an optional note.
 * Always answers 204: the browser needs nothing back, and a stranger learns
 * nothing by probing. A bad or forged body is silently ignored.
 */
export async function POST(req: Request) {
  const done = new NextResponse(null, { status: 204 });
  if (!sameOrigin(req)) return done;
  const body = await smallJson(req);
  const fb = body && readFeedback(body);
  if (!fb) return done;
  try {
    await saveFeedback(fb, await currentUser());
  } catch (e) {
    // Feedback must never break a page.
    console.error("feedback:", e);
  }
  return done;
}
