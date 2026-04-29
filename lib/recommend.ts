import {
  SIMULATORS,
  resolveIntensity,
  resolveZoneTier,
  type SimulatorConfig,
  type SimulatorId,
  type ZoneTier,
} from "./simulators";

export type Intensity = "leger" | "moyen" | "important";

export interface RecommendInput {
  /** Map { questionId → optionId } of all answers given so far. */
  answers: Record<string, string>;
}

export interface PrimaryQuote {
  simulator: SimulatorId;
  simulatorName: string;
  zoneTier: ZoneTier;
  zoneTierLabel: string;
  pricePerSession: number;
  cureSize: number;
  cureFreeSessions: number;
  cureTotal: number;       // catalog cure price
  /**
   * "single" → user wants/can afford only 1–2 sessions
   * "cure"   → cure recommended
   */
  mode: "single" | "cure";
  recommendedAmount: number; // pricePerSession (single) or cureTotal (cure)
}

export interface ComplementaryQuote {
  simulator: SimulatorId;
  simulatorName: string;
  reason: string;
  zoneTier: ZoneTier;
  zoneTierLabel: string;
  pricePerSession: number;
  cureSize: number;
  cureTotal: number;
}

export interface DuoOffer {
  applied: boolean;
  baseTotal: number;        // primary cure + complementary cure (no discount)
  discount: number;         // 40 % off the cheaper cure
  finalTotal: number;       // baseTotal - discount
  cheaperSimulator: SimulatorId;
}

export interface Recommendation {
  intensity: Intensity;
  primary: PrimaryQuote;
  complementary: ComplementaryQuote | null;
  duo: DuoOffer | null;
  /** Total to display as the "estimation personnalisée". */
  estimatedTotal: number;
  /** Plain-text protocol summary for storage. */
  protocolText: string;
  resultText: string;
  /** Human-readable summary of the answers (key→label). */
  answerLabels: Record<string, string>;
  /** Pretty label of the *primary* zone choice (or "—"). */
  zoneLabel: string;
  /** Pretty label of the goal/objective/need choice (or "—"). */
  goalLabel: string;
}

/* ───────── Helpers ───────── */

function answerLabel(sim: SimulatorConfig, qId: string, oId: string): string {
  const q = sim.questions.find((x) => x.id === qId);
  return q?.options.find((o) => o.id === oId)?.label ?? oId;
}

function buildAnswerLabels(
  sim: SimulatorConfig,
  answers: Record<string, string>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const q of sim.questions) {
    const a = answers[q.id];
    if (!a) continue;
    out[q.step] = answerLabel(sim, q.id, a);
  }
  return out;
}

/** Decide single vs cure based on intensity + budget tier (when present). */
function decideMode(
  sim: SimulatorConfig,
  answers: Record<string, string>,
  intensity: Intensity
): "single" | "cure" {
  // Adipologie has an explicit budget question
  const budgetQ = sim.questions.find((q) => q.id === "budget");
  if (budgetQ) {
    const opt = budgetQ.options.find((o) => o.id === answers[budgetQ.id]);
    const tier = (opt?.meta?.budgetTier as number) ?? 3;
    if (tier === 1) return "single"; // < 150 €
  }
  if (intensity === "leger") return "single";
  return "cure";
}

/** Suggests a complementary protocol (drives the duo offer). */
function suggestComplementary(
  primaryId: SimulatorId,
  answers: Record<string, string>
): { sim: SimulatorId; reason: string; tier: ZoneTier } | null {
  if (primaryId === "adipologie") {
    if (answers.cellulite === "oui") {
      return {
        sim: "pressotherapie",
        reason: "Drainage Pressothérapie pour traiter la cellulite en complément de la perte localisée.",
        tier: "medium",
      };
    }
    if (answers.sport === "non") {
      return {
        sim: "estheshape",
        reason: "Esthe Shape pour tonifier les muscles sous-jacents et renforcer le maintien.",
        tier: "medium",
      };
    }
  }

  if (primaryId === "estheshape") {
    if (
      answers.objective === "redessiner" ||
      answers.objective === "raffermir"
    ) {
      return {
        sim: "pressotherapie",
        reason: "Pressothérapie pour drainer et accentuer l'effet silhouette.",
        tier: answers.zone === "multi" ? "large" : "medium",
      };
    }
  }

  if (primaryId === "pressotherapie") {
    if (answers.objective === "silhouette" || answers.need === "affinement") {
      return {
        sim: "adipologie",
        reason: "Adipologie pour cibler les amas graisseux et accentuer l'affinement.",
        tier: "medium",
      };
    }
    if (answers.objective === "complement") {
      return {
        sim: "estheshape",
        reason: "Esthe Shape recommandé en complément pour la tonification.",
        tier: "medium",
      };
    }
  }

  return null;
}

/** Build the recommendation. */
export function recommend(
  sim: SimulatorConfig,
  { answers }: RecommendInput
): Recommendation {
  const intensity = resolveIntensity(sim, answers);
  const tier = resolveZoneTier(sim, answers);
  const tierPricing = sim.pricing[tier];

  const mode = decideMode(sim, answers, intensity);
  const primary: PrimaryQuote = {
    simulator: sim.id,
    simulatorName: sim.name,
    zoneTier: tier,
    zoneTierLabel: tierPricing.label,
    pricePerSession: tierPricing.pricePerSession,
    cureSize: tierPricing.cureSize,
    cureFreeSessions: tierPricing.cureFreeSessions ?? 0,
    cureTotal: tierPricing.cureTotal,
    mode,
    recommendedAmount: mode === "cure" ? tierPricing.cureTotal : tierPricing.pricePerSession,
  };

  // Complementary suggestion
  let complementary: ComplementaryQuote | null = null;
  let duo: DuoOffer | null = null;
  const sugg = suggestComplementary(sim.id, answers);
  if (sugg && mode === "cure") {
    const cSim = SIMULATORS[sugg.sim];
    const cPricing = cSim.pricing[sugg.tier];
    complementary = {
      simulator: cSim.id,
      simulatorName: cSim.name,
      reason: sugg.reason,
      zoneTier: sugg.tier,
      zoneTierLabel: cPricing.label,
      pricePerSession: cPricing.pricePerSession,
      cureSize: cPricing.cureSize,
      cureTotal: cPricing.cureTotal,
    };

    const baseTotal = primary.cureTotal + complementary.cureTotal;
    const cheaper = Math.min(primary.cureTotal, complementary.cureTotal);
    const discount = Math.round(cheaper * 0.4);
    duo = {
      applied: true,
      baseTotal,
      discount,
      finalTotal: baseTotal - discount,
      cheaperSimulator:
        primary.cureTotal <= complementary.cureTotal
          ? primary.simulator
          : complementary.simulator,
    };
  }

  const estimatedTotal = duo
    ? duo.finalTotal
    : primary.recommendedAmount;

  // Goal label (per simulator: which question represents "goal"?)
  const goalKey =
    sim.questions.find((q) =>
      ["objective", "need"].includes(q.id)
    )?.id ?? null;
  const goalLabel = goalKey ? answerLabel(sim, goalKey, answers[goalKey] ?? "") : "—";
  const zoneLabel = answerLabel(sim, "zone", answers.zone ?? "") || "—";

  const protocolText =
    mode === "cure"
      ? `Cure ${primary.zoneTierLabel.toLowerCase()} · ${primary.cureSize} séances · ${primary.cureTotal} €`
      : `Séance découverte ${primary.zoneTierLabel.toLowerCase()} · ${primary.pricePerSession} €`;

  return {
    intensity,
    primary,
    complementary,
    duo,
    estimatedTotal,
    protocolText,
    resultText: sim.expectedResult,
    answerLabels: buildAnswerLabels(sim, answers),
    zoneLabel,
    goalLabel,
  };
}
