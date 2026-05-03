"use client";

import { forwardRef, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowDown,
  ArrowUpRight,
  Sparkles,
  CalendarCheck2,
  ShieldCheck,
  Leaf,
  Diamond,
  Droplets,
  Check,
} from "lucide-react";
import SimulatorFlow from "@/components/SimulatorFlow";
import { usePresence } from "@/hooks/usePresence";
import { useArrivalTrack } from "@/hooks/useTrackEvent";

export default function Home() {
  usePresence("home");
  useArrivalTrack();
  const simulatorRef = useRef<HTMLDivElement | null>(null);

  const scrollToSimulator = useCallback(() => {
    simulatorRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, []);

  return (
    <>
      <LocalBusinessJsonLd />
      <Hero onStart={scrollToSimulator} />
      <SimulatorBlock ref={simulatorRef} />
      <MiniAbout />
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STRUCTURED DATA — LocalBusiness (SEO local Paris 18)
   ══════════════════════════════════════════════════════════════════ */

function LocalBusinessJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "HealthAndBeautyBusiness",
    name: "Body Institut",
    description:
      "Institut minceur & soins corps premium à Paris 18 — cryolipolyse, radiofréquence, pressothérapie. Bilan offert.",
    image: "/logo.svg",
    url:
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "https://bodyinstitut.fr",
    telephone: "+33-1-00-00-00-00",
    priceRange: "€€",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Paris",
      postalCode: "75018",
      addressCountry: "FR",
    },
    areaServed: { "@type": "City", name: "Paris" },
    openingHours: "Mo-Sa 10:00-19:00",
    sameAs: [],
    makesOffer: [
      {
        "@type": "Offer",
        name: "Cryolipolyse Adipologie",
        description: "Réduction des amas graisseux par cryolipolyse.",
      },
      {
        "@type": "Offer",
        name: "Esthe Shape — Radiofréquence",
        description: "Raffermissement et drainage par radiofréquence.",
      },
      {
        "@type": "Offer",
        name: "Pressothérapie",
        description: "Drainage lymphatique pour jambes légères.",
      },
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO — Apple-style ultra-direct (beige / black / gray)
   ══════════════════════════════════════════════════════════════════ */

function Hero({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const yTitle = useTransform(scrollYProgress, [0, 1], [0, -80]);
  const ySub = useTransform(scrollYProgress, [0, 1], [0, -40]);
  const scaleCard = useTransform(scrollYProgress, [0, 1], [1, 0.96]);
  const opacityCue = useTransform(scrollYProgress, [0, 0.3], [1, 0]);

  return (
    <section
      id="accueil"
      ref={ref}
      className="relative flex min-h-[100svh] items-center justify-center overflow-hidden bg-surface-50 pt-24"
    >
      {/* Cream backdrop with soft gold halo */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-hero-fade"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh] bg-sand-fade"
        aria-hidden
      />
      {/* Subtle grain */}
      <div
        className="pointer-events-none absolute inset-0 -z-10 bg-noise opacity-[0.04]"
        aria-hidden
      />
      {/* Floating 3D beige pill — Apple-like hero object */}
      <motion.div
        aria-hidden
        style={{ scale: scaleCard }}
        className="pointer-events-none absolute right-[-12%] top-[12%] hidden h-[520px] w-[520px] rounded-full bg-gradient-to-br from-sand-200 via-sand-100 to-surface-0 opacity-70 shadow-3d-lg md:block"
      />
      <motion.div
        aria-hidden
        style={{ scale: scaleCard }}
        className="pointer-events-none absolute left-[-10%] bottom-[8%] hidden h-[320px] w-[320px] rounded-full bg-gradient-to-tr from-forest-800/10 via-transparent to-sand-200/60 md:block"
      />

      <div className="container-wide relative z-10">
        <div className="mx-auto max-w-4xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            <Sparkles className="h-3 w-3" />
            Body Institut · Paris 18
          </motion.span>

          <motion.h1
            style={{ y: yTitle }}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.9,
              delay: 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="display-hero mt-6 text-balance"
          >
            L'art de{" "}
            <span className="text-gradient-brand">révéler</span>
            <br />
            votre silhouette.
          </motion.h1>

          <motion.p
            style={{ y: ySub }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.25 }}
            className="mx-auto mt-8 max-w-xl text-balance text-lg text-forest-700/80 md:text-2xl"
          >
            Analyse sur-mesure en 3 minutes.
            <br className="hidden sm:inline" />
            <span className="text-forest-700/60">Bilan offert, sans engagement.</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.45 }}
            className="mt-12 flex flex-col items-center gap-5"
          >
            <button
              type="button"
              onClick={onStart}
              className="group inline-flex w-full max-w-md items-center justify-center gap-2.5 rounded-full bg-brand-500 px-10 py-5 text-base font-semibold uppercase tracking-[0.15em] text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-600 active:scale-[0.98] sm:text-lg"
              style={{
                boxShadow:
                  "0 1px 0 rgba(255,255,255,0.2) inset, 0 30px 60px -15px rgba(10,8,6,0.5), 0 10px 24px -6px rgba(10,8,6,0.3)",
              }}
            >
              <Sparkles className="h-5 w-5 transition-transform duration-500 group-hover:rotate-12" />
              Offre bilan gratuit
              <ArrowUpRight className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </button>

            <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
              <span>Analyse en 3 min</span>
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-sand-500" />
              <span>Sans engagement</span>
              <span className="h-1 w-1 flex-shrink-0 rounded-full bg-sand-500" />
              <span>100 % gratuit</span>
            </p>
          </motion.div>

          {/* Trust chips — 3 soins */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.6 }}
            className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-3"
          >
            {[
              {
                icon: Diamond,
                name: "Adipologie",
                sub: "Cryolipolyse · −4 à −6 cm",
              },
              {
                icon: Leaf,
                name: "Esthe Shape",
                sub: "Radiofréquence · +25 % fermeté",
              },
              {
                icon: Droplets,
                name: "Pressothérapie",
                sub: "Drainage · jambes légères",
              },
            ].map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.7 + i * 0.08 }}
                className="card-3d flex items-center gap-3 bg-white/80 p-4 backdrop-blur text-left"
              >
                <span className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-xl bg-forest-800 text-white">
                  <s.icon className="h-4 w-4" />
                </span>
                <div>
                  <div className="text-sm font-semibold tracking-tight text-forest-800">
                    {s.name}
                  </div>
                  <div className="text-[11px] text-forest-700/60">
                    {s.sub}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Scroll cue */}
          <motion.button
            type="button"
            onClick={onStart}
            style={{ opacity: opacityCue }}
            className="mx-auto mt-14 hidden items-center justify-center gap-2 text-[10px] uppercase tracking-[0.26em] text-forest-700/45 hover:text-sand-700 md:inline-flex"
          >
            <ArrowDown className="h-3 w-3 animate-bounce" />
            Découvrir
          </motion.button>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SIMULATOR BLOCK — hosts the inline SimulatorFlow (80 % of page)
   ══════════════════════════════════════════════════════════════════ */

const SimulatorBlock = forwardRef<HTMLDivElement>(function SimulatorBlock(
  _props,
  ref
) {
  return (
    <section
      id="simulator"
      ref={ref}
      className="relative scroll-mt-20 border-t border-surface-200 bg-gradient-to-b from-white to-surface-50 py-16 md:py-28"
    >
      {/* Top sand halo */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-sand-fade"
        aria-hidden
      />

      <div className="container-wide relative">
        <div className="mx-auto max-w-3xl">
          {/* Section heading above the form */}
          <div className="mb-10 text-center md:mb-14">
            <span className="eyebrow">
              <Sparkles className="h-3 w-3" />
              Bilan gratuit en ligne
            </span>
            <h2 className="mt-5 text-balance text-2xl font-semibold tracking-tight text-forest-900 sm:text-3xl md:text-4xl">
              Simulez votre transformation,
              <br />
              <span className="text-gradient-brand">recevez votre bilan.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base text-forest-700/70 md:text-lg">
              En 2 minutes, obtenez une analyse personnalisée de votre objectif 
              avec une estimation tarifaire et un protocole sur-mesure.
            </p>
            
            {/* Trust pills */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2 px-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800/5 px-3 py-1.5 text-xs font-medium text-forest-700">
                <Check className="h-3.5 w-3.5 text-brand-500" />
                100% gratuit
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800/5 px-3 py-1.5 text-xs font-medium text-forest-700">
                <Check className="h-3.5 w-3.5 text-brand-500" />
                Sans engagement
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-800/5 px-3 py-1.5 text-xs font-medium text-forest-700">
                <Check className="h-3.5 w-3.5 text-brand-500" />
                Résultat immédiat
              </span>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-3xl">
          <div className="relative overflow-hidden rounded-2xl border border-surface-200 bg-white p-4 shadow-3d-lg sm:rounded-[2rem] sm:p-5 md:rounded-[2.5rem] md:p-10">
            {/* Top inner highlight — glass effect */}
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-sand-50 to-transparent"
              aria-hidden
            />
            <SimulatorFlow />
          </div>
        </div>
      </div>
    </section>
  );
});

/* ══════════════════════════════════════════════════════════════════
   MINI ABOUT
   ══════════════════════════════════════════════════════════════════ */

function MiniAbout() {
  return (
    <section
      id="about"
      className="relative scroll-mt-20 border-t border-surface-200 bg-surface-50 py-20 md:py-28"
    >
      <div className="container-wide">
        <div className="mx-auto grid max-w-5xl items-center gap-10 md:grid-cols-2">
          <div>
            <span className="eyebrow">
              <ShieldCheck className="h-3 w-3" />
              Body Institut
            </span>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight text-forest-800 md:text-5xl">
              10 ans d'expertise,
              <br />
              <span className="text-gradient-brand">à Paris 18.</span>
            </h2>
            <p className="mt-5 text-base text-forest-700/70 md:text-lg">
              Trois technologies de pointe — cryolipolyse, radiofréquence,
              pressothérapie — orchestrées par des expertes formées, avec un
              suivi personnalisé à chaque étape.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href={
                  process.env.NEXT_PUBLIC_BOOKING_URL ??
                  "https://www.planity.com"
                }
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <CalendarCheck2 className="h-4 w-4" />
                Réserver un bilan offert
              </a>
              <Link
                href="/admin"
                className="btn-ghost"
                title="Espace administration"
              >
                <ShieldCheck className="h-4 w-4" />
                Espace admin
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard value="10+" label="Années" />
            <StatCard value="3" label="Technologies" />
            <StatCard value="2 000+" label="Clientes" />
            <StatCard value="97%" label="Satisfaction" />
          </div>
        </div>
      </div>
    </section>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="card-3d flex flex-col justify-between gap-3 p-5 md:p-6">
      <p className="text-[10px] uppercase tracking-[0.22em] text-sand-600">
        {label}
      </p>
      <p className="text-3xl font-semibold tracking-tight text-forest-800 md:text-4xl">
        {value}
      </p>
    </div>
  );
}
