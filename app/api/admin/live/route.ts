import { NextResponse } from "next/server";
import { getLiveStats } from "@/lib/presence";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(getLiveStats());
}
