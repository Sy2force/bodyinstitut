import { z } from "zod";

const phoneRe = /^[+0-9 .\-()]{6,20}$/;

export const leadSchema = z.object({
  firstName: z.string().trim().min(1, "Prénom requis").max(80),
  lastName: z.string().trim().min(1, "Nom requis").max(80),
  phone: z
    .string()
    .trim()
    .min(6, "Téléphone requis")
    .max(20)
    .regex(phoneRe, "Téléphone invalide"),
  email: z.string().trim().email("Email invalide").max(160),
  message: z.string().max(2000).optional(),
});

export type LeadInput = z.infer<typeof leadSchema>;

export const statusSchema = z.enum([
  "Nouveau",
  "Contacté",
  "RDV pris",
  "Pas répondu",
]);

export const adminLoginSchema = z.object({
  password: z.string().min(1).max(200),
});

export const updateLeadSchema = z.object({
  status: statusSchema,
});

export function escapeCsv(v: unknown): string {
  const s = v === null || v === undefined ? "" : String(v);
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
