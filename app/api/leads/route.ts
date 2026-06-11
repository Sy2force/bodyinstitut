import { NextResponse } from "next/server";
import { insertLead, initDb } from "@/lib/db";
import { leadSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Données invalides", details: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  await initDb();
  await insertLead({
    firstName: parsed.data.firstName,
    lastName: parsed.data.lastName,
    phone: parsed.data.phone,
    email: parsed.data.email.toLowerCase(),
    message: parsed.data.message ?? null,
  });

  return NextResponse.json({ ok: true });
}
