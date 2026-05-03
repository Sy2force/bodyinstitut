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

  // Tier-1: 5 attempts per 15 minutes per IP
  const rl1 = rateLimit(`login:ip:${ip}`, { max: 5, windowMs: 15 * 60_000 });
  if (!rl1.ok) {
    console.warn(`[auth] IP locked out: ${ip}`);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessaie dans ${rl1.reset} secondes.` },
      { status: 429, headers: { "Retry-After": String(rl1.reset) } }
    );
  }

  // Tier-2: hard lockout — 10 attempts per 30 minutes per IP
  const rl2 = rateLimit(`login:hard:${ip}`, { max: 10, windowMs: 30 * 60_000 });
  if (!rl2.ok) {
    console.warn(`[auth] HARD lockout for IP: ${ip}`);
    return NextResponse.json(
      { error: "Accès temporairement bloqué. Réessaie dans 30 minutes." },
      { status: 429, headers: { "Retry-After": String(rl2.reset) } }
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

  // Rate limit by username too (prevent credential stuffing)
  const rl3 = rateLimit(`login:user:${username}`, { max: 5, windowMs: 15 * 60_000 });
  if (!rl3.ok) {
    console.warn(`[auth] Username locked out: ${username} from ${ip}`);
    return NextResponse.json(
      { error: `Trop de tentatives. Réessaie dans ${rl3.reset} secondes.` },
      { status: 429, headers: { "Retry-After": String(rl3.reset) } }
    );
  }

  if (!checkCredentials(username, password)) {
    console.warn(`[auth] Failed login attempt for "${username}" from ${ip} at ${new Date().toISOString()}`);
    return NextResponse.json(
      { error: "Identifiants incorrects" },
      { status: 401 }
    );
  }

  console.info(`[auth] Successful login for "${username}" from ${ip} at ${new Date().toISOString()}`);
  const token = await signSession(username);
  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildCookie(token),
    },
  });
}
