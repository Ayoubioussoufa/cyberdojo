import { NextResponse } from "next/server";
import { fail, sameOrigin, smallJson } from "@/server/http";
import { certsForUser, earnedBelts, issueCert } from "@/server/certs";
import { currentUser } from "@/server/session";

/** The belts this learner has earned and the certificates already issued. */
export async function GET() {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  const [earned, certs] = await Promise.all([earnedBelts(user.id), certsForUser(user.id)]);
  return NextResponse.json({ username: user.username, earned, certs });
}

/** Issues the certificate for an earned belt, with a name the learner chose. */
export async function POST(req: Request) {
  const user = await currentUser();
  if (!user) return fail(401, "Sign in first.");
  if (!sameOrigin(req)) return fail(403, "This request came from another site.");
  const body = await smallJson(req);
  const belt = typeof body?.belt === "number" ? body.belt : NaN;
  const id = await issueCert(user.id, user.username, belt, body?.name);
  if (!id) return fail(400, "You haven't earned that belt yet.");
  return NextResponse.json({ id });
}
