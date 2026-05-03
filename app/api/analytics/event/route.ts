import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import bus from "@/lib/event-bus";
import type { TrackEventType, TrackEvent } from "@/lib/event-bus";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const VALID: Set<TrackEventType> = new Set([
  "arrival",
  "simulator_open",
  "step_2",
  "step_3",
  "submitted",
  "result",
]);

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const rl = rateLimit(`event:${ip}`, { max: 60, windowMs: 60_000 });
  if (!rl.ok) return NextResponse.json({ ok: true }); // silently swallow

  try {
    const body = await req.json().catch(() => null);
    if (!body || !VALID.has(body.type as TrackEventType)) {
      return NextResponse.json({ ok: false }, { status: 400 });
    }

    const event: TrackEvent = {
      id: randomUUID(),
      type: body.type as TrackEventType,
      ts: Date.now(),
    };

    bus.emit("track", event);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
