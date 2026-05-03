import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { insertLead } from "@/lib/db";
import { importLeadSchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Accepts either:
 *   - JSON array body:  [{firstName, lastName, email, phone, ...}, ...]
 *   - text/csv body with a header row
 */

function parseCsv(content: string): Record<string, string>[] {
  const lines = content.replace(/^\uFEFF/, "").split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = splitCsvLine(lines[0]);
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => (row[h] = cells[i] ?? ""));
    return row;
  });
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else {
      if (c === ",") {
        out.push(cur);
        cur = "";
      } else if (c === '"' && cur === "") inQ = true;
      else cur += c;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export async function POST(req: Request) {
  const ct = req.headers.get("content-type") || "";
  let rows: unknown[] = [];

  try {
    if (ct.includes("application/json")) {
      const json = await req.json();
      rows = Array.isArray(json) ? json : json?.rows ?? [];
    } else {
      const text = await req.text();
      rows = parseCsv(text);
    }
  } catch {
    return NextResponse.json({ error: "Corps invalide" }, { status: 400 });
  }

  const inserted: string[] = [];
  const errors: { row: number; error: string }[] = [];

  for (let idx = 0; idx < rows.length; idx++) {
    const r = rows[idx];
    const parsed = importLeadSchema.safeParse(r);
    if (!parsed.success) {
      errors.push({
        row: idx + 1,
        error:
          Object.values(parsed.error.flatten().fieldErrors)
            .flat()
            .filter(Boolean)[0] || "validation",
      });
      continue;
    }
    const d = parsed.data;
    const id = randomUUID();
    await insertLead({
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
      sourceIp: "import",
    });
    inserted.push(id);
  }

  return NextResponse.json({
    ok: true,
    inserted: inserted.length,
    errors,
  });
}
