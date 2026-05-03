/**
 * Pure types — safe to import from both server and client.
 */

export type LeadStatus =
  | "nouveau"
  | "a_rappeler"
  | "contacte"
  | "rdv_pris"
  | "converti"
  | "perdu";

export const LEAD_STATUSES: LeadStatus[] = [
  "nouveau",
  "a_rappeler",
  "contacte",
  "rdv_pris",
  "converti",
  "perdu",
];

export interface LeadRecord {
  id: string;
  created_at: string;
  updated_at: string;

  // Identity
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  city: string | null;
  age: number | null;
  sex: string | null;          // "femme" | "homme" | "autre"
  height_cm: number | null;
  weight_kg: number | null;

  // Simulator answers
  simulator: string;           // display name (e.g. "Adipologie")
  simulator_id: string | null; // canonical id
  goal: string;
  zone: string;
  zone_tier: string | null;    // "small" | "medium" | "large"
  intensity: string | null;
  sport: string | null;
  cellulite: string | null;
  budget_client: string | null;       // user's budget tier label
  availability: string | null;
  message: string | null;
  timeframe: string | null;
  source: string | null;

  // Pricing & recommendation
  mode: string | null;                // "single" | "cure"
  price_session: number | null;
  price_cure: number | null;
  price_total: number | null;
  duo_applied: number;                // 0 / 1 (SQLite boolean)
  complementary_simulator: string | null;
  complementary_reason: string | null;

  protocol: string | null;
  result: string | null;
  ai_notes: string | null;
  analysis: string | null;
  consent: number;                    // 0 / 1
  status: LeadStatus;
  source_ip: string | null;
}
