import { NextResponse } from "next/server";
import { fail, sameOrigin } from "@/server/http";
import { endSession } from "@/server/session";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  await endSession();
  return NextResponse.json({ ok: true });
}
