"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Lock, X } from "lucide-react";

/**
 * Popup login modal for the admin dashboard.
 * Triggered by AdminFab. On success, redirects to /admin.
 */
export default function AdminLoginModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const emailRef = useRef<HTMLInputElement | null>(null);

  // Lock body scroll, focus, and handle Escape
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    const id = setTimeout(() => emailRef.current?.focus(), 40);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("modal-open");
      document.body.classList.remove("modal-open");
      clearTimeout(id);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password }),
      });
      if (res.status === 429) {
        throw new Error("Trop de tentatives. Réessayez dans une minute.");
      }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Identifiants incorrects");
      onClose();
      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-forest-900/40 px-4 backdrop-blur-md"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="admin-login-title"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-surface-200 bg-white p-7 shadow-card-hover md:p-9"
          >
            {/* Brand accent — warm sand halo (Apple-style) */}
            <div
              className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full blur-3xl"
              style={{ background: "rgba(154,130,84,0.22)" }}
            />

            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-surface-200 bg-white text-forest-700 transition-colors hover:border-forest-700 hover:bg-surface-50"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="relative">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
                <Lock className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <h2
                id="admin-login-title"
                className="mt-5 text-2xl font-semibold tracking-tight text-forest-800"
              >
                Connexion admin
              </h2>
              <p className="mt-1.5 text-sm text-forest-700/65">
                Accès réservé à l'équipe Body Institut.
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4">
                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.22em] text-forest-700/65">
                    Email
                  </span>
                  <input
                    ref={emailRef}
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="username"
                    placeholder="admin@bodyinstitut.fr"
                    className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-forest-800 outline-none transition-all placeholder:text-forest-700/35 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
                  />
                </label>

                <label className="block">
                  <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.22em] text-forest-700/65">
                    Mot de passe
                  </span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-surface-200 bg-white px-3.5 py-2.5 text-sm text-forest-800 outline-none transition-all placeholder:text-forest-700/35 focus:border-brand-400 focus:ring-4 focus:ring-brand-500/15"
                  />
                </label>

                {error && (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary btn-lg w-full disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-forest-700/40 disabled:shadow-none"
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
                    </>
                  )}
                </button>
              </form>

              <p className="mt-5 text-center text-[11px] text-forest-700/50">
                Session sécurisée · Cookie chiffré · 7 jours
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
