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
const MAX_BODY_BYTES = 10_240; // 10 KB

export async function POST(req: Request) {
  try {
    // Payload size guard
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Requête trop volumineuse." }, { status: 413 });
    }

    const ip = getClientIp(req);

    // Rate limit by IP: 5 per minute
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

    // Rate limit by email: 3 submissions per 24h (prevents same email spam)
    const emailKey = `lead-start:email:${d.email.toLowerCase()}`;
    const rlEmail = rateLimit(emailKey, { max: 3, windowMs: 24 * 60 * 60_000 });
    if (!rlEmail.ok) {
      return NextResponse.json(
        { error: "Cette adresse email a déjà soumis plusieurs demandes. Réessayez demain." },
        { status: 429 }
      );
    }

    // Honeypot check (company field must be empty)
    if (d.company && d.company.length > 0) {
      return NextResponse.json({ ok: true, id: randomUUID() }); // silently reject bots
    }

    const id = randomUUID();
    const lead = await insertLead({
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
