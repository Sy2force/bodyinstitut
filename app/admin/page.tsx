"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Download,
  LogOut,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Inbox,
  CheckCircle2,
  TrendingUp,
  Euro,
  Radio,
} from "lucide-react";
import StatusPill from "@/components/admin/StatusPill";
import LeadDrawer from "@/components/admin/LeadDrawer";
import type { LeadRecord, LeadStatus } from "@/lib/types";

const POLL_INTERVAL_MS = 10_000;

interface SimulatorStat {
  sid: string;
  name: string;
  count: number;
  pipeline: number;
}

interface ListResponse {
  rows: LeadRecord[];
  total: number;
  stats: {
    byStatus: Record<string, number>;
    bySimulator: SimulatorStat[];
    last7Days: number;
    last24h: number;
    total: number;
    pipeline: number;
  };
}

const PAGE_SIZE = 25;

const STATUSES: { value: LeadStatus | "all"; label: string }[] = [
  { value: "all",        label: "Tous"       },
  { value: "nouveau",    label: "Nouveau"    },
  { value: "a_rappeler", label: "À rappeler" },
  { value: "contacte",   label: "Contacté"   },
  { value: "rdv_pris",   label: "RDV pris"   },
  { value: "converti",   label: "Converti"   },
  { value: "perdu",      label: "Perdu"      },
];

export default function AdminDashboard() {
  const router = useRouter();

  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<LeadStatus | "all">("all");
  const [simulator, setSimulator] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"created_at" | "budget" | "last_name">(
    "created_at"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [activeLead, setActiveLead] = useState<LeadRecord | null>(null);

  // Real-time polling
  const [isPolling, setIsPolling] = useState(true);
  const [lastPollAt, setLastPollAt] = useState<number>(Date.now());
  const [newLeadIds, setNewLeadIds] = useState<Set<string>>(new Set());
  const knownIdsRef = useRef<Set<string>>(new Set());

  const buildUrl = useCallback(
    (extra: Record<string, string> = {}) => {
      const u = new URLSearchParams();
      if (q.trim()) u.set("q", q.trim());
      if (status !== "all") u.set("status", status);
      if (simulator !== "all") u.set("simulator", simulator);
      u.set("orderBy", sortBy);
      u.set("order", sortOrder);
      u.set("limit", String(PAGE_SIZE));
      u.set("offset", String(page * PAGE_SIZE));
      Object.entries(extra).forEach(([k, v]) => u.set(k, v));
      return u.toString();
    },
    [q, status, simulator, sortBy, sortOrder, page]
  );

  const fetchLeads = useCallback(
    async (opts: { silent?: boolean } = {}) => {
      if (!opts.silent) setLoading(true);
      try {
        const res = await fetch(`/api/admin/leads?${buildUrl()}`, {
          cache: "no-store",
        });
        if (res.status === 401) {
          router.replace("/admin/login");
          return;
        }
        const json = (await res.json()) as ListResponse;

        // Detect new leads vs the known set (only on silent polls to avoid
        // highlighting everything on the very first load).
        if (opts.silent && knownIdsRef.current.size > 0) {
          const freshlyNew = new Set<string>();
          json.rows.forEach((r) => {
            if (!knownIdsRef.current.has(r.id)) freshlyNew.add(r.id);
          });
          if (freshlyNew.size > 0) {
            setNewLeadIds(freshlyNew);
            // Auto-clear highlight after 6s
            setTimeout(() => setNewLeadIds(new Set()), 6000);
          }
        }

        knownIdsRef.current = new Set(json.rows.map((r) => r.id));
        setData(json);
        setLastPollAt(Date.now());
      } finally {
        if (!opts.silent) setLoading(false);
      }
    },
    [buildUrl, router]
  );

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Real-time polling — pauses when tab is hidden
  useEffect(() => {
    if (!isPolling) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchLeads({ silent: true });
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [isPolling, fetchLeads]);

  const simulators = useMemo(() => {
    const set = new Set<string>();
    (data?.rows ?? []).forEach((r) => set.add(r.simulator));
    return ["all", ...Array.from(set).sort()];
  }, [data]);

  const updateStatus = async (id: string, newStatus: LeadStatus) => {
    const res = await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      const { lead } = await res.json();
      setActiveLead(lead);
      fetchLeads({ silent: true });
    }
  };

  const removeLead = async (id: string) => {
    const res = await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    if (res.ok) {
      setActiveLead(null);
      fetchLeads({ silent: true });
    }
  };

  const logout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  const exportCsv = () => {
    window.location.href = `/api/admin/leads/export?${buildUrl()}`;
  };

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div className="min-h-screen">
      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-surface-200 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/admin"
              className="flex items-center gap-2 text-sm font-semibold text-forest-800"
            >
              <img 
                src="/logo.svg" 
                alt="Body Institut" 
                className="h-7 w-auto"
              />
              <span className="hidden sm:inline">Body Institut</span>
            </Link>
            <span className="hidden h-4 w-px bg-surface-200 md:inline-block" />
            <span className="hidden text-[11px] uppercase tracking-[0.22em] text-forest-700/55 md:inline">
              Console admin
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LiveIndicator
              isPolling={isPolling}
              lastPollAt={lastPollAt}
              onToggle={() => setIsPolling((v) => !v)}
            />
            <Link
              href="/"
              className="hidden rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-forest-700 hover:border-brand-300 hover:text-brand-600 sm:inline-flex"
            >
              Voir le site
            </Link>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white px-3 py-1.5 text-xs text-forest-700 hover:border-brand-300 hover:text-brand-600"
            >
              <LogOut className="h-3.5 w-3.5" />
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Stats — global */}
        <section className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <StatCard
            icon={<Inbox className="h-4 w-4" />}
            label="Total leads"
            value={data?.stats.total ?? 0}
          />
          <StatCard
            icon={<Radio className="h-4 w-4 text-emerald-500" />}
            label="24 h"
            value={data?.stats.last24h ?? 0}
            pulse
          />
          <StatCard
            icon={<TrendingUp className="h-4 w-4" />}
            label="7 j"
            value={data?.stats.last7Days ?? 0}
          />
          <StatCard
            icon={<CheckCircle2 className="h-4 w-4" />}
            label="Convertis"
            value={data?.stats.byStatus?.converti ?? 0}
          />
          <StatCard
            icon={<Euro className="h-4 w-4" />}
            label="Pipeline (€)"
            value={(data?.stats.pipeline ?? 0).toLocaleString("fr-FR")}
          />
        </section>

        {/* Per-simulator live breakdown */}
        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[10px] font-medium uppercase tracking-[0.22em] text-forest-700/55">
              Par soin — temps réel
            </h2>
            <span className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.22em] text-emerald-600">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              Live · 10s
            </span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {(data?.stats.bySimulator ?? []).slice(0, 6).map((s) => (
              <SimulatorCard
                key={s.sid}
                name={s.name}
                count={s.count}
                pipeline={s.pipeline}
                onClick={() => {
                  setSimulator(s.name);
                  setPage(0);
                }}
                active={simulator === s.name}
              />
            ))}
            {(!data || data.stats.bySimulator.length === 0) && (
              <div className="col-span-full rounded-2xl border border-dashed border-surface-300 bg-white p-5 text-center text-sm text-forest-700/55">
                Aucun lead enregistré pour l'instant.
              </div>
            )}
          </div>
        </section>

        {/* Toolbar */}
        <section className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 items-center gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-700/45" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setPage(0);
                }}
                placeholder="Rechercher par nom, email, téléphone, objectif..."
                className="w-full rounded-full border border-surface-200 bg-white py-2.5 pl-10 pr-4 text-sm text-forest-800 outline-none placeholder:text-forest-700/40 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={status}
              onChange={(v) => {
                setStatus(v as LeadStatus | "all");
                setPage(0);
              }}
              options={STATUSES}
              icon={<Filter className="h-3.5 w-3.5" />}
            />
            <Select
              value={simulator}
              onChange={(v) => {
                setSimulator(v);
                setPage(0);
              }}
              options={simulators.map((s) => ({
                value: s,
                label: s === "all" ? "Tous les soins" : s,
              }))}
            />
            <Select
              value={`${sortBy}:${sortOrder}`}
              onChange={(v) => {
                const [b, o] = v.split(":");
                setSortBy(b as "created_at" | "budget" | "last_name");
                setSortOrder(o as "asc" | "desc");
              }}
              options={[
                { value: "created_at:desc", label: "Plus récent" },
                { value: "created_at:asc",  label: "Plus ancien" },
                { value: "budget:desc",     label: "Budget ↓"   },
                { value: "budget:asc",      label: "Budget ↑"   },
                { value: "last_name:asc",   label: "Nom A→Z"    },
                { value: "last_name:desc",  label: "Nom Z→A"    },
              ]}
            />
            <button
              onClick={exportCsv}
              className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-4 py-2 text-xs font-medium text-white shadow-brand-glow transition-all hover:bg-brand-600"
            >
              <Download className="h-3.5 w-3.5" />
              Exporter CSV
            </button>
          </div>
        </section>

        {/* Table — Full lead information */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-surface-200 bg-white shadow-card-soft">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              {/* Header */}
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Date</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Prénom</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Nom</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Email</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Téléphone</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Ville</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Âge</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Sexe</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Objectif</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Zone</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Intensité</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Activité</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Budget</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55">Soin</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55 text-right">Total</th>
                  <th className="px-4 py-3 text-[10px] font-normal uppercase tracking-[0.22em] text-forest-700/55 text-right">Statut</th>
                </tr>
              </thead>

              {loading && (
                <tbody>
                  <tr>
                    <td colSpan={16} className="px-5 py-20 text-center text-forest-700/55">
                      <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
                      Chargement...
                    </td>
                  </tr>
                </tbody>
              )}

              {!loading && data && data.rows.length === 0 && (
                <tbody>
                  <tr>
                    <td colSpan={16} className="px-5 py-20 text-center">
                      <Inbox className="mx-auto h-8 w-8 text-forest-700/25" />
                      <p className="mt-4 text-sm text-forest-700/65">
                        Aucun lead pour ces filtres.
                      </p>
                    </td>
                  </tr>
                </tbody>
              )}

              {!loading && (
                <tbody>
                  {data?.rows.map((r) => {
                    const isNew = newLeadIds.has(r.id);
                    return (
                      <tr
                        key={r.id}
                        onClick={() => setActiveLead(r)}
                        className={`cursor-pointer border-t border-surface-200 transition-colors ${
                          isNew
                            ? "animate-pulse bg-brand-50"
                            : "hover:bg-brand-50/40"
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-forest-700/60">
                          <div>{new Date(r.created_at).toLocaleDateString("fr-FR")}</div>
                          <div className="text-[11px] text-forest-700/40">
                            {new Date(r.created_at).toLocaleTimeString("fr-FR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3 font-medium text-forest-800">{r.first_name}</td>
                        <td className="px-4 py-3 font-medium text-forest-800">{r.last_name}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.email}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.phone}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.city ?? "—"}</td>
                        <td className="px-4 py-3 text-forest-800">{r.age ? `${r.age} ans` : "—"}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.sex ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="truncate text-forest-800">{r.goal}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="truncate text-forest-800">{r.zone}</span>
                        </td>
                        <td className="px-4 py-3 text-forest-700/70">{r.intensity ?? "—"}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.sport ?? "—"}</td>
                        <td className="px-4 py-3 text-forest-700/70">{r.budget_client ?? "—"}</td>
                        <td className="px-4 py-3">
                          <span className="truncate font-medium text-forest-800">{r.simulator}</span>
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-forest-800">
                          {(r.price_total ?? r.price_cure ?? 0).toLocaleString("fr-FR")} €
                          {r.duo_applied === 1 && (
                            <span className="ml-1 text-[10px] font-medium uppercase tracking-[0.22em] text-brand-600">
                              duo
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {isNew && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-brand-500 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white shadow-brand-glow">
                                Nouveau
                              </span>
                            )}
                            <StatusPill status={r.status} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              )}
            </table>
          </div>

          {/* Pagination */}
          {data && data.total > 0 && (
            <div className="flex items-center justify-between border-t border-surface-200 bg-surface-50 px-5 py-3 text-xs text-forest-700/65">
              <span>
                {data.total} résultat{data.total > 1 ? "s" : ""}
              </span>
              <div className="flex items-center gap-1">
                <button
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  className="grid h-7 w-7 place-items-center rounded-full border border-surface-200 bg-white text-forest-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <span className="px-2">
                  {page + 1} / {totalPages}
                </span>
                <button
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="grid h-7 w-7 place-items-center rounded-full border border-surface-200 bg-white text-forest-700 transition-colors hover:border-brand-300 hover:text-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      <LeadDrawer
        lead={activeLead}
        onClose={() => setActiveLead(null)}
        onUpdateStatus={updateStatus}
        onDelete={removeLead}
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  pulse,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  pulse?: boolean;
}) {
  return (
    <div
      className={`relative rounded-3xl border bg-white p-5 shadow-card-soft ${
        pulse
          ? "border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white"
          : "border-surface-200"
      }`}
    >
      {pulse && (
        <span className="absolute right-3 top-3 flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
      )}
      <div className="flex items-center gap-2 text-forest-700/55">
        <span className={pulse ? "text-emerald-500" : "text-sand-600"}>
          {icon}
        </span>
        <span className="text-[10px] uppercase tracking-[0.22em]">{label}</span>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-forest-800 md:text-4xl">
        {value}
      </p>
    </div>
  );
}

function SimulatorCard({
  name,
  count,
  pipeline,
  onClick,
  active,
}: {
  name: string;
  count: number;
  pipeline: number;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl border bg-white p-5 text-left shadow-card-soft transition-all duration-300 hover:-translate-y-0.5 hover:shadow-card-hover ${
        active
          ? "border-forest-800 ring-2 ring-forest-800/10"
          : "border-surface-200"
      }`}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sand-200/30 blur-3xl transition-opacity group-hover:bg-sand-300/40"
        aria-hidden
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sand-600">
              Soin
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-forest-800 md:text-base">
              {name}
            </p>
          </div>
          <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-2xl bg-forest-800 text-2xl font-semibold tracking-tight text-white">
            {count}
          </span>
        </div>
        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-surface-200 pt-3 text-[11px] uppercase tracking-[0.2em] text-forest-700/55">
          <span>Pipeline</span>
          <span className="font-semibold tabular-nums text-forest-800">
            {pipeline.toLocaleString("fr-FR")} €
          </span>
        </div>
      </div>
    </button>
  );
}

function LiveIndicator({
  isPolling,
  lastPollAt,
  onToggle,
}: {
  isPolling: boolean;
  lastPollAt: number;
  onToggle: () => void;
}) {
  const [, tick] = useState(0);

  // Refresh the "il y a Xs" label every 5s without spamming renders.
  useEffect(() => {
    const id = window.setInterval(() => tick((v) => v + 1), 5_000);
    return () => window.clearInterval(id);
  }, []);

  const ageSec = Math.max(0, Math.round((Date.now() - lastPollAt) / 1000));
  const label = ageSec < 10 ? "à l'instant" : `il y a ${ageSec}s`;

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isPolling ? "Pause des mises à jour temps réel" : "Reprendre le temps réel"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-medium uppercase tracking-wider transition-colors ${
        isPolling
          ? "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100"
          : "border-surface-200 bg-surface-50 text-forest-700/55 hover:bg-surface-100"
      }`}
    >
      <span className="relative flex h-2 w-2">
        {isPolling && (
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-500 opacity-60" />
        )}
        <span
          className={`relative h-2 w-2 rounded-full ${
            isPolling ? "bg-brand-500" : "bg-forest-700/30"
          }`}
        />
      </span>
      <Radio className="hidden h-3 w-3 sm:inline" />
      <span className="hidden sm:inline">
        {isPolling ? `Live · ${label}` : "Pause"}
      </span>
      <span className="sm:hidden">{isPolling ? "Live" : "Pause"}</span>
    </button>
  );
}

function Select<T extends string>({
  value,
  onChange,
  options,
  icon,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <label className="relative inline-flex items-center">
      {icon && (
        <span className="pointer-events-none absolute left-3 text-forest-700/55">
          {icon}
        </span>
      )}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={`appearance-none rounded-full border border-surface-200 bg-white py-2 pr-8 text-xs text-forest-800 outline-none focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15 ${
          icon ? "pl-8" : "pl-4"
        }`}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 text-forest-700/45">
        ▾
      </span>
    </label>
  );
}
