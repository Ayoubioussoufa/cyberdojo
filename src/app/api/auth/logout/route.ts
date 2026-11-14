import { NextResponse } from "next/server";
import { DESKTOP } from "@/lib/desktop";
import { fail, sameOrigin } from "@/server/http";
import { endSession } from "@/server/session";

export async function POST(req: Request) {
  // The desktop app has one local profile and nothing to sign in to. Answering here would let a web
  // page that reaches the app's local server (DNS rebinding) write accounts into its database.
  if (DESKTOP) return fail(404, "Not found.");
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  await endSession();
  return NextResponse.json({ ok: true });
}
