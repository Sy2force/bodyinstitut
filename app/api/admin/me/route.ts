import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { COOKIE_NAME, verifySession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const token = cookies().get(COOKIE_NAME)?.value;
  const session = await verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({ user: { username: session.sub, exp: session.exp } });
}
