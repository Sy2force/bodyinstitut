import { listLeads, type LeadStatus } from "@/lib/db";
import { escapeCsv } from "@/lib/validation";

export const runtime = "nodejs";

const HEADERS = [
  "Date",
  "Prénom",
  "Nom",
  "Email",
  "Téléphone",
  "Ville",
  "Âge",
  "Sexe",
  "Taille (cm)",
  "Poids (kg)",
  "Objectif",
  "Zone",
  "Intensité",
  "Sport",
  "Cellulite",
  "Budget client",
  "Simulateur",
  "Soin recommandé",
  "Prix séance",
  "Prix cure",
  "Prix total estimé",
  "Offre duo",
  "Soin complémentaire",
  "Disponibilités",
  "Démarrage",
  "Source",
  "Message",
  "Statut",
  "Analyse",
  "ID",
];

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;

  const { rows } = await listLeads({
    q: sp.get("q") ?? undefined,
    status: (sp.get("status") as LeadStatus | "all" | null) ?? undefined,
    simulator: sp.get("simulator") ?? undefined,
    minBudget: sp.get("minBudget") ? Number(sp.get("minBudget")) : undefined,
    maxBudget: sp.get("maxBudget") ? Number(sp.get("maxBudget")) : undefined,
    from: sp.get("from") ?? undefined,
    to: sp.get("to") ?? undefined,
    limit: 500,
  });

  const lines: string[] = [HEADERS.map(escapeCsv).join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.created_at,
        r.first_name,
        r.last_name,
        r.email,
        r.phone,
        r.city ?? "",
        r.age ?? "",
        r.sex ?? "",
        r.height_cm ?? "",
        r.weight_kg ?? "",
        r.goal,
        r.zone,
        r.intensity ?? "",
        r.sport ?? "",
        r.cellulite ?? "",
        r.budget_client ?? "",
        r.simulator,
        r.protocol ?? "",
        r.price_session ?? "",
        r.price_cure ?? "",
        r.price_total ?? "",
        r.duo_applied ? "oui" : "non",
        r.complementary_simulator ?? "",
        r.availability ?? "",
        r.timeframe ?? "",
        r.source ?? "",
        (r.message ?? "").replace(/\s+/g, " "),
        r.status,
        (r.analysis ?? "").replace(/\s+/g, " "),
        r.id,
      ]
        .map(escapeCsv)
        .join(",")
    );
  }

  const body = "\uFEFF" + lines.join("\n") + "\n"; // BOM for Excel
  const filename = `body-institut-leads-${new Date()
    .toISOString()
    .slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
