import { NextResponse } from "next/server";
import { getLead, updateLeadSimulation } from "@/lib/db";
import { leadCompleteSchema } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  SIMULATORS,
  isSimulatorId,
  resolveIntensity,
} from "@/lib/simulators";
import {
  pickRecommendedSimulator,
  mapToSimulatorAnswers,
  type UnifiedAnswers,
} from "@/lib/unified-flow";
import { recommend } from "@/lib/recommend";
import { generateAnalysis } from "@/lib/ai";
import {
  sendConfirmationEmail,
  sendAdminNotificationEmail,
} from "@/lib/email";

export const runtime = "nodejs";

/**
 * Step 2 — enrich a previously-started lead with the simulator answers.
 *
 * Flow:
 *  - If `simulator` is "auto" (default), we read unified answers and pick the
 *    best Body Institut soin via lib/unified-flow.ts, then map answers to that
 *    simulator's schema before computing the recommendation.
 *  - If `simulator` is a known id (legacy), we use the answers as-is.
 */
export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const rl = rateLimit(`lead-complete:${ip}`, { max: 10, windowMs: 60_000 });
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

    const parsed = leadCompleteSchema.safeParse(json);
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

    const existing = getLead(d.id);
    if (!existing) {
      return NextResponse.json({ error: "Lead introuvable" }, { status: 404 });
    }

    const rawAnswers = (d.answers || {}) as Record<string, string>;

    // Decide which simulator to run
    let simulatorId: ReturnType<typeof pickRecommendedSimulator>;
    let simAnswers: Record<string, string>;
    let unifiedBudgetLabel: string | null = null;

    if (d.simulator === "auto" || !isSimulatorId(d.simulator)) {
      // Unified flow — pick + map.
      const unified = rawAnswers as UnifiedAnswers;
      simulatorId = pickRecommendedSimulator(unified);
      simAnswers = mapToSimulatorAnswers(unified, simulatorId);

      // Translate unified budget id → human label for storage
      const budgetMap: Record<string, string> = {
        u150: "Moins de 150 €",
        "150_350": "150 – 350 €",
        "350_700": "350 – 700 €",
        o700: "Plus de 700 €",
      };
      if (unified.budget) unifiedBudgetLabel = budgetMap[unified.budget] ?? null;
    } else {
      simulatorId = d.simulator;
      simAnswers = rawAnswers;
    }

    const sim = SIMULATORS[simulatorId];

    // Server-side recommendation — never trust the client.
    const rec = recommend(sim, { answers: simAnswers });
    const intensity = resolveIntensity(sim, simAnswers);

    const sport = simAnswers.sport ?? null;
    const cellulite = simAnswers.cellulite ?? null;
    const budgetClient =
      unifiedBudgetLabel ??
      (simAnswers.budget
        ? sim.questions
            .find((q) => q.id === "budget")
            ?.options.find((o) => o.id === simAnswers.budget)?.label ?? null
        : null);

    const analysis = await generateAnalysis({
      sim,
      rec,
      intensity,
      sport,
      notes: d.message || null,
    });

    // Extract project-level answers (non-routing)
    const projectFields = {
      timeframe: (rawAnswers.timeframe as string) || null,
      availability: (rawAnswers.availability as string) || null,
      source: (rawAnswers.source as string) || null,
      message: d.message || (rawAnswers.message as string) || null,
    };

    const lead = updateLeadSimulation(d.id, {
      goal: rec.goalLabel,
      zone: rec.zoneLabel,
      zoneTier: rec.primary.zoneTier,
      intensity,
      sport,
      cellulite,
      budgetClient,
      timeframe: projectFields.timeframe,
      availability: projectFields.availability,
      source: projectFields.source,
      message: projectFields.message,
      mode: rec.primary.mode,
      priceSession: rec.primary.pricePerSession,
      priceCure: rec.primary.cureTotal,
      priceTotal: rec.estimatedTotal,
      duoApplied: !!rec.duo,
      complementarySimulator: rec.complementary?.simulatorName ?? null,
      complementaryReason: rec.complementary?.reason ?? null,
      protocol: rec.protocolText,
      result: rec.resultText,
      analysis,
      aiNotes: d.message || null,
    });

    if (!lead) {
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    // Persist the picked simulator name on the lead row (so admin filter works)
    try {
      const { db } = await import("@/lib/db");
      db.prepare(
        `UPDATE leads SET simulator = ?, simulator_id = ? WHERE id = ?`
      ).run(sim.name, sim.id, d.id);
    } catch (e) {
      console.error("[leads/complete] simulator label update failed", e);
    }

    // Fire & forget
    sendConfirmationEmail({ lead }).catch((e) =>
      console.error("[leads/complete] confirmation email failed", e)
    );
    sendAdminNotificationEmail({ lead, recommendation: rec }).catch((e) =>
      console.error("[leads/complete] admin email failed", e)
    );

    return NextResponse.json({
      ok: true,
      id: d.id,
      simulator: { id: sim.id, name: sim.name },
      recommendation: rec,
      analysis,
    });
  } catch (err) {
    console.error("/api/leads/complete error", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
