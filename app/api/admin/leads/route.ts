import { NextResponse } from "next/server";
import { listLeads } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const leads = await listLeads();
  return NextResponse.json({ leads });
}
