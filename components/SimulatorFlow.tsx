"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Check,
  Loader2,
  CalendarCheck2,
  Sparkles,
  AlertCircle,
  RotateCcw,
  User,
  HeartPulse,
  Target,
  Rocket,
  MessageSquare,
} from "lucide-react";
import {
  SIMULATORS,
  type SimulatorId,
  type QuestionOption,
} from "@/lib/simulators";
import type { Recommendation } from "@/lib/recommend";
import {
  UNIFIED_FORM,
  UNIFIED_SECTIONS,
  fieldsBySection,
  type FormField,
} from "@/lib/unified-flow";

/* ─────────────────────────── Types ─────────────────────────── */

type Phase = "form" | "result";

type FormValues = Record<string, string>;

const SECTION_ICONS: Record<string, typeof User> = {
  contact: User,
  profile: HeartPulse,
  goal: Target,
  project: Rocket,
  message: MessageSquare,
};

/** Routing fields sent to /api/leads/complete. */
const ROUTING_FIELDS = ["objective", "zone", "intensity", "lifestyle", "budget"];

/** Additional project fields for /complete. */
const PROJECT_FIELDS = ["timeframe", "availability", "source"];

/* ═══════════════════════════ MAIN FLOW ═══════════════════════════ */

export default function SimulatorFlow({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [values, setValues] = useState<FormValues>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pickedSim, setPickedSim] = useState<SimulatorId | null>(null);
  const [firstName, setFirstName] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const requiredFields = useMemo(
    () => UNIFIED_FORM.filter((f) => f.required),
    []
  );

  const answered = requiredFields.filter((f) => (values[f.id] ?? "").trim().length > 0).length;
  const totalRequired = requiredFields.length;
  const progressPct = Math.round((answered / totalRequired) * 100);

  const canSubmit = answered === totalRequired && consent && !submitting;

  /* ──────────── Submit ──────────── */

  const submitForm = async () => {
    setError(null);
    setSubmitting(true);
    try {
      // Step 1 — create partial lead (contact + profile)
      const startPayload: Record<string, unknown> = {
        firstName: values.firstName?.trim(),
        lastName: values.lastName?.trim(),
        email: values.email?.trim(),
        phone: values.phone?.trim(),
        city: values.city?.trim(),
        age: values.age ? Number(values.age) : undefined,
        sex: values.sex,
        heightCm: values.height ? Number(values.height) : undefined,
        weightKg: values.weight ? Number(values.weight) : undefined,
        simulator: "auto",
        consent,
        company: "",
      };

      const r1 = await fetch("/api/leads/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(startPayload),
      });
      if (r1.status === 429)
        throw new Error("Trop de tentatives — réessayez dans une minute.");
      const j1 = await r1.json().catch(() => ({}));
      if (!r1.ok) {
        const detail =
          j1.details &&
          typeof j1.details === "object" &&
          Object.values(j1.details as Record<string, string[]>)
            .flat()
            .filter(Boolean)[0];
        throw new Error(detail || j1.error || "Erreur lors de l'envoi.");
      }

      setFirstName(values.firstName?.trim() || "");
      const leadId = j1.id as string;

      // Step 2 — enrich with routing + project answers
      const answers: Record<string, string> = {};
      for (const id of [...ROUTING_FIELDS, ...PROJECT_FIELDS]) {
        const v = values[id];
        if (v) answers[id] = v;
      }

      const r2 = await fetch("/api/leads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: leadId,
          simulator: "auto",
          answers,
          message: values.message || "",
          company: "",
        }),
      });
      const j2 = await r2.json().catch(() => ({}));
      if (!r2.ok) throw new Error(j2.error || "Erreur serveur.");

      if (j2.recommendation) setRec(j2.recommendation as Recommendation);
      if (j2.simulator?.id) setPickedSim(j2.simulator.id as SimulatorId);

      setPhase("result");
      if (onComplete) onComplete();
      // scroll to top of flow for nice reveal
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setSubmitting(false);
    }
  };

  const resetAll = () => {
    setValues({});
    setConsent(false);
    setRec(null);
    setPickedSim(null);
    setError(null);
    setPhase("form");
    setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  /* ──────────── Render ──────────── */

  return (
    <div ref={rootRef} className="relative">
      {phase === "form" && (
        <>
          {/* Sticky progress header */}
          <StickyProgress
            answered={answered}
            total={totalRequired}
            pct={progressPct}
          />

          <div className="space-y-12 md:space-y-16">
            {UNIFIED_SECTIONS.map((section, sectionIndex) => (
              <SectionBlock
                key={section.id}
                section={section}
                sectionIndex={sectionIndex}
                values={values}
                setValue={(id, v) => setValues((s) => ({ ...s, [id]: v }))}
              />
            ))}

            {/* Consent + submit */}
            <motion.section
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="scroll-mt-24"
            >
              <div className="card-3d p-6 md:p-8">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 md:p-5">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-1 h-4 w-4 flex-shrink-0 rounded border-surface-300 accent-brand-500"
                    required
                  />
                  <span className="text-[13px] leading-relaxed text-forest-700/80">
                    J'accepte d'être recontacté(e) par Body Institut et que mes
                    données soient traitées pour préparer mon analyse
                    personnalisée et mon bilan offert.
                    <span className="mt-1 block text-[11px] text-forest-700/55">
                      RGPD · données stockées en France · désinscription sur
                      simple demande.
                    </span>
                  </span>
                </label>

                {error && (
                  <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    {error}
                  </p>
                )}

                <button
                  type="button"
                  onClick={submitForm}
                  disabled={!canSubmit}
                  className="btn-primary btn-lg mt-6 w-full disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-forest-700/40 disabled:shadow-none md:text-lg"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Analyse en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      {answered < totalRequired
                        ? `Réponses : ${answered}/${totalRequired}`
                        : "Obtenir mon analyse personnalisée"}
                      {answered === totalRequired && (
                        <ArrowRight className="h-5 w-5" />
                      )}
                    </>
                  )}
                </button>

                <p className="mt-3 text-center text-[11px] uppercase tracking-[0.22em] text-forest-700/45">
                  Vos données · RGPD · Zéro engagement
                </p>
              </div>
            </motion.section>
          </div>
        </>
      )}

      {phase === "result" && rec && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ResultStep
            firstName={firstName}
            recommendation={rec}
            pickedSimulator={pickedSim}
            onReset={resetAll}
          />
        </motion.div>
      )}
    </div>
  );
}

/* ═══════════════════════════ Sticky progress ═══════════════════════════ */

function StickyProgress({
  answered,
  total,
  pct,
}: {
  answered: number;
  total: number;
  pct: number;
}) {
  return (
    <div className="sticky top-16 z-20 -mx-5 mb-10 border-b border-surface-200 bg-white/80 px-5 py-3 backdrop-blur-xl md:-mx-10 md:rounded-t-[2.5rem] md:px-10">
      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
          Progression
        </span>
        <span className="text-sm font-medium tabular-nums text-forest-800">
          {answered} / {total}
          <span className="ml-2 text-forest-700/45">· {pct}%</span>
        </span>
      </div>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-surface-200">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-forest-800 via-sand-500 to-sand-300"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}

/* ═══════════════════════════ Section ═══════════════════════════ */

function SectionBlock({
  section,
  sectionIndex,
  values,
  setValue,
}: {
  section: { id: string; title: string; subtitle: string };
  sectionIndex: number;
  values: FormValues;
  setValue: (id: string, v: string) => void;
}) {
  const fields = fieldsBySection(section.id);
  const Icon = SECTION_ICONS[section.id] ?? User;
  const answered = fields.filter(
    (f) => !f.required || (values[f.id] ?? "").trim().length > 0
  ).length;
  const done = answered === fields.length;

  return (
    <motion.section
      id={`section-${section.id}`}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="scroll-mt-24"
    >
      <div className="mb-6 flex items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="grid h-11 w-11 flex-shrink-0 place-items-center rounded-2xl border border-surface-200 bg-white text-forest-800 shadow-card-soft">
            <Icon className="h-5 w-5" />
          </span>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-sand-600">
              Section {sectionIndex + 1} / {UNIFIED_SECTIONS.length}
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight text-forest-800 md:text-3xl">
              {section.title}
            </h2>
            <p className="mt-1 max-w-xl text-sm text-forest-700/65 md:text-base">
              {section.subtitle}
            </p>
          </div>
        </div>
        {done && (
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="hidden h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-sand-500 text-white shadow-card-soft md:grid"
            aria-label="Section complétée"
          >
            <Check className="h-4 w-4" strokeWidth={3} />
          </motion.span>
        )}
      </div>

      <div className="grid gap-4">
        {fields.map((field, i) => (
          <FieldCard
            key={field.id}
            field={field}
            value={values[field.id] ?? ""}
            onChange={(v) => setValue(field.id, v)}
            index={i}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════ Field (card per question) ═══════════════════════════ */

function FieldCard({
  field,
  value,
  onChange,
  index,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  index: number;
}) {
  const isOptions = field.type === "options";
  const isAnswered = (value ?? "").trim().length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        duration: 0.5,
        delay: index * 0.04,
        ease: [0.22, 1, 0.36, 1],
      }}
      className={`card-3d relative overflow-hidden p-5 md:p-7 ${
        isAnswered ? "ring-1 ring-sand-300/50" : ""
      }`}
    >
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-sand-600">
              {field.step}
              {field.required && <span className="ml-1 text-sand-500">·</span>}
            </p>
            <h3 className="mt-1.5 text-lg font-semibold tracking-tight text-forest-800 md:text-xl">
              {field.title}
            </h3>
            {field.subtitle && (
              <p className="mt-1 text-sm text-forest-700/65">
                {field.subtitle}
              </p>
            )}
          </div>
          {isAnswered && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 14 }}
              className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-forest-800 text-white"
              aria-label="Répondu"
            >
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </motion.span>
          )}
        </div>

        {isOptions ? (
          <OptionsGrid
            options={field.options ?? []}
            value={value}
            onChange={onChange}
          />
        ) : field.type === "textarea" ? (
          <textarea
            rows={4}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            className="w-full resize-none rounded-2xl border border-surface-200 bg-white/90 px-4 py-3 text-sm text-forest-800 outline-none transition-all placeholder:text-forest-700/35 focus:border-forest-700 focus:ring-4 focus:ring-forest-800/10"
          />
        ) : (
          <div className="relative">
            <input
              type={field.type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              autoComplete={field.autocomplete}
              min={field.min}
              max={field.max}
              inputMode={
                field.type === "tel"
                  ? "tel"
                  : field.type === "email"
                    ? "email"
                    : field.type === "number"
                      ? "numeric"
                      : "text"
              }
              className="w-full rounded-2xl border border-surface-200 bg-white/90 px-4 py-3 pr-16 text-base text-forest-800 outline-none transition-all placeholder:text-forest-700/35 focus:border-forest-700 focus:ring-4 focus:ring-forest-800/10"
            />
            {field.unit && (
              <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-[0.22em] text-forest-700/45">
                {field.unit}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ═══════════════════════════ Options grid ═══════════════════════════ */

function OptionsGrid({
  options,
  value,
  onChange,
}: {
  options: QuestionOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const cols =
    options.length >= 6
      ? "sm:grid-cols-2 md:grid-cols-3"
      : options.length >= 4
        ? "sm:grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <div className={`grid gap-2.5 ${cols}`}>
      {options.map((o) => (
        <OptionCard
          key={o.id}
          option={o}
          active={value === o.id}
          onClick={() => onChange(o.id)}
        />
      ))}
    </div>
  );
}

function OptionCard({
  option,
  active,
  onClick,
}: {
  option: QuestionOption;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`group relative flex h-full items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-forest-800 bg-forest-800 text-white shadow-3d"
          : "border-surface-200 bg-white text-forest-700 hover:border-forest-700/40"
      }`}
    >
      {option.emoji && (
        <span className={`text-lg ${active ? "" : ""}`} aria-hidden="true">
          {option.emoji}
        </span>
      )}
      <div className="flex-1">
        <div
          className={`text-[14px] font-medium ${
            active ? "text-white" : "text-forest-800"
          }`}
        >
          {option.label}
        </div>
        {option.sub && (
          <div
            className={`mt-0.5 text-[12px] ${
              active ? "text-white/70" : "text-forest-700/60"
            }`}
          >
            {option.sub}
          </div>
        )}
      </div>
      <span
        className={`mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border transition-all ${
          active
            ? "border-white bg-white text-forest-800"
            : "border-surface-300 text-transparent"
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={3} />
      </span>
    </motion.button>
  );
}

/* ═══════════════════════════ RESULT ═══════════════════════════ */

function ResultStep({
  firstName,
  recommendation,
  pickedSimulator,
  onReset,
}: {
  firstName: string;
  recommendation: Recommendation;
  pickedSimulator: SimulatorId | null;
  onReset: () => void;
}) {
  const planityUrl =
    process.env.NEXT_PUBLIC_BOOKING_URL || "https://www.planity.com";
  const sim = pickedSimulator ? SIMULATORS[pickedSimulator] : null;

  return (
    <div className="space-y-6">
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-3xl border border-sand-200 bg-gradient-to-br from-sand-50 to-white p-6 shadow-3d md:p-8"
      >
        <div className="flex items-start gap-4">
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              duration: 0.5,
              delay: 0.15,
              type: "spring",
              stiffness: 180,
            }}
            className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-full bg-forest-800 text-white shadow-brand-glow"
          >
            <Check className="h-6 w-6" strokeWidth={3} />
          </motion.span>
          <div className="flex-1">
            <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sand-700">
              Analyse enregistrée
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-forest-800 md:text-3xl">
              Merci{firstName ? `, ${firstName}` : ""} !
            </h3>
            <p className="mt-2 text-sm text-forest-700/75 md:text-base">
              Une experte Body Institut vous rappelle sous 24 h pour votre
              bilan offert.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Main result card */}
      <div className="card-3d relative overflow-hidden p-6 md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-60 w-60 rounded-full bg-sand-300/20 blur-3xl" />

        <div className="relative space-y-6">
          <div>
            <p className="eyebrow">Soin recommandé</p>
            <h3 className="mt-3 text-3xl font-semibold tracking-tight text-forest-800 md:text-5xl">
              {recommendation.primary.simulatorName}
            </h3>
            <p className="mt-2 text-sm text-forest-700/65 md:text-base">
              {recommendation.primary.mode === "cure"
                ? "Cure recommandée"
                : "Séance découverte"}{" "}
              · {recommendation.primary.zoneTierLabel}
              {sim ? ` · ${sim.tagline}` : ""}
            </p>
          </div>

          {/* Pricing — 3 cells */}
          <div className="grid grid-cols-3 gap-3 rounded-2xl border border-surface-200 bg-surface-50 p-4 md:p-6">
            <Cell
              label="Séance"
              value={`${recommendation.primary.pricePerSession} €`}
            />
            <Cell
              label="Cure"
              value={`${recommendation.primary.cureTotal} €`}
              hint={`${recommendation.primary.cureSize} séances`}
            />
            <Cell
              label={recommendation.duo ? "Total duo" : "Total"}
              value={`${recommendation.estimatedTotal.toLocaleString("fr-FR")} €`}
              accent
            />
          </div>

          {/* Expected result */}
          <div className="rounded-2xl border border-surface-200 bg-white p-4 md:p-6">
            <p className="text-[10px] uppercase tracking-[0.22em] text-sand-600">
              Résultat estimé
            </p>
            <p className="mt-2 text-xl font-semibold text-forest-800 md:text-2xl">
              {recommendation.resultText}
            </p>
            <p className="mt-2 text-xs text-forest-700/55">
              Projection personnalisée basée sur vos réponses. Les résultats
              varient selon chaque personne.
            </p>
          </div>

          {/* Duo offer */}
          {recommendation.duo && recommendation.complementary && (
            <DuoOffer rec={recommendation} />
          )}

          <p className="rounded-xl border border-surface-200 bg-surface-50 p-3 text-[11px] text-forest-700/60">
            <AlertCircle className="mr-1.5 inline h-3 w-3 align-text-bottom text-sand-600" />
            Estimation indicative — votre experte affinera lors du bilan.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <a
          href={planityUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-lg w-full sm:flex-1"
        >
          <CalendarCheck2 className="h-4 w-4" />
          Réserver mon bilan offert
        </a>
        <button
          type="button"
          onClick={onReset}
          className="btn-ghost w-full sm:w-auto"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Recommencer
        </button>
      </div>
    </div>
  );
}

function DuoOffer({ rec }: { rec: Recommendation }) {
  if (!rec.duo || !rec.complementary) return null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1 }}
      className="relative overflow-hidden rounded-2xl border border-sand-300 bg-gradient-to-br from-sand-50 to-white p-5 md:p-6"
    >
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-sand-300/40 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-sand-600" />
          <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-sand-700">
            Offre duo · −40 %
          </p>
        </div>
        <h4 className="mt-2.5 text-xl font-semibold tracking-tight text-forest-800 md:text-2xl">
          {rec.primary.simulatorName} + {rec.complementary.simulatorName}
        </h4>
        <p className="mt-1.5 text-sm text-forest-700/75">
          {rec.complementary.reason}
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-sand-200 pt-4 text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
              Sans remise
            </p>
            <p className="mt-1 text-base text-forest-700/70 line-through">
              {rec.duo.baseTotal.toLocaleString("fr-FR")} €
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
              Économie
            </p>
            <p className="mt-1 text-base font-medium text-sand-700">
              −{rec.duo.discount.toLocaleString("fr-FR")} €
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
              Total
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-forest-800">
              {rec.duo.finalTotal.toLocaleString("fr-FR")} €
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function Cell({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.22em] text-sand-600">
        {label}
      </p>
      <p
        className={`mt-1.5 text-lg font-semibold tracking-tight md:text-2xl ${
          accent ? "text-gradient-brand" : "text-forest-800"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-0.5 text-[10px] text-forest-700/50">{hint}</p>}
    </div>
  );
}
