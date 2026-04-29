import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { insertLead } from "@/lib/db";
import { leadStartSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Step 1 — partial lead creation (ULTRA-SLIM contact form: prénom + email + tel).
 * Returns { id } that the client will send back in /api/leads/complete.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`lead-start:${ip}`, { max: 5, windowMs: 60_000 });
    if (!rl.ok) {
      return NextResponse.json(
        { error: "Trop de requêtes. Réessayez dans un instant." },
        { status: 429, headers: { "Retry-After": String(rl.reset) } }
      );
    }

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
    }

    const parsed = leadStartSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation échouée",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const d = parsed.data;

    const id = randomUUID();
    const lead = insertLead({
      id,
      firstName: d.firstName.trim(),
      lastName: d.lastName.trim(),
      email: d.email.trim().toLowerCase(),
      phone: d.phone.trim(),
      city: d.city.trim(),
      age: d.age,
      sex: d.sex,
      heightCm: d.heightCm ?? null,
      weightKg: d.weightKg ?? null,
      simulator: "À déterminer",
      simulatorId: null,
      goal: "En cours",
      zone: "En cours",
      protocol: null,
      result: null,
      aiNotes: null,
      analysis: null,
      consent: !!d.consent,
      sourceIp: ip,
    });

    if (!lead) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id });
  } catch (err) {
    console.error("/api/leads/start error", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
