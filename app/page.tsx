"use client";

import { useRef, useState } from "react";

type FormState = "idle" | "loading" | "success" | "error";

export default function Home() {
  const formRef = useRef<HTMLElement>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", phone: "", email: "", message: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<FormState>("idle");

  const scrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstName.trim()) e.firstName = "Prénom requis";
    if (!form.lastName.trim()) e.lastName = "Nom requis";
    if (!form.phone.trim() || form.phone.trim().length < 6) e.phone = "Téléphone requis";
    if (!form.email.trim() || !form.email.includes("@")) e.email = "Email invalide";
    return e;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setState("loading");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setState("success");
        setForm({ firstName: "", lastName: "", phone: "", email: "", message: "" });
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  };

  return (
    <div className="min-h-screen bg-white">

      {/* ── HEADER ── */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-5xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
          <span className="text-base sm:text-lg font-semibold tracking-tight text-stone-900">Body Institut</span>
          <button
            onClick={scrollToForm}
            className="bg-stone-900 text-white text-xs sm:text-sm font-medium px-4 sm:px-5 py-2 sm:py-2.5 rounded-full hover:bg-stone-700 transition-colors"
          >
            Être rappelée
          </button>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="pt-14 sm:pt-16">
        <div className="relative h-[55vw] min-h-[260px] max-h-[620px] w-full overflow-hidden bg-stone-800">
          <img
            src="/images/cover.jpg"
            alt="Body Institut — soins minceur Paris 18"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
            onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
          <div className="absolute inset-0 bg-black/45" />
          <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4">
            <h1 className="text-xl sm:text-3xl md:text-5xl font-bold text-white leading-tight max-w-3xl">
              Body Institut
              <span className="block text-sm sm:text-xl md:text-2xl font-normal mt-1 text-white/80">Soin minceur &amp; silhouette · Paris 18</span>
            </h1>
            <p className="mt-3 text-white/85 text-xs sm:text-base max-w-md leading-relaxed hidden sm:block">
              Drainage, madérothérapie, radiofréquence — affinez et raffermissez votre silhouette.
            </p>
            <button
              onClick={scrollToForm}
              className="mt-5 sm:mt-8 bg-white text-stone-900 font-semibold px-6 sm:px-8 py-3 sm:py-3.5 rounded-full hover:bg-stone-100 transition-colors text-sm sm:text-base shadow"
            >
              Prendre rendez-vous
            </button>
          </div>
        </div>
      </section>

      {/* ── PHOTOS ── */}
      <section className="max-w-5xl mx-auto px-3 sm:px-6 py-6 sm:py-12">
        <div className="grid grid-cols-3 gap-2 sm:gap-4">
          {[
            { src: "/images/photo-1.jpg", label: "Radiofréquence" },
            { src: "/images/photo-2.jpg", label: "Cryolipolyse" },
            { src: "/images/photo-3.jpg", label: "Madérothérapie" },
          ].map((item, i) => (
            <div key={i} className="aspect-[3/4] overflow-hidden rounded-xl sm:rounded-2xl shadow-sm bg-stone-100 relative group">
              <img
                src={item.src}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ── PRÉSENTATION ── */}
      <section className="max-w-2xl mx-auto px-4 sm:px-6 py-4 sm:py-8 text-center">
        <h2 className="text-xl sm:text-3xl font-semibold text-stone-900 leading-snug">
          Un accompagnement minceur personnalisé
        </h2>
        <p className="mt-3 sm:mt-4 text-stone-500 text-sm sm:text-lg leading-relaxed">
          Body Institut vous accompagne avec des soins ciblés pour drainer, sculpter et raffermir la silhouette.
          Laissez vos coordonnées et notre équipe vous rappelle rapidement.
        </p>
      </section>

      {/* ── SERVICES ── */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
          {[
            { title: "Radiofréquence", desc: "Raffermissement et remodelage en profondeur." },
            { title: "Cryolipolyse", desc: "Élimination ciblée des graisses résistantes." },
            { title: "Madérothérapie", desc: "Drainage et sculpture naturelle de la silhouette." },
          ].map((s, i) => (
            <div key={i} className="bg-stone-50 rounded-2xl p-4 sm:p-6 border border-stone-100">
              <h3 className="font-semibold text-stone-900 text-sm sm:text-base">{s.title}</h3>
              <p className="text-stone-500 text-xs sm:text-sm mt-1 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FORMULAIRE ── */}
      <section
        ref={formRef}
        id="contact"
        className="max-w-lg mx-auto px-4 sm:px-6 py-8 sm:py-12"
      >
        <div className="bg-stone-50 rounded-2xl sm:rounded-3xl p-5 sm:p-10 shadow-sm border border-stone-100">
          <h3 className="text-lg sm:text-xl font-semibold text-stone-900 mb-5 text-center">Être rappelée</h3>

          {state === "success" ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4"><span className="text-green-600 font-bold text-xl">✓</span></div>
              <p className="text-stone-700 font-semibold text-base sm:text-lg">Demande envoyée !</p>
              <p className="text-stone-400 mt-2 text-sm">Nous vous rappellerons très rapidement.</p>
              <button
                onClick={() => setState("idle")}
                className="mt-6 text-sm text-stone-400 hover:text-stone-600 underline"
              >
                Envoyer une nouvelle demande
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Prénom *</label>
                  <input
                    type="text"
                    value={form.firstName}
                    onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                    className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 bg-white ${errors.firstName ? "border-red-400" : "border-stone-200"}`}
                    placeholder="Marie"
                  />
                  {errors.firstName && <p className="text-[11px] text-red-500 mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Nom *</label>
                  <input
                    type="text"
                    value={form.lastName}
                    onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                    className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 bg-white ${errors.lastName ? "border-red-400" : "border-stone-200"}`}
                    placeholder="Dupont"
                  />
                  {errors.lastName && <p className="text-[11px] text-red-500 mt-1">{errors.lastName}</p>}
                </div>
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Téléphone *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 bg-white ${errors.phone ? "border-red-400" : "border-stone-200"}`}
                  placeholder="06 12 34 56 78"
                />
                {errors.phone && <p className="text-[11px] text-red-500 mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`w-full rounded-xl border px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 bg-white ${errors.email ? "border-red-400" : "border-stone-200"}`}
                  placeholder="marie@email.fr"
                />
                {errors.email && <p className="text-[11px] text-red-500 mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-stone-700 mb-1">Message (optionnel)</label>
                <textarea
                  value={form.message}
                  onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                  className="w-full rounded-xl border border-stone-200 px-3 sm:px-4 py-2.5 sm:py-3 text-sm outline-none focus:ring-2 focus:ring-stone-400 resize-none bg-white"
                  rows={3}
                  placeholder="Votre demande ou question..."
                />
              </div>
              {state === "error" && (
                <p className="text-xs sm:text-sm text-red-500 text-center">Une erreur est survenue. Veuillez réessayer.</p>
              )}
              <button
                type="submit"
                disabled={state === "loading"}
                className="w-full bg-stone-900 text-white font-semibold py-3.5 rounded-xl hover:bg-stone-700 transition-colors disabled:opacity-60 text-sm sm:text-base"
              >
                {state === "loading" ? "Envoi en cours…" : "Envoyer ma demande"}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-stone-100 py-6 sm:py-8 text-center">
        <p className="text-xs sm:text-sm text-stone-400">© {new Date().getFullYear()} Body Institut · Paris 18</p>
        <p className="text-xs text-stone-300 mt-1">Soins minceur sur rendez-vous</p>
        <a
          href="/admin"
          className="mt-4 inline-block text-xs text-stone-300 hover:text-stone-500 transition-colors"
        >
          Espace admin
        </a>
      </footer>

    </div>
  );
}
