"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type LeadStatus = "Nouveau" | "Contacté" | "RDV pris" | "Pas répondu";

interface Lead {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  message: string | null;
  status: LeadStatus;
  created_at: string;
}

const STATUSES: LeadStatus[] = ["Nouveau", "Contacté", "RDV pris", "Pas répondu"];

const STATUS_COLORS: Record<LeadStatus, string> = {
  "Nouveau": "bg-blue-100 text-blue-700 border-blue-200",
  "Contacté": "bg-amber-100 text-amber-700 border-amber-200",
  "RDV pris": "bg-green-100 text-green-700 border-green-200",
  "Pas répondu": "bg-stone-100 text-stone-500 border-stone-200",
};

export default function AdminPage() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchLeads = async () => {
    try {
      const res = await fetch("/api/admin/leads");
      if (res.status === 401) { router.replace("/admin/login"); return; }
      const data = await res.json();
      setLeads(data.leads ?? []);
    } catch {
      setError("Impossible de charger les leads.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLeads(); }, []);

  const handleStatusChange = async (id: string, status: LeadStatus) => {
    setUpdatingId(id);
    await fetch(`/api/admin/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setUpdatingId(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce lead définitivement ?")) return;
    setDeletingId(id);
    await fetch(`/api/admin/leads/${id}`, { method: "DELETE" });
    setLeads(prev => prev.filter(l => l.id !== id));
    setDeletingId(null);
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
  };

  const handleExport = () => {
    window.location.href = "/api/admin/leads/export";
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return iso; }
  };

  return (
    <div className="min-h-screen bg-stone-50">

      {/* HEADER */}
      <header className="bg-white border-b border-stone-200 px-4 py-3 sm:py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div>
            <h1 className="text-sm sm:text-lg font-semibold text-stone-900">Body Institut — Admin</h1>
            <p className="text-xs text-stone-400">{leads.length} client{leads.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleExport}
              className="text-xs sm:text-sm bg-stone-900 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:bg-stone-700 transition-colors whitespace-nowrap"
            >
              ↓ CSV
            </button>
            <button
              onClick={handleLogout}
              className="text-xs sm:text-sm text-stone-400 hover:text-stone-700 transition-colors whitespace-nowrap"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-8">

        {/* Chargement */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-stone-300 border-t-stone-700" />
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
        )}

        {/* Vide */}
        {!loading && !error && leads.length === 0 && (
          <div className="text-center py-20 text-stone-400">
            <p className="text-base font-medium text-stone-600">Aucun client pour le moment.</p>
            <p className="text-sm mt-2">Les demandes du formulaire apparaîtront ici.</p>
          </div>
        )}

        {/* TABLEAU — toutes tailles, scroll horizontal sur mobile */}
        {!loading && leads.length > 0 && (
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-stone-50 border-b border-stone-200">
                <tr>
                  {["Date", "Prénom", "Nom", "Téléphone", "Email", "Message", "Statut", "Actions"].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-semibold text-stone-600 text-xs uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {leads.map(lead => (
                  <tr key={lead.id} className="hover:bg-stone-50 transition-colors">
                    <td className="px-4 py-3 text-stone-400 whitespace-nowrap text-xs">{formatDate(lead.created_at)}</td>
                    <td className="px-4 py-3 font-semibold text-stone-900 whitespace-nowrap">{lead.first_name}</td>
                    <td className="px-4 py-3 text-stone-700 whitespace-nowrap">{lead.last_name}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={`tel:${lead.phone}`} className="text-green-700 hover:underline font-medium">{lead.phone}</a>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">{lead.email}</a>
                    </td>
                    <td className="px-4 py-3 text-stone-400 max-w-[180px] truncate text-xs">{lead.message ?? "—"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={e => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                        disabled={updatingId === lead.id}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-full border cursor-pointer outline-none ${STATUS_COLORS[lead.status]}`}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleDelete(lead.id)}
                        disabled={deletingId === lead.id}
                        className="text-xs text-red-400 hover:text-red-600 transition-colors disabled:opacity-40 px-2 py-1 rounded hover:bg-red-50"
                      >
                        {deletingId === lead.id ? "…" : "Supprimer"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
}

