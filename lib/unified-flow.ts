import type { QuestionOption, SimulatorId } from "./simulators";

/**
 * Unified funnel — single long-form page, 17+ questions grouped in sections.
 * ALL visible vertically, ALL must be answered before submit.
 *
 * 5 "routing" questions (objective, zone, intensity, lifestyle, budget) drive
 * the automatic pick of one Body Institut soin (Adipologie / Esthe Shape /
 * Pressothérapie). All other questions enrich the lead in SQLite.
 */

/* ══════════════════════════════════════════════════════════════════
   Types
   ══════════════════════════════════════════════════════════════════ */

export type FieldType =
  | "text"
  | "email"
  | "tel"
  | "number"
  | "options"
  | "textarea";

export type RoutingKey =
  | "objective"
  | "zone"
  | "intensity"
  | "lifestyle"
  | "budget";

export interface FormField {
  id: string;
  section: string;
  step: string;
  title: string;
  subtitle?: string;
  type: FieldType;
  required?: boolean;
  placeholder?: string;
  autocomplete?: string;
  min?: number;
  max?: number;
  unit?: string;
  options?: QuestionOption[];
  /** If set, this answer participates in simulator routing. */
  routing?: RoutingKey;
}

export interface UnifiedAnswers {
  // Contact
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  // Profile
  age?: string;
  sex?: string;
  height?: string;
  weight?: string;
  // Routing
  objective?: "perdre" | "raffermir" | "drainer";
  zone?: "ventre" | "cuisses" | "fessiers" | "bras" | "jambes" | "global";
  intensity?: "leger" | "moyen" | "important";
  lifestyle?: "sedentaire" | "occasionnel" | "regulier";
  budget?: "u150" | "150_350" | "350_700" | "o700";
  // Project
  timeframe?: "immediat" | "1_3mois" | "3_6mois" | "flexible";
  availability?: "matin" | "midi" | "soir" | "weekend";
  source?: "instagram" | "google" | "bouche_a_oreille" | "autre";
  // Free
  message?: string;
}

/* ══════════════════════════════════════════════════════════════════
   Sections & questions
   ══════════════════════════════════════════════════════════════════ */

export const UNIFIED_SECTIONS: { id: string; title: string; subtitle: string }[] =
  [
    {
      id: "contact",
      title: "Vos coordonnées",
      subtitle: "Pour vous recontacter et préparer votre bilan offert.",
    },
    {
      id: "profile",
      title: "Votre profil",
      subtitle: "Pour calibrer votre protocole personnalisé.",
    },
    {
      id: "goal",
      title: "Votre transformation",
      subtitle: "L'essentiel — ce que vous souhaitez obtenir.",
    },
    {
      id: "project",
      title: "Votre projet",
      subtitle: "Pour vous proposer le bon créneau et le bon accompagnement.",
    },
    {
      id: "message",
      title: "Un dernier mot",
      subtitle: "Optionnel — tout détail utile pour votre experte.",
    },
  ];

export const UNIFIED_FORM: FormField[] = [
  /* ─────────── 1. Contact ─────────── */
  {
    id: "firstName",
    section: "contact",
    step: "Prénom",
    title: "Prénom",
    type: "text",
    required: true,
    placeholder: "Camille",
    autocomplete: "given-name",
  },
  {
    id: "lastName",
    section: "contact",
    step: "Nom",
    title: "Nom",
    type: "text",
    required: true,
    placeholder: "Dupont",
    autocomplete: "family-name",
  },
  {
    id: "email",
    section: "contact",
    step: "Email",
    title: "Email",
    type: "email",
    required: true,
    placeholder: "vous@email.com",
    autocomplete: "email",
  },
  {
    id: "phone",
    section: "contact",
    step: "Téléphone",
    title: "Téléphone",
    type: "tel",
    required: true,
    placeholder: "06 12 34 56 78",
    autocomplete: "tel",
  },
  {
    id: "city",
    section: "contact",
    step: "Ville",
    title: "Ville",
    type: "text",
    required: true,
    placeholder: "Paris",
    autocomplete: "address-level2",
  },

  /* ─────────── 2. Profil ─────────── */
  {
    id: "age",
    section: "profile",
    step: "Âge",
    title: "Votre âge",
    type: "number",
    required: true,
    min: 15,
    max: 99,
    unit: "ans",
    placeholder: "30",
  },
  {
    id: "sex",
    section: "profile",
    step: "Genre",
    title: "Vous êtes…",
    type: "options",
    required: true,
    options: [
      { id: "femme", label: "Femme", emoji: "♀" },
      { id: "homme", label: "Homme", emoji: "♂" },
      { id: "autre", label: "Autre / ne souhaite pas préciser", emoji: "•" },
    ],
  },
  {
    id: "height",
    section: "profile",
    step: "Taille",
    title: "Votre taille",
    type: "number",
    required: true,
    min: 120,
    max: 230,
    unit: "cm",
    placeholder: "170",
  },
  {
    id: "weight",
    section: "profile",
    step: "Poids",
    title: "Votre poids",
    type: "number",
    required: true,
    min: 30,
    max: 220,
    unit: "kg",
    placeholder: "65",
  },

  /* ─────────── 3. Transformation (routing) ─────────── */
  {
    id: "objective",
    section: "goal",
    step: "Objectif",
    title: "Votre objectif principal",
    subtitle: "La priorité — on choisit votre soin en fonction.",
    type: "options",
    required: true,
    routing: "objective",
    options: [
      {
        id: "perdre",
        label: "Perdre des centimètres",
        sub: "Cibler les amas localisés",
      },
      {
        id: "raffermir",
        label: "Raffermir / tonifier",
        sub: "Redessiner la silhouette",
      },
      {
        id: "drainer",
        label: "Drainer / jambes légères",
        sub: "Soulager rétention et lourdeur",
      },
    ],
  },
  {
    id: "zone",
    section: "goal",
    step: "Zone",
    title: "La zone qui vous gêne le plus",
    subtitle: "Vous pourrez en ajouter d'autres avec votre experte.",
    type: "options",
    required: true,
    routing: "zone",
    options: [
      { id: "ventre", label: "Ventre" },
      { id: "cuisses", label: "Cuisses" },
      { id: "fessiers", label: "Fessiers" },
      { id: "bras", label: "Bras" },
      { id: "jambes", label: "Jambes", sub: "Pieds, mollets" },
      { id: "global", label: "Plusieurs zones", sub: "Effet global" },
    ],
  },
  {
    id: "intensity",
    section: "goal",
    step: "Intensité",
    title: "À quel point est-ce marqué ?",
    type: "options",
    required: true,
    routing: "intensity",
    options: [
      {
        id: "leger",
        label: "Léger",
        sub: "Un peu, on veut affiner",
        meta: { intensity: "leger" },
      },
      {
        id: "moyen",
        label: "Moyen",
        sub: "Visible, on veut transformer",
        meta: { intensity: "moyen" },
      },
      {
        id: "important",
        label: "Important",
        sub: "Marqué, on veut un vrai changement",
        meta: { intensity: "important" },
      },
    ],
  },
  {
    id: "lifestyle",
    section: "goal",
    step: "Mode de vie",
    title: "Niveau d'activité physique",
    subtitle: "Le sport accélère et stabilise les résultats.",
    type: "options",
    required: true,
    routing: "lifestyle",
    options: [
      { id: "sedentaire", label: "Plutôt sédentaire", sub: "Peu ou pas" },
      {
        id: "occasionnel",
        label: "Occasionnellement",
        sub: "Quelques fois par mois",
      },
      {
        id: "regulier",
        label: "Régulièrement",
        sub: "Plusieurs fois par semaine",
      },
    ],
  },
  {
    id: "budget",
    section: "goal",
    step: "Budget",
    title: "Budget envisagé",
    subtitle: "Pour caler la recommandation au plus juste.",
    type: "options",
    required: true,
    routing: "budget",
    options: [
      { id: "u150", label: "Moins de 150 €", sub: "Découverte 1–2 séances" },
      { id: "150_350", label: "150 – 350 €", sub: "Cure petite zone" },
      { id: "350_700", label: "350 – 700 €", sub: "Cure moyenne" },
      { id: "o700", label: "Plus de 700 €", sub: "Cure intensive ou duo" },
    ],
  },

  /* ─────────── 4. Projet ─────────── */
  {
    id: "timeframe",
    section: "project",
    step: "Délai",
    title: "Dans quel délai souhaitez-vous commencer ?",
    type: "options",
    required: true,
    options: [
      { id: "immediat", label: "Cette semaine", sub: "Je veux démarrer vite" },
      { id: "1_3mois", label: "Dans 1 à 3 mois" },
      { id: "3_6mois", label: "Dans 3 à 6 mois" },
      { id: "flexible", label: "Pas pressé(e)", sub: "On verra ensemble" },
    ],
  },
  {
    id: "availability",
    section: "project",
    step: "Disponibilité",
    title: "Votre créneau préféré",
    subtitle: "Quand peut-on vous rappeler ?",
    type: "options",
    required: true,
    options: [
      { id: "matin", label: "Matin", sub: "9h – 12h" },
      { id: "midi", label: "Midi", sub: "12h – 14h" },
      { id: "soir", label: "Après-midi / soir", sub: "14h – 19h" },
      { id: "weekend", label: "Weekend" },
    ],
  },
  {
    id: "source",
    section: "project",
    step: "Source",
    title: "Comment nous avez-vous connu(e) ?",
    type: "options",
    required: true,
    options: [
      { id: "instagram", label: "Instagram", sub: "Meta Ads, Reels" },
      { id: "google", label: "Google", sub: "Recherche ou Maps" },
      {
        id: "bouche_a_oreille",
        label: "Bouche-à-oreille",
        sub: "Amie, famille",
      },
      { id: "autre", label: "Autre" },
    ],
  },

  /* ─────────── 5. Message libre ─────────── */
  {
    id: "message",
    section: "message",
    step: "Message",
    title: "Un message pour votre experte ?",
    subtitle: "Optionnel — antécédent, précision, contrainte…",
    type: "textarea",
    required: false,
    placeholder: "Ex : j'ai déjà fait de la cryolipolyse il y a 2 ans…",
  },
];

/* Fast lookup of fields by section id */
export function fieldsBySection(id: string): FormField[] {
  return UNIFIED_FORM.filter((f) => f.section === id);
}

/* ══════════════════════════════════════════════════════════════════
   Simulator routing
   ══════════════════════════════════════════════════════════════════ */

export function pickRecommendedSimulator(a: UnifiedAnswers): SimulatorId {
  switch (a.objective) {
    case "drainer":
      return "pressotherapie";
    case "raffermir":
      return "estheshape";
    case "perdre":
    default:
      return "adipologie";
  }
}

/** Map unified answers → per-simulator answer schema for `recommend()`. */
export function mapToSimulatorAnswers(
  unified: UnifiedAnswers,
  simulator: SimulatorId
): Record<string, string> {
  const sportFromLifestyle = (() => {
    if (unified.lifestyle === "regulier") return "regulierement";
    if (unified.lifestyle === "occasionnel") return "parfois";
    return "jamais";
  })();

  const budget = unified.budget ?? "350_700";
  const intensity = unified.intensity ?? "moyen";

  if (simulator === "adipologie") {
    const zoneMap: Record<NonNullable<UnifiedAnswers["zone"]>, string> = {
      ventre: "ventre",
      cuisses: "cuisses_etendues",
      fessiers: "culotte",
      bras: "bras",
      jambes: "mollets",
      global: "ventre_etendu",
    };
    return {
      objective: intensity,
      zone: zoneMap[unified.zone ?? "ventre"],
      cellulite: unified.objective === "drainer" ? "oui" : "non",
      sport: unified.lifestyle === "regulier" ? "oui" : "non",
      budget,
    };
  }

  if (simulator === "estheshape") {
    const zoneMap: Record<NonNullable<UnifiedAnswers["zone"]>, string> = {
      ventre: "ventre",
      cuisses: "cuisses",
      fessiers: "fessiers",
      bras: "multi",
      jambes: "multi",
      global: "multi",
    };
    return {
      zone: zoneMap[unified.zone ?? "ventre"],
      objective: "raffermir",
      level: intensity,
      sport: sportFromLifestyle,
    };
  }

  // pressotherapie
  const zoneTierMap: Record<NonNullable<UnifiedAnswers["zone"]>, string> = {
    ventre: "moyenne",
    cuisses: "moyenne",
    fessiers: "moyenne",
    bras: "petite",
    jambes: "moyenne",
    global: "grande",
  };
  return {
    need: unified.objective === "drainer" ? "drainage" : "affinement",
    zone: zoneTierMap[unified.zone ?? "jambes"],
    frequency:
      intensity === "leger"
        ? "occasionnel"
        : intensity === "moyen"
          ? "regulier"
          : "frequent",
    objective: unified.objective === "drainer" ? "drainage" : "silhouette",
  };
}

/** Human-readable labels of routing answers for storage / debug. */
export function unifiedAnswerLabels(a: UnifiedAnswers): Record<string, string> {
  const out: Record<string, string> = {};
  for (const f of UNIFIED_FORM) {
    if (!f.routing || !f.options) continue;
    const v = (a as Record<string, string | undefined>)[f.id];
    if (!v) continue;
    const opt = f.options.find((o) => o.id === v);
    if (opt) out[f.step] = opt.label;
  }
  return out;
}
