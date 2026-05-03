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
      id: "goal",
      title: "Votre objectif de transformation",
      subtitle: "Définissons ensemble votre priorité pour personnaliser votre bilan.",
    },
    {
      id: "profile",
      title: "Votre profil physique",
      subtitle: "Ces données nous permettent de calibrer précisément votre protocole.",
    },
    {
      id: "contact",
      title: "Vos coordonnées",
      subtitle: "Pour vous envoyer votre analyse personnalisée et vous rappeler.",
    },
    {
      id: "project",
      title: "Votre projet",
      subtitle: "Afin de vous proposer le meilleur créneau pour votre bilan téléphonique.",
    },
    {
      id: "message",
      title: "Informations complémentaires",
      subtitle: "Optionnel — antécédents, contraintes spécifiques ou questions pour votre experte.",
    },
  ];

export const UNIFIED_FORM: FormField[] = [
  /* ─────────── 1. Contact ─────────── */
  {
    id: "firstName",
    section: "contact",
    step: "Identité",
    title: "Votre prénom",
    type: "text",
    required: true,
    placeholder: "Marie",
    autocomplete: "given-name",
  },
  {
    id: "lastName",
    section: "contact",
    step: "Identité",
    title: "Votre nom",
    type: "text",
    required: true,
    placeholder: "Martin",
    autocomplete: "family-name",
  },
  {
    id: "email",
    section: "contact",
    step: "Contact",
    title: "Votre email",
    subtitle: "Pour recevoir votre bilan complet",
    type: "email",
    required: true,
    placeholder: "marie.martin@email.com",
    autocomplete: "email",
  },
  {
    id: "phone",
    section: "contact",
    step: "Contact",
    title: "Votre téléphone",
    subtitle: "Pour votre appel bilan personnalisé",
    type: "tel",
    required: true,
    placeholder: "06 12 34 56 78",
    autocomplete: "tel",
  },
  {
    id: "city",
    section: "contact",
    step: "Localisation",
    title: "Votre ville",
    type: "text",
    required: true,
    placeholder: "Lyon",
    autocomplete: "address-level2",
  },

  /* ─────────── 2. Profil ─────────── */
  {
    id: "age",
    section: "profile",
    step: "Profil",
    title: "Votre âge",
    type: "number",
    required: true,
    min: 15,
    max: 99,
    unit: "ans",
    placeholder: "35",
  },
  {
    id: "sex",
    section: "profile",
    step: "Profil",
    title: "Vous êtes",
    type: "options",
    required: true,
    options: [
      { id: "femme", label: "Une femme" },
      { id: "homme", label: "Un homme" },
      { id: "autre", label: "Autre" },
    ],
  },
  {
    id: "height",
    section: "profile",
    step: "Mensurations",
    title: "Votre taille",
    type: "number",
    required: true,
    min: 120,
    max: 230,
    unit: "cm",
    placeholder: "165",
  },
  {
    id: "weight",
    section: "profile",
    step: "Mensurations",
    title: "Votre poids",
    type: "number",
    required: true,
    min: 30,
    max: 220,
    unit: "kg",
    placeholder: "62",
  },

  /* ─────────── 3. Transformation (routing) ─────────── */
  {
    id: "objective",
    section: "goal",
    step: "Priorité",
    title: "Quel est votre objectif principal ?",
    subtitle: "On adapte le protocole en fonction de votre besoin n°1",
    type: "options",
    required: true,
    routing: "objective",
    options: [
      {
        id: "perdre",
        label: "Perdre des centimètres",
        sub: "Cibler les graisses localisées",
      },
      {
        id: "raffermir",
        label: "Raffermir & tonifier",
        sub: "Redessiner la silhouette",
      },
      {
        id: "drainer",
        label: "Drainer & jambes légères",
        sub: "Soulager la rétention d'eau",
      },
    ],
  },
  {
    id: "zone",
    section: "goal",
    step: "Zone cible",
    title: "Quelle zone vous préoccupe le plus ?",
    subtitle: "Vous pourrez en ajouter d'autres lors de votre appel bilan",
    type: "options",
    required: true,
    routing: "zone",
    options: [
      { id: "ventre", label: "Ventre" },
      { id: "cuisses", label: "Cuisses" },
      { id: "fessiers", label: "Fessiers" },
      { id: "bras", label: "Bras" },
      { id: "jambes", label: "Jambes / Mollets" },
      { id: "global", label: "Plusieurs zones", sub: "Transformation globale" },
    ],
  },
  {
    id: "intensity",
    section: "goal",
    step: "Évaluation",
    title: "À quel point la zone est-elle marquée ?",
    type: "options",
    required: true,
    routing: "intensity",
    options: [
      {
        id: "leger",
        label: "Léger",
        sub: "À peine visible, affinage léger",
        meta: { intensity: "leger" },
      },
      {
        id: "moyen",
        label: "Moyen",
        sub: "Visible, transformation souhaitée",
        meta: { intensity: "moyen" },
      },
      {
        id: "important",
        label: "Marqué",
        sub: "Bien visible, vrai changement recherché",
        meta: { intensity: "important" },
      },
    ],
  },
  {
    id: "lifestyle",
    section: "goal",
    step: "Activité",
    title: "Votre niveau d'activité physique",
    subtitle: "Pour affiner la fréquence des séances recommandées",
    type: "options",
    required: true,
    routing: "lifestyle",
    options: [
      { id: "sedentaire", label: "Sédentaire", sub: "Peu ou pas d'activité" },
      {
        id: "occasionnel",
        label: "Occasionnel",
        sub: "1-2 fois par semaine",
      },
      {
        id: "regulier",
        label: "Actif",
        sub: "3+ fois par semaine",
      },
    ],
  },
  {
    id: "budget",
    section: "goal",
    step: "Budget",
    title: "Quel budget souhaitez-vous investir ?",
    subtitle: "Pour une recommandation tarifaire adaptée",
    type: "options",
    required: true,
    routing: "budget",
    options: [
      { id: "u150", label: "Moins de 150 €", sub: "Découverte - 1 à 2 séances" },
      { id: "150_350", label: "150 – 350 €", sub: "Cure courte - petite zone" },
      { id: "350_700", label: "350 – 700 €", sub: "Cure complète - moyenne zone" },
      { id: "o700", label: "Plus de 700 €", sub: "Cure intensive / plusieurs zones" },
    ],
  },

  /* ─────────── 4. Projet ─────────── */
  {
    id: "timeframe",
    section: "project",
    step: "Planning",
    title: "Quand souhaitez-vous démarrer ?",
    type: "options",
    required: true,
    options: [
      { id: "immediat", label: "Cette semaine", sub: "Démarrage rapide souhaité" },
      { id: "1_3mois", label: "Dans 1 à 3 mois", sub: "Projet à moyen terme" },
      { id: "3_6mois", label: "Dans 3 à 6 mois", sub: "Objectif future" },
      { id: "flexible", label: "Flexible", sub: "Selon les disponibilités" },
    ],
  },
  {
    id: "availability",
    section: "project",
    step: "Créneau",
    title: "Quel créneau pour votre appel bilan ?",
    subtitle: "Votre experte vous appellera pour affiner votre programme",
    type: "options",
    required: true,
    options: [
      { id: "matin", label: "Matin", sub: "9h – 12h" },
      { id: "midi", label: "Midi", sub: "12h – 14h" },
      { id: "soir", label: "Après-midi / Soir", sub: "14h – 19h" },
      { id: "weekend", label: "Week-end", sub: "Samedi uniquement" },
    ],
  },
  {
    id: "source",
    section: "project",
    step: "Source",
    title: "Comment avez-vous connu Body Institut ?",
    type: "options",
    required: true,
    options: [
      { id: "instagram", label: "Instagram / Facebook" },
      { id: "google", label: "Google" },
      { id: "bouche_a_oreille", label: "Bouche-à-oreille", sub: "Conseil d'une proche" },
      { id: "autre", label: "Autre" },
    ],
  },

  /* ─────────── 5. Message libre ─────────── */
  {
    id: "message",
    section: "message",
    step: "Détails",
    title: "Un détail à partager avec votre experte ?",
    subtitle: "Optionnel — antécédents médicaux, contraintes, questions...",
    type: "textarea",
    required: false,
    placeholder: "Ex : J'ai déjà fait de la cryolipolyse il y a 2 ans, j'ai une cicatrice sur la zone ciblée...",
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
