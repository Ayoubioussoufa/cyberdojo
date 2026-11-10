import { NextResponse } from "next/server";
import { isAdmin } from "@/server/metrics";
import { currentUser } from "@/server/session";

export async function GET() {
  const user = await currentUser();
  return NextResponse.json(isAdmin(user) ? { user, admin: true } : { user });
}
