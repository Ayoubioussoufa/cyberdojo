import { NextResponse } from "next/server";
import { currentUser } from "@/server/session";

export async function GET() {
  return NextResponse.json({ user: await currentUser() });
}
