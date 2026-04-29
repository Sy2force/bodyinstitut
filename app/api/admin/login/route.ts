import { NextResponse } from "next/server";
import {
  buildCookie,
  checkCredentials,
  signSession,
} from "@/lib/auth";
import { adminLoginSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`login:${ip}`, { max: 8, windowMs: 60_000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Trop de tentatives." },
      { status: 429, headers: { "Retry-After": String(rl.reset) } }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Identifiants invalides" },
      { status: 400 }
    );
  }
  const { username, password } = parsed.data;
  if (!checkCredentials(username, password)) {
    return NextResponse.json(
      { error: "Identifiants incorrects" },
      { status: 401 }
    );
  }

  const token = await signSession(username);
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildCookie(token),
    },
  });
}
