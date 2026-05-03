"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Phone, Calendar, Trash2 } from "lucide-react";
import StatusPill, { STATUS_LABEL } from "./StatusPill";
import type { LeadRecord, LeadStatus } from "@/lib/types";
import { LEAD_STATUSES } from "@/lib/types";

interface Props {
  lead: LeadRecord | null;
  onClose: () => void;
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDelete: (id: string) => void;
}

const STATUSES: LeadStatus[] = LEAD_STATUSES;

export default function LeadDrawer({
  lead,
  onClose,
  onUpdateStatus,
  onDelete,
}: Props) {
  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-forest-900/20 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col overflow-y-auto border-l border-surface-200 bg-white p-8"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
                  Lead · {new Date(lead.created_at).toLocaleString("fr-FR")}
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-forest-800">
                  {lead.first_name} {lead.last_name}
                </h2>
                <div className="mt-3">
                  <StatusPill status={lead.status} />
                </div>
              </div>
              <button
                aria-label="Fermer"
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full border border-surface-200 bg-white text-forest-700 transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions */}
            <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <a
                href={`mailto:${lead.email}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-forest-700 transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <Mail className="h-4 w-4" />
                <span className="truncate">{lead.email}</span>
              </a>
              <a
                href={`tel:${lead.phone}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-surface-200 bg-surface-50 px-4 py-2.5 text-sm text-forest-700 transition-colors hover:border-brand-300 hover:text-brand-600"
              >
                <Phone className="h-4 w-4" />
                {lead.phone}
              </a>
            </div>

            {/* Status switcher */}
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
                Statut
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => onUpdateStatus(lead.id, s)}
                    className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${
                      lead.status === s
                        ? "border-brand-500 bg-brand-50 text-brand-700"
                        : "border-surface-200 bg-white text-forest-700 hover:border-brand-300 hover:text-brand-600"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Identity */}
            <div className="mt-8 grid grid-cols-2 gap-3">
              <Cell label="Ville"  value={lead.city ?? "—"} />
              <Cell label="Âge"    value={lead.age ? `${lead.age} ans` : "—"} />
              <Cell label="Sexe"   value={lead.sex ?? "—"} />
              <Cell
                label="Morphologie"
                value={
                  lead.height_cm && lead.weight_kg
                    ? `${lead.height_cm} cm · ${lead.weight_kg} kg`
                    : "—"
                }
              />
            </div>

            {/* Simulation */}
            <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
              Simulation
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Cell label="Soin"      value={lead.simulator} />
              <Cell label="Total estimé" value={`${(lead.price_total ?? lead.price_cure ?? 0).toLocaleString("fr-FR")} €`} accent />
              <Cell label="Objectif"  value={lead.goal} />
              <Cell label="Zone"      value={`${lead.zone}${lead.zone_tier ? ` · ${lead.zone_tier}` : ""}`} />
              <Cell label="Intensité" value={lead.intensity ?? "—"} />
              <Cell label="Sport"     value={lead.sport ?? "—"} />
              {lead.cellulite     && <Cell label="Cellulite"  value={lead.cellulite} />}
              {lead.budget_client && <Cell label="Budget client" value={lead.budget_client} />}
              <Cell label="Prix séance" value={lead.price_session ? `${lead.price_session} €` : "—"} />
              <Cell label="Prix cure"   value={lead.price_cure    ? `${lead.price_cure} €`    : "—"} />
              <Cell label="Protocole" value={lead.protocol ?? "—"} full />
              <Cell label="Résultat attendu" value={lead.result ?? "—"} full />
              {lead.duo_applied === 1 && (
                <Cell
                  full
                  label="Offre duo cures"
                  value={`${lead.complementary_simulator ?? "—"}${lead.complementary_reason ? ` · ${lead.complementary_reason}` : ""}`}
                />
              )}
              {lead.availability && <Cell full label="Disponibilités" value={lead.availability} />}
              {lead.message && <Cell full label="Message" value={lead.message} />}
            </div>

            {/* Project details */}
            <p className="mt-8 text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
              Projet
            </p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {lead.timeframe && <Cell label="Démarrage" value={lead.timeframe} />}
              {lead.source && <Cell label="Source" value={lead.source} />}
            </div>

            {lead.analysis && (
              <div className="mt-6 rounded-2xl border border-surface-200 bg-surface-50 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
                  Analyse personnalisée
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-forest-800">
                  {lead.analysis}
                </p>
              </div>
            )}

            {lead.ai_notes && (
              <div className="mt-4 rounded-2xl border border-surface-200 bg-surface-50 p-5">
                <p className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
                  Note du client
                </p>
                <p className="mt-3 text-[15px] leading-relaxed text-forest-700">
                  {lead.ai_notes}
                </p>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-3 border-t border-surface-200 pt-6">
              <span className="inline-flex items-center gap-2 text-xs text-forest-700/55">
                <Calendar className="h-3.5 w-3.5" />
                Maj · {new Date(lead.updated_at).toLocaleString("fr-FR")}
              </span>
              <button
                onClick={() => {
                  if (confirm("Supprimer définitivement ce lead ?")) {
                    onDelete(lead.id);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs text-rose-700 hover:bg-rose-100"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Cell({
  label,
  value,
  full,
  accent,
}: {
  label: string;
  value: string;
  full?: boolean;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-surface-200 bg-surface-50 p-4 ${
        full ? "col-span-2" : ""
      }`}
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
        {label}
      </p>
      <p
        className={`mt-1.5 text-[15px] font-medium ${
          accent ? "text-brand-600" : "text-forest-800"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
