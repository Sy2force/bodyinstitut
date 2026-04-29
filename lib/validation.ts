import { z } from "zod";

export const intensitySchema = z.enum(["leger", "moyen", "important"]);
export const sportSchema = z.string().max(40); // free-form to support "jamais|parfois|regulierement|oui|non"
export const statusSchema = z.enum([
  "nouveau",
  "a_rappeler",
  "contacte",
  "rdv_pris",
  "converti",
  "perdu",
]);
export const sexSchema = z.enum(["femme", "homme", "autre"]);

const phoneRe = /^[+0-9 .\-()]{6,20}$/;

/**
 * Step 1 — Contact + profile fields (unified single-page form).
 * Required: firstName, lastName, email, phone, city, age, sex, height, weight, consent.
 * The form also collects routing/project answers but those go to `/complete`.
 */
export const leadStartSchema = z.object({
  company: z.string().max(0, { message: "spam" }).optional(),

  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  email: z.string().trim().email("Email invalide").max(160),
  phone: z
    .string()
    .trim()
    .min(6, "Téléphone trop court")
    .max(20)
    .regex(phoneRe, "Téléphone invalide"),
  city: z.string().trim().min(1, "Ville requise").max(80),

  age: z.coerce.number().int().min(15).max(99),
  sex: sexSchema,
  heightCm: z.coerce.number().int().min(120).max(230).optional(),
  weightKg: z.coerce.number().int().min(30).max(220).optional(),

  simulator: z.string().min(1).max(40).optional().default("auto"),

  consent: z.literal(true, {
    errorMap: () => ({ message: "Consentement requis" }),
  }),
});

export type LeadStart = z.infer<typeof leadStartSchema>;

/**
 * Step 2 — Enrichment with simulator answers. Needs the lead id returned by step 1.
 * `simulator` is optional: when "auto", the server picks the best soin from the
 * unified answers via lib/unified-flow.ts.
 */
export const leadCompleteSchema = z.object({
  company: z.string().max(0, { message: "spam" }).optional(),
  id: z.string().uuid({ message: "Identifiant invalide" }),
  simulator: z.string().min(1).max(40).optional().default("auto"),
  answers: z.record(z.string().max(60)).default({}),
  message: z.string().max(2000).optional().default(""),
});

export type LeadComplete = z.infer<typeof leadCompleteSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1).max(80),
  password: z.string().min(1).max(200),
});

export const updateLeadSchema = z.object({
  status: statusSchema,
});

export const importLeadSchema = z.object({
  firstName: z.string().min(1).max(80),
  lastName: z.string().min(1).max(80),
  email: z.string().email().max(160),
  phone: z.string().min(6).max(20),
  simulator: z.string().max(60).optional().default("manuel"),
  goal: z.string().max(120).optional().default(""),
  zone: z.string().max(120).optional().default(""),
  intensity: z.string().optional(),
  sport: z.string().optional(),
  budget: z.coerce.number().int().min(0).max(50000).optional().default(0),
  status: statusSchema.optional().default("nouveau"),
});

export function escapeCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
