import { listLeads } from "@/lib/db";
import { escapeCsv } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const HEADERS = ["Date", "Prénom", "Nom", "Téléphone", "Email", "Message", "Statut", "ID"];

export async function GET() {
  const leads = await listLeads();

  const lines: string[] = [HEADERS.map(escapeCsv).join(",")];
  for (const r of leads) {
    lines.push(
      [
        r.created_at,
        r.first_name,
        r.last_name,
        r.phone,
        r.email,
        (r.message ?? "").replace(/\s+/g, " "),
        r.status,
        r.id,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const body = "\uFEFF" + lines.join("\n") + "\n";
  const filename = `body-institut-leads-${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
