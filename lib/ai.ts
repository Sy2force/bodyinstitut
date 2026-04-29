import "server-only";
import type { SimulatorConfig } from "./simulators";
import type { Recommendation } from "./recommend";

/**
 * Generates a personalized analysis sentence.
 * Uses OPENAI_API_KEY if set; otherwise a polished rule-based generator.
 *
 * Always returns a string — never throws.
 */

interface Input {
  sim: SimulatorConfig;
  rec: Recommendation;
  intensity: string | null;
  sport: string | null;
  notes?: string | null;
}

export async function generateAnalysis(input: Input): Promise<string> {
  const key = process.env.OPENAI_API_KEY;
  if (key) {
    try {
      const out = await callOpenAI(key, input);
      if (out && out.trim().length > 20) return out.trim();
    } catch (err) {
      console.warn("[ai] OpenAI failed, falling back:", err);
    }
  }
  return ruleBased(input);
}

function ruleBased({ sim, rec, intensity, sport, notes }: Input): string {
  const intensityCopy = {
    leger: "un programme d'entretien régulier",
    moyen: "un protocole de transformation visible",
    important: "une cure intensive engagée",
  } as const;
  const intensityLabel =
    intensity && intensity in intensityCopy
      ? intensityCopy[intensity as keyof typeof intensityCopy]
      : "un protocole équilibré";

  const sportLine =
    sport === "oui" || sport === "regulierement"
      ? "Votre activité sportive amplifiera l'efficacité du protocole et raccourcira le délai de résultats."
      : sport === "parfois"
      ? "Vos séances ponctuelles d'activité physique contribueront à stabiliser les résultats."
      : "Un accompagnement nutritionnel ciblé sera ajouté à votre suivi pour booster les résultats.";

  const noteLine =
    notes && notes.trim().length > 0
      ? `Vos précisions (« ${notes.trim().slice(0, 180)}${
          notes.trim().length > 180 ? "…" : ""
        } ») ont été intégrées au calibrage.`
      : "";

  const duoLine = rec.duo
    ? `Une combinaison ${rec.primary.simulatorName} + ${rec.complementary?.simulatorName} est recommandée — l'offre duo cures vous fait économiser ${rec.duo.discount} €.`
    : "";

  const protocolLine =
    rec.primary.mode === "cure"
      ? `Le protocole recommandé prévoit une cure de ${rec.primary.cureSize} séances ${rec.primary.zoneTierLabel.toLowerCase()} (${rec.primary.cureTotal} €) pour viser ${rec.resultText.toLowerCase()}.`
      : `Une séance découverte ${rec.primary.zoneTierLabel.toLowerCase()} à ${rec.primary.pricePerSession} € vous permettra d'évaluer la pertinence du protocole.`;

  return [
    `Votre profil indique un objectif "${rec.goalLabel.toLowerCase()}" sur la zone "${rec.zoneLabel.toLowerCase()}", traité par ${sim.name} en ${intensityLabel}.`,
    protocolLine,
    duoLine,
    sportLine,
    noteLine,
  ]
    .filter(Boolean)
    .join(" ");
}

async function callOpenAI(apiKey: string, input: Input): Promise<string> {
  const sys = `Tu es un coach esthétique pro, sobre, factuel. Tu produis 2 à 3 phrases en français, sans superlatifs creux, qui résument l'analyse personnalisée d'un client. Pas de markdown, pas d'emoji.`;
  const user = JSON.stringify({
    soin: input.sim.name,
    promesse: input.sim.promise,
    objectif: input.rec.goalLabel,
    zone: input.rec.zoneLabel,
    intensite: input.intensity,
    sport: input.sport,
    mode: input.rec.primary.mode,
    seances: input.rec.primary.cureSize,
    prix_cure: input.rec.primary.cureTotal,
    duo_recommande: input.rec.complementary?.simulatorName ?? null,
    duo_economie: input.rec.duo?.discount ?? null,
    resultat_attendu: input.rec.resultText,
    note_client: input.notes ?? null,
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.5,
      max_tokens: 220,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) throw new Error(`openai ${res.status}`);
  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
