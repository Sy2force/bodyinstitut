"use client";

import type { LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, { bg: string; fg: string; dot: string; label: string }> = {
  nouveau:    { bg: "bg-brand-50",    fg: "text-brand-700",   dot: "bg-brand-500",    label: "Nouveau"    },
  a_rappeler: { bg: "bg-amber-50",    fg: "text-amber-700",   dot: "bg-amber-500",    label: "À rappeler" },
  contacte:   { bg: "bg-sky-50",      fg: "text-sky-700",     dot: "bg-sky-500",      label: "Contacté"   },
  rdv_pris:   { bg: "bg-indigo-50",   fg: "text-indigo-700",  dot: "bg-indigo-500",   label: "RDV pris"   },
  converti:   { bg: "bg-emerald-50",  fg: "text-emerald-700", dot: "bg-emerald-500",  label: "Converti"   },
  perdu:      { bg: "bg-surface-100", fg: "text-forest-700/65", dot: "bg-surface-400", label: "Perdu"      },
};

export const STATUS_LABEL: Record<LeadStatus, string> = Object.fromEntries(
  Object.entries(STYLES).map(([k, v]) => [k, v.label])
) as Record<LeadStatus, string>;

export default function StatusPill({ status }: { status: LeadStatus }) {
  const s = STYLES[status] ?? STYLES.nouveau;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${s.bg} ${s.fg}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
