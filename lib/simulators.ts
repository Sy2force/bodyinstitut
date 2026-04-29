export type SimulatorId = "adipologie" | "estheshape" | "pressotherapie";

export type ZoneTier = "small" | "medium" | "large";

export interface PricingTier {
  pricePerSession: number;
  cureSize: number;        // total sessions in a cure
  cureFreeSessions?: number; // sessions offered (e.g. Esthe Shape: 1 free in 6)
  cureTotal: number;       // amount actually charged for the cure
  label: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  sub?: string;
  emoji?: string;
  /** Optional metadata used by the recommendation engine (e.g. zoneTier mapping). */
  meta?: Record<string, string | number | boolean>;
}

export interface Question {
  id: string;          // e.g. "zone", "objective", "cellulite", ...
  step: string;        // short label for the progress bar / heading eyebrow
  title: string;
  subtitle: string;
  options: QuestionOption[];
}

export interface SimulatorConfig {
  id: SimulatorId;
  name: string;
  tagline: string;
  promise: string;
  description: string;
  accent: string;
  glow: string;
  hue: string;
  stat: { value: string; unit: string; label: string };
  benefits: string[];
  image: string;
  expectedResult: string;

  /** Tiered pricing keyed by ZoneTier. */
  pricing: Record<ZoneTier, PricingTier>;
  /** Default tier when no zone choice maps explicitly to a tier. */
  defaultTier: ZoneTier;

  /** The question wizard — one screen per question. */
  questions: Question[];
}

/* ────────────────────────────────────────────────────────────
   Simulator catalog — based on real Body Institut pricing.
   Each `meta.tier` on a zone option drives which pricing tier applies.
   ──────────────────────────────────────────────────────────── */

export const SIMULATORS: Record<SimulatorId, SimulatorConfig> = {
  /* ───────────── ADIPOLOGIE ───────────── */
  adipologie: {
    id: "adipologie",
    name: "Adipologie",
    tagline: "Perdre des centimètres",
    promise: "Réduction localisée de la masse adipeuse",
    description:
      "Une technologie de cryolipolyse qui cible et élimine les amas graisseux résistants, sans chirurgie, sans éviction sociale.",
    accent: "text-brand-600",
    glow: "#27b4ab",
    hue: "from-brand-500/30 via-brand-500/10 to-transparent",
    stat: { value: "−6", unit: "cm", label: "en cure complète" },
    benefits: [
      "Ciblage précis des amas graisseux",
      "Sans chirurgie, sans douleur",
      "Résultats visibles dès la 3ᵉ séance",
    ],
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=1600&q=80",
    expectedResult: "−4 à −6 cm sur la zone ciblée",
    pricing: {
      small:  { pricePerSession: 70,  cureSize: 5, cureTotal: 350, label: "Petite zone"  },
      medium: { pricePerSession: 105, cureSize: 5, cureTotal: 525, label: "Zone moyenne" },
      large:  { pricePerSession: 140, cureSize: 5, cureTotal: 700, label: "Grande zone"  },
    },
    defaultTier: "medium",
    questions: [
      {
        id: "objective",
        step: "Objectif",
        title: "Quel est votre objectif principal ?",
        subtitle: "Plus l'objectif est marqué, plus la cure est intensive.",
        options: [
          { id: "leger",     label: "Léger",     sub: "Affiner subtilement",      emoji: "🍃",
            meta: { intensity: "leger" } },
          { id: "moyen",     label: "Moyen",     sub: "Transformation visible",   emoji: "✨",
            meta: { intensity: "moyen" } },
          { id: "important", label: "Important", sub: "Résultats marqués",        emoji: "🔥",
            meta: { intensity: "important" } },
        ],
      },
      {
        id: "zone",
        step: "Zone",
        title: "Quelle zone souhaitez-vous traiter ?",
        subtitle: "La taille de la zone détermine la durée et le tarif d'une séance.",
        options: [
          {
            id: "bras",     label: "Bras",     sub: "Petite zone",  emoji: "💪",
            meta: { tier: "small" },
          },
          {
            id: "genoux",   label: "Genoux",   sub: "Petite zone",  emoji: "🦵",
            meta: { tier: "small" },
          },
          {
            id: "ventre",   label: "Ventre",   sub: "Zone moyenne", emoji: "🎯",
            meta: { tier: "medium" },
          },
          {
            id: "poignees", label: "Poignées d'amour", sub: "Zone moyenne", emoji: "🌀",
            meta: { tier: "medium" },
          },
          {
            id: "interieur_cuisses", label: "Intérieur cuisses", sub: "Zone moyenne", emoji: "🦵",
            meta: { tier: "medium" },
          },
          {
            id: "culotte", label: "Culotte de cheval", sub: "Zone moyenne", emoji: "📐",
            meta: { tier: "medium" },
          },
          {
            id: "mollets", label: "Mollets", sub: "Zone moyenne", emoji: "👟",
            meta: { tier: "medium" },
          },
          {
            id: "cuisses_etendues", label: "Cuisses entières", sub: "Grande zone", emoji: "🦵",
            meta: { tier: "large" },
          },
          {
            id: "ventre_etendu", label: "Ventre étendu", sub: "Grande zone", emoji: "🎯",
            meta: { tier: "large" },
          },
        ],
      },
      {
        id: "cellulite",
        step: "Cellulite",
        title: "Avez-vous de la cellulite sur la zone ?",
        subtitle: "Si oui, nous combinerons drainage et perte localisée.",
        options: [
          { id: "oui", label: "Oui",  sub: "Drainage conseillé en complément", emoji: "💧" },
          { id: "non", label: "Non",  sub: "On reste sur la perte localisée",  emoji: "🎯" },
        ],
      },
      {
        id: "sport",
        step: "Mode de vie",
        title: "Pratiquez-vous une activité sportive ?",
        subtitle: "Le sport accélère et stabilise les résultats.",
        options: [
          { id: "oui", label: "Oui, régulièrement", sub: "Effet protocole + sport amplifié", emoji: "🏃" },
          { id: "non", label: "Non, peu ou pas",    sub: "Conseils nutrition inclus",        emoji: "🛋️" },
        ],
      },
      {
        id: "budget",
        step: "Budget",
        title: "Quel budget envisagez-vous ?",
        subtitle: "Pour caler la recommandation séance ou cure.",
        options: [
          { id: "u150",   label: "Moins de 150 €", sub: "Découverte 1–2 séances", emoji: "🟢",
            meta: { budgetTier: 1 } },
          { id: "150_350",label: "150 – 350 €",    sub: "Cure petite zone",       emoji: "🟡",
            meta: { budgetTier: 2 } },
          { id: "350_700",label: "350 – 700 €",    sub: "Cure moyenne / grande",  emoji: "🟠",
            meta: { budgetTier: 3 } },
          { id: "o700",   label: "Plus de 700 €",  sub: "Cure intensive ou duo",  emoji: "🔴",
            meta: { budgetTier: 4 } },
        ],
      },
    ],
  },

  /* ───────────── ESTHE SHAPE ───────────── */
  estheshape: {
    id: "estheshape",
    name: "Esthe Shape",
    tagline: "Raffermir et tonifier",
    promise: "Tonification musculaire et fermeté de la peau",
    description:
      "Électrostimulation profonde et radiofréquence pour redensifier, raffermir et redessiner la silhouette.",
    accent: "text-forest-700",
    glow: "#155c58",
    hue: "from-forest-500/30 via-forest-500/10 to-transparent",
    stat: { value: "+25", unit: "%", label: "fermeté en 6 séances" },
    benefits: [
      "Stimulation musculaire profonde",
      "Effet lifting non invasif",
      "Peau visiblement raffermie",
    ],
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=1600&q=80",
    expectedResult: "Silhouette tonique, peau raffermie, meilleur maintien",
    pricing: {
      // Esthe Shape — tarif unique : 70 €/séance, cure 6 dont 1 offerte → 350 €
      small:  { pricePerSession: 70, cureSize: 6, cureFreeSessions: 1, cureTotal: 350, label: "Cure découverte" },
      medium: { pricePerSession: 70, cureSize: 6, cureFreeSessions: 1, cureTotal: 350, label: "Cure tonification" },
      large:  { pricePerSession: 70, cureSize: 6, cureFreeSessions: 1, cureTotal: 350, label: "Cure transformation" },
    },
    defaultTier: "medium",
    questions: [
      {
        id: "zone",
        step: "Zone",
        title: "Quelle zone souhaitez-vous traiter ?",
        subtitle: "Une zone précise ou plusieurs pour un effet global.",
        options: [
          { id: "ventre",   label: "Ventre",       emoji: "🎯",  meta: { tier: "small"  } },
          { id: "fessiers", label: "Fessiers",     emoji: "🍑",  meta: { tier: "small"  } },
          { id: "cuisses",  label: "Cuisses",      emoji: "🦵",  meta: { tier: "medium" } },
          { id: "multi",    label: "Plusieurs zones", sub: "Effet global", emoji: "✨",
            meta: { tier: "large" } },
        ],
      },
      {
        id: "objective",
        step: "Objectif",
        title: "Quel est votre objectif ?",
        subtitle: "Le programme sera calibré sur votre intention.",
        options: [
          { id: "raffermir",  label: "Raffermir",                    emoji: "💎" },
          { id: "tonifier",   label: "Tonifier",                     emoji: "💪" },
          { id: "redessiner", label: "Redessiner la silhouette",     emoji: "✨" },
          { id: "relancer",   label: "Relancer une activité sportive", emoji: "⚡️" },
        ],
      },
      {
        id: "level",
        step: "Niveau",
        title: "Niveau d'intensité souhaité ?",
        subtitle: "Plus le niveau est élevé, plus le travail musculaire est profond.",
        options: [
          { id: "leger",     label: "Léger",     sub: "Confort & entretien",     emoji: "🍃",
            meta: { intensity: "leger" } },
          { id: "moyen",     label: "Moyen",     sub: "Tonification visible",    emoji: "✨",
            meta: { intensity: "moyen" } },
          { id: "important", label: "Important", sub: "Sculpture musculaire",    emoji: "🔥",
            meta: { intensity: "important" } },
        ],
      },
      {
        id: "sport",
        step: "Mode de vie",
        title: "Pratiquez-vous une activité sportive ?",
        subtitle: "Esthe Shape complète idéalement votre routine.",
        options: [
          { id: "jamais",        label: "Jamais",        sub: "On démarre en douceur",   emoji: "🛋️" },
          { id: "parfois",       label: "Parfois",       sub: "Renforcement bienvenu",   emoji: "🚶" },
          { id: "regulierement", label: "Régulièrement", sub: "Boost de performance",    emoji: "🏃" },
        ],
      },
    ],
  },

  /* ───────────── PRESSOTHÉRAPIE ───────────── */
  pressotherapie: {
    id: "pressotherapie",
    name: "Pressothérapie",
    tagline: "Drainage & légèreté",
    promise: "Drainage lymphatique, jambes légères, silhouette affinée",
    description:
      "Une compression séquentielle douce qui relance la circulation, draine les toxines et apaise instantanément les jambes lourdes.",
    accent: "text-brand-500",
    glow: "#4dcac1",
    hue: "from-brand-400/30 via-brand-400/10 to-transparent",
    stat: { value: "−2", unit: "kg", label: "d'eau retenue (cure)" },
    benefits: [
      "Sensation de légèreté immédiate",
      "Réduction de la rétention d'eau",
      "Récupération musculaire optimisée",
    ],
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1600&q=80",
    expectedResult: "Jambes plus légères, silhouette drainée, sensation de bien-être",
    pricing: {
      small:  { pricePerSession: 25, cureSize: 5, cureTotal: 125, label: "Petite zone"  },
      medium: { pricePerSession: 30, cureSize: 5, cureTotal: 150, label: "Zone moyenne" },
      large:  { pricePerSession: 45, cureSize: 5, cureTotal: 225, label: "Grande zone"  },
    },
    defaultTier: "medium",
    questions: [
      {
        id: "need",
        step: "Besoin",
        title: "Quel est votre besoin principal ?",
        subtitle: "Une seule réponse — la plus représentative.",
        options: [
          { id: "lourdes",    label: "Jambes lourdes",         emoji: "🌊" },
          { id: "retention",  label: "Rétention d'eau",        emoji: "💧" },
          { id: "recup",      label: "Récupération sportive",  emoji: "⚡️" },
          { id: "drainage",   label: "Drainage général",       emoji: "🍃" },
          { id: "affinement", label: "Affinement de silhouette", emoji: "✨" },
        ],
      },
      {
        id: "zone",
        step: "Zone",
        title: "Quelle zone à traiter ?",
        subtitle: "La taille de la zone détermine le tarif.",
        options: [
          { id: "petite",  label: "Petite zone",  sub: "Bras ou abdomen seul",   emoji: "🟢",
            meta: { tier: "small"  } },
          { id: "moyenne", label: "Zone moyenne", sub: "Jambes ou ventre",        emoji: "🟡",
            meta: { tier: "medium" } },
          { id: "grande",  label: "Grande zone",  sub: "Jambes + ventre + bras",  emoji: "🔴",
            meta: { tier: "large"  } },
        ],
      },
      {
        id: "frequency",
        step: "Symptômes",
        title: "À quelle fréquence ressentez-vous ces symptômes ?",
        subtitle: "Cela calibre l'intensité de la cure.",
        options: [
          { id: "occasionnel", label: "Occasionnel", sub: "Surtout en été",       emoji: "🍃",
            meta: { intensity: "leger" } },
          { id: "regulier",    label: "Régulier",    sub: "Plusieurs fois/mois",  emoji: "🌊",
            meta: { intensity: "moyen" } },
          { id: "frequent",    label: "Fréquent",    sub: "Quotidien",            emoji: "🔥",
            meta: { intensity: "important" } },
        ],
      },
      {
        id: "objective",
        step: "Objectif",
        title: "Quel est votre objectif final ?",
        subtitle: "Pour orienter la recommandation finale.",
        options: [
          { id: "confort",    label: "Confort au quotidien",     emoji: "💚" },
          { id: "drainage",   label: "Drainage marqué",          emoji: "💧" },
          { id: "silhouette", label: "Silhouette affinée",       emoji: "✨" },
          { id: "complement", label: "Complément d'une cure",    emoji: "➕" },
        ],
      },
    ],
  },
};

export const SIMULATOR_LIST = Object.values(SIMULATORS);

export function isSimulatorId(value: string): value is SimulatorId {
  return value in SIMULATORS;
}

/** Returns the question for a simulator + answers, identifying any zone tier choice. */
export function resolveZoneTier(
  sim: SimulatorConfig,
  answers: Record<string, string>
): ZoneTier {
  const zoneQ = sim.questions.find((q) => q.id === "zone");
  if (zoneQ) {
    const opt = zoneQ.options.find((o) => o.id === answers[zoneQ.id]);
    const tier = opt?.meta?.tier as ZoneTier | undefined;
    if (tier) return tier;
  }
  return sim.defaultTier;
}

/** Returns the intensity level for a simulator + answers (leger | moyen | important). */
export function resolveIntensity(
  sim: SimulatorConfig,
  answers: Record<string, string>
): "leger" | "moyen" | "important" {
  for (const q of sim.questions) {
    const opt = q.options.find((o) => o.id === answers[q.id]);
    const intensity = opt?.meta?.intensity as
      | "leger"
      | "moyen"
      | "important"
      | undefined;
    if (intensity) return intensity;
  }
  return "moyen";
}
