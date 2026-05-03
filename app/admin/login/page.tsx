"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Loader2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginInner />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-200 border-t-brand-500" />
    </div>
  );
}

function LoginInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const from = sp.get("from") || "/admin";

  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: u, password: p }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Échec de connexion");
      router.replace(from);
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : "Erreur");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-6">
      <div className="pointer-events-none absolute inset-0 bg-hero-fade" />

      <motion.form
        onSubmit={onSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md rounded-3xl border border-surface-200 bg-white p-8 shadow-card-soft"
      >
        <div className="flex items-center gap-3">
          <img 
            src="/logo.svg" 
            alt="Body Institut" 
            className="h-10 w-auto"
          />
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
              Body Institut
            </p>
            <p className="text-sm font-semibold text-forest-800">Console admin</p>
          </div>
        </div>

        <h1 className="mt-8 text-balance text-3xl font-semibold tracking-tight text-forest-800">
          Connexion sécurisée
        </h1>
        <p className="mt-2 text-sm text-forest-700/65">
          Accès réservé à l'équipe.
        </p>

        <div className="mt-8 space-y-4">
          <Field
            label="Identifiant"
            value={u}
            onChange={setU}
            autoComplete="username"
          />
          <Field
            label="Mot de passe"
            type="password"
            value={p}
            onChange={setP}
            autoComplete="current-password"
          />
        </div>

        {err && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {err}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary btn-lg mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connexion...
            </>
          ) : (
            <>
              <Lock className="h-4 w-4" />
              Se connecter
              <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <p className="mt-6 text-center text-[11px] text-forest-700/45">
          Body Institut · Console privée
        </p>
      </motion.form>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.22em] text-forest-700/65">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        className="w-full rounded-xl border border-surface-200 bg-white px-4 py-3 text-sm text-forest-800 outline-none transition-all placeholder:text-forest-700/35 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
      />
    </label>
  );
}
