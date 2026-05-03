import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  insertLead,
  leadStats,
  listLeads,
  type LeadStatus,
} from "@/lib/db";
import { importLeadSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const sp = url.searchParams;

  const minBudget = sp.get("minBudget");
  const maxBudget = sp.get("maxBudget");
  const limit = sp.get("limit");
  const offset = sp.get("offset");

  const { rows, total } = await listLeads({
    q: sp.get("q") ?? undefined,
    status: (sp.get("status") as LeadStatus | "all" | null) ?? undefined,
    simulator: sp.get("simulator") ?? undefined,
    minBudget: minBudget ? Number(minBudget) : undefined,
    maxBudget: maxBudget ? Number(maxBudget) : undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    limit: limit ? Number(limit) : 100,
    offset: offset ? Number(offset) : 0,
    orderBy:
      (sp.get("orderBy") as "created_at" | "budget" | "last_name" | null) ??
      "created_at",
    order: (sp.get("order") === "asc" ? "asc" : "desc") as "asc" | "desc",
  });

  return NextResponse.json({
    rows,
    total,
    stats: await leadStats(),
  });
}

/** Manual create / import (single lead). */
export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = importLeadSchema.safeParse(json);
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
  const lead = await insertLead({
    id,
    firstName: d.firstName.trim(),
    lastName: d.lastName.trim(),
    email: d.email.trim().toLowerCase(),
    phone: d.phone.trim(),
    simulator: d.simulator,
    goal: d.goal,
    zone: d.zone,
    intensity: d.intensity ?? null,
    sport: d.sport ?? null,
    budget: d.budget ?? 0,
    protocol: null,
    result: null,
    aiNotes: null,
    analysis: null,
    sourceIp: "admin",
  });
  return NextResponse.json({ ok: true, lead });
}
