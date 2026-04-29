import { NextResponse } from "next/server";
import { deleteLead, getLead, updateLeadStatus } from "@/lib/db";
import { updateLeadSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const lead = getLead(params.id);
  if (!lead) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ lead });
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const json = await req.json().catch(() => null);
  const parsed = updateLeadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Statut invalide" },
      { status: 400 }
    );
  }
  const ok = updateLeadStatus(params.id, parsed.data.status);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true, lead: getLead(params.id) });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const ok = deleteLead(params.id);
  if (!ok) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
