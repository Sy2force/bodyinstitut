import { NextResponse } from "next/server";
import { upsertPresence } from "@/lib/presence";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`ping:${ip}`, { max: 10, windowMs: 30_000 });
  if (!rl.ok) return NextResponse.json({ ok: true });

  try {
    const { sessionId, page } = await req.json();
    if (typeof sessionId !== "string" || sessionId.length < 8 || sessionId.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }
    const safePage = typeof page === "string" ? page.slice(0, 40) : "home";
    upsertPresence(sessionId, safePage);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
