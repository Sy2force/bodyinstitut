"use client";

import { useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronLeft,
  ChevronRight,
  Clock,
  Mail,
  ShieldCheck,
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
import { usePresence } from "@/hooks/usePresence";
import { trackEvent } from "@/hooks/useTrackEvent";

/* ─────────────────────────── Types ─────────────────────────── */

type Phase = "form" | "result";

type FormValues = Record<string, string>;

type FormStep = 1 | 2 | 3;

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

/* ─────────────────────────── Step Configuration ─────────────────────────── */

// Optimized for conversion: Goal first (exciting), then Profile, then Contact
const STEP_SECTIONS: Record<FormStep, string[]> = {
  1: ["goal"],           // Objectif + Zone = priorités de transformation
  2: ["profile"],        // Profil physique pour calibrage
  3: ["contact", "project", "message"], // Contact + Délai + Message optionnel
};

const STEP_TITLES: Record<FormStep, { title: string; subtitle: string }> = {
  1: { 
    title: "Votre objectif de transformation", 
    subtitle: "En 2 minutes, découvrez votre protocole personnalisé" 
  },
  2: { 
    title: "Votre profil physique", 
    subtitle: "Pour calibrer précisément votre bilan" 
  },
  3: { 
    title: "Votre bilan personnalisé est prêt !", 
    subtitle: "Recevez-le gratuitement par email et SMS" 
  },
};

const STEP_ICONS: Record<FormStep, typeof Target> = {
  1: Target,
  2: HeartPulse,
  3: Sparkles,
};

/* ═══════════════════════════ MAIN FLOW ═══════════════════════════ */

export default function SimulatorFlow({
  onComplete,
}: {
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState<Phase>("form");
  const [currentStep, setCurrentStep] = useState<FormStep>(1);
  const [values, setValues] = useState<FormValues>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rec, setRec] = useState<Recommendation | null>(null);
  const [pickedSim, setPickedSim] = useState<SimulatorId | null>(null);
  const [firstName, setFirstName] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const presencePage =
    phase === "result"
      ? "simulator:result"
      : `simulator:${currentStep}`;
  usePresence(presencePage);

  // Track first interaction (simulator opened)
  const openFired = useRef(false);

  // Track step advances
  const trackedStep = useRef<number>(1);

  const requiredFields = useMemo(
    () => UNIFIED_FORM.filter((f) => f.required),
    []
  );

  // Progress for all steps
  const answered = requiredFields.filter((f) => (values[f.id] ?? "").trim().length > 0).length;
  const totalRequired = requiredFields.length;
  const totalProgressPct = Math.round((answered / totalRequired) * 100);

  // Progress for current step
  const currentStepSections = STEP_SECTIONS[currentStep];
  const currentStepFields = useMemo(
    () => UNIFIED_FORM.filter((f) => currentStepSections.includes(f.section)),
    [currentStepSections]
  );
  const currentStepRequiredFields = currentStepFields.filter((f) => f.required);
  const currentStepAnswered = currentStepRequiredFields.filter(
    (f) => (values[f.id] ?? "").trim().length > 0
  ).length;
  const currentStepTotal = currentStepRequiredFields.length;
  const currentStepProgressPct = currentStepTotal > 0 
    ? Math.round((currentStepAnswered / currentStepTotal) * 100) 
    : 100;

  const canSubmit = answered === totalRequired && consent && !submitting;

  // Check if current step is complete
  const isCurrentStepComplete = currentStepAnswered === currentStepTotal;

  // Navigation handlers
  const goToNextStep = () => {
    if (currentStep < 3 && isCurrentStepComplete) {
      const next = (currentStep + 1) as FormStep;
      setCurrentStep(next);
      if (next > trackedStep.current) {
        trackedStep.current = next;
        trackEvent(next === 2 ? "step_2" : "step_3");
      }
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep((s) => (s - 1) as FormStep);
      setTimeout(() => {
        rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    }
  };

  /* ──────────── Submit ──────────── */

  const submitForm = async () => {
    setError(null);
    setSubmitting(true);
    trackEvent("submitted");
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
      trackEvent("result");
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
    setCurrentStep(1);
    setPhase("form");
    setTimeout(() => {
      rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  /* ──────────── Render ──────────── */

  const stepInfo = STEP_TITLES[currentStep];
  const StepIcon = STEP_ICONS[currentStep];

  return (
    <div ref={rootRef} className="relative">
      {phase === "form" && (
        <>
          {/* Step Progress Header */}
          <StepProgress
            currentStep={currentStep}
            totalSteps={3}
            stepAnswered={currentStepAnswered}
            stepTotal={currentStepTotal}
            stepPct={currentStepProgressPct}
            totalAnswered={answered}
            totalRequired={totalRequired}
            totalPct={totalProgressPct}
          />

          {/* Bilan Header Card */}
          <motion.div
            key={`header-${currentStep}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="mb-8"
          >
            {/* Bilan Badge */}
            <div className="mb-6 flex items-center justify-center gap-2">
              <motion.div 
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-forest-800 to-forest-700 px-4 py-2 text-white shadow-lg"
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <StepIcon className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Bilan gratuit · Étape {currentStep}/3
                </span>
              </motion.div>
            </div>

            {/* Title Card */}
            <div className="rounded-2xl border border-sand-200 bg-gradient-to-br from-sand-50 to-white p-4 text-center shadow-sm sm:p-6 md:p-8">
              <h2 className="text-xl font-bold tracking-tight text-forest-900 sm:text-2xl md:text-3xl">
                {stepInfo.title}
              </h2>
              <p className="mt-2 text-base text-forest-700/70 md:text-lg">
                {stepInfo.subtitle}
              </p>
              
              {/* Trust badges */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-[11px] text-forest-600/60">
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-500" />
                  Gratuit
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-500" />
                  Sans engagement
                </span>
                <span className="inline-flex items-center gap-1">
                  <Check className="h-3 w-3 text-brand-500" />
                  Résultat immédiat
                </span>
              </div>
            </div>
          </motion.div>

          {/* Step Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`step-${currentStep}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-8"
            >
              {/* Sections for current step */}
              {UNIFIED_SECTIONS.filter((s) => STEP_SECTIONS[currentStep].includes(s.id))
                .map((section, sectionIndex) => (
                  <BilanSectionBlock
                    key={section.id}
                    section={section}
                    sectionIndex={sectionIndex}
                    stepNumber={currentStep}
                    values={values}
                    setValue={(id, v) => {
                      if (!openFired.current) {
                        openFired.current = true;
                        trackEvent("simulator_open");
                      }
                      setValues((s) => ({ ...s, [id]: v }));
                    }}
                  />
                ))}

              {/* Step 3: Consent + Submit */}
              {currentStep === 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
                  className="rounded-2xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 via-white to-sand-50 p-4 shadow-lg sm:p-6 md:p-8"
                >
                  {/* Value proposition */}
                  <div className="mb-6 text-center">
                    <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg">
                      <Sparkles className="h-7 w-7" />
                    </div>
                    <h3 className="text-lg font-semibold text-forest-900">
                      Votre protocole personnalisé vous attend
                    </h3>
                    <p className="mt-1 text-sm text-forest-700/70">
                      Recevez votre analyse complète + estimation tarifaire en 2 min
                    </p>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-surface-200 bg-white p-4 transition-all hover:border-brand-300 md:p-5">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(e) => setConsent(e.target.checked)}
                      className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-surface-300 accent-brand-500"
                      required
                    />
                    <span className="text-[13px] leading-relaxed text-forest-700/80">
                      J'accepte de recevoir mon bilan gratuit par email et d'être rappelée 
                      par un(e) expert(e) Body Institut pour affiner ma recommandation.
                      <span className="mt-1 block text-[11px] text-forest-700/50">
                        RGPD · Désinscription instantanée · Données sécurisées
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
                    className="btn-primary btn-lg mt-6 w-full bg-gradient-to-r from-brand-600 to-brand-500 disabled:cursor-not-allowed disabled:bg-surface-200 disabled:text-forest-700/40 disabled:shadow-none md:text-lg"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Génération de votre bilan...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5" />
                        {answered < totalRequired
                          ? `Complétez vos infos (${answered}/${totalRequired})`
                          : "Recevoir mon bilan GRATUIT"}
                        {answered === totalRequired && (
                          <ArrowRight className="h-5 w-5" />
                        )}
                      </>
                    )}
                  </button>

                  <p className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-center text-[11px] text-forest-700/40">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      2 minutes
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      Reçu instantanément
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      100% confidentiel
                    </span>
                  </p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={goToPrevStep}
              disabled={currentStep === 1}
              className="group flex items-center gap-2 rounded-full border border-surface-200 bg-white px-4 py-2 text-sm font-medium text-forest-700 transition-all hover:border-forest-300 hover:bg-surface-50 disabled:cursor-not-allowed disabled:border-surface-100 disabled:bg-surface-100 disabled:text-forest-700/30"
            >
              <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              Retour
            </button>

            {/* Step indicators */}
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step < currentStep) {
                      setCurrentStep(step as FormStep);
                    }
                  }}
                  className={`h-2 rounded-full transition-all ${
                    step === currentStep
                      ? "w-8 bg-forest-800"
                      : step < currentStep
                        ? "w-2 bg-forest-800"
                        : "w-2 bg-surface-300"
                  }`}
                  aria-label={`Étape ${step}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={goToNextStep}
              disabled={currentStep === 3 || !isCurrentStepComplete}
              className="group flex items-center gap-2 rounded-full bg-forest-800 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-forest-800/20 transition-all hover:bg-forest-700 hover:shadow-xl hover:shadow-forest-800/30 disabled:cursor-not-allowed disabled:bg-surface-300 disabled:shadow-none"
            >
              {currentStep < 3 ? (
                <>
                  Continuer
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </>
              ) : (
                <>
                  Terminer
                  <Check className="h-4 w-4" />
                </>
              )}
            </button>
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

/* ═══════════════════════════ Step progress ═══════════════════════════ */

function StepProgress({
  currentStep,
  totalSteps,
  stepAnswered,
  stepTotal,
  stepPct,
  totalAnswered,
  totalRequired,
  totalPct,
}: {
  currentStep: number;
  totalSteps: number;
  stepAnswered: number;
  stepTotal: number;
  stepPct: number;
  totalAnswered: number;
  totalRequired: number;
  totalPct: number;
}) {
  return (
    <div className="mb-8 rounded-2xl border border-surface-200 bg-white p-4 shadow-sm md:p-6">
      {/* Step pills */}
      <div className="mb-3 flex items-center justify-center gap-2">
        {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
          <div
            key={step}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
              step === currentStep
                ? "bg-forest-800 text-white shadow-md"
                : step < currentStep
                  ? "bg-brand-100 text-forest-800"
                  : "bg-sand-100 text-forest-700/60"
            }`}
          >
            {step < currentStep ? (
              <Check className="h-3 w-3" />
            ) : (
              <span className="tabular-nums">{step}</span>
            )}
            <span className="hidden sm:inline">
              {step === 1 && "Objectif"}
              {step === 2 && "Profil"}
              {step === 3 && "Finalisation"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-[11px] uppercase tracking-[0.22em] text-forest-700/55">
          Étape {currentStep}
        </span>
        <span className="text-sm font-medium tabular-nums text-forest-800">
          {stepAnswered} / {stepTotal}
          <span className="ml-2 text-forest-700/45">· {stepPct}%</span>
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-sand-100">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-forest-800 via-sand-500 to-sand-300"
          initial={false}
          animate={{ width: `${stepPct}%` }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>

      {/* Total progress mini */}
      <div className="mt-2 flex items-center justify-between gap-2 text-[10px] text-forest-700/40">
        <span>Progression totale</span>
        <span>{totalAnswered}/{totalRequired} · {totalPct}%</span>
      </div>
    </div>
  );
}

/* ═══════════════════════════ Bilan Section ═══════════════════════════ */

function BilanSectionBlock({
  section,
  sectionIndex,
  stepNumber,
  values,
  setValue,
}: {
  section: { id: string; title: string; subtitle: string };
  sectionIndex: number;
  stepNumber: number;
  values: FormValues;
  setValue: (id: string, v: string) => void;
}) {
  const fields = fieldsBySection(section.id);
  const Icon = SECTION_ICONS[section.id] ?? User;
  const answered = fields.filter(
    (f) => !f.required || (values[f.id] ?? "").trim().length > 0
  ).length;
  const done = answered === fields.length;

  // Get section label based on step
  const sectionLabel = stepNumber === 1 
    ? "OBJECTIF" 
    : stepNumber === 2 
      ? "PROFIL" 
      : "COORDONNÉES";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: sectionIndex * 0.1 }}
      className="scroll-mt-24"
    >
      {/* Section header - cleaner, more symmetric */}
      <div className="mb-5 rounded-2xl border border-sand-200 bg-gradient-to-br from-sand-50/80 to-white p-5 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`grid h-11 w-11 flex-shrink-0 place-items-center rounded-xl shadow-sm transition-all ${
                done
                  ? "bg-brand-500 text-white"
                  : "bg-white text-forest-800 border border-sand-200"
              }`}
            >
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-sand-600">
                {sectionLabel}
              </span>
              <h3 className="text-lg font-bold tracking-tight text-forest-900">
                {section.title}
              </h3>
            </div>
          </div>
          
          {done && (
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-brand-500 text-white">
              <Check className="h-3.5 w-3.5" strokeWidth={3} />
            </span>
          )}
        </div>
        
        <p className="mt-3 text-sm text-forest-700/60 md:text-[15px]">
          {section.subtitle}
        </p>
      </div>

      {/* Fields - symmetric grid */}
      <div className="grid gap-4 md:gap-5">
        {fields.map((field) => (
          <BilanFieldRow
            key={field.id}
            field={field}
            value={values[field.id] ?? ""}
            onChange={(v) => setValue(field.id, v)}
          />
        ))}
      </div>
    </motion.section>
  );
}

/* ═══════════════════════════ Bilan Field ═══════════════════════════ */

function BilanFieldRow({
  field,
  value,
  onChange,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
}) {
  const isEmpty = value.trim().length === 0;
  const showError = field.required && isEmpty;
  const isDone = !isEmpty;

  return (
    <div className={`rounded-2xl border bg-white p-6 shadow-sm transition-all focus-within:border-brand-400 focus-within:shadow-lg md:p-7 ${
      isDone 
        ? "border-brand-300 bg-gradient-to-br from-brand-50/50 to-white shadow-md" 
        : "border-surface-200 hover:border-surface-300"
    }`}>
      {/* Clean header with step indicator */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className={`flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-bold transition-all ${
            isDone 
              ? "bg-brand-500 text-white shadow-md" 
              : "bg-surface-200 text-forest-700/60"
          }`}>
            {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : field.step.charAt(0)}
          </span>
          <span className="text-[12px] font-bold uppercase tracking-[0.12em] text-sand-600">
            {field.step}
          </span>
        </div>
        {field.required && !isDone && (
          <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-medium text-rose-600 border border-rose-100">
            À compléter
          </span>
        )}
        {isDone && (
          <span className="rounded-full bg-brand-50 px-3 py-1 text-[11px] font-medium text-brand-700 border border-brand-100">
            Complété
          </span>
        )}
      </div>

      {/* Title with better hierarchy */}
      <label className="mb-2 block text-lg font-bold text-forest-900">
        {field.title}
      </label>
      {field.subtitle && (
        <p className="mb-5 text-[14px] leading-relaxed text-forest-600">
          {field.subtitle}
        </p>
      )}

      {/* Input - symmetric and clean */}
      <div className="mt-4">
        {field.type === "options" ? (
          <OptionsGrid
            options={field.options ?? []}
            value={value}
            onChange={onChange}
          />
        ) : field.type === "textarea" ? (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            rows={4}
            className="w-full rounded-xl border border-surface-300 bg-surface-50 px-5 py-4 text-[16px] text-forest-800 placeholder:text-forest-500/50 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 transition-all resize-none"
          />
        ) : (
          <div className="flex items-center gap-3">
            <input
              type={field.type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              autoComplete={field.autocomplete}
              className="flex-1 rounded-xl border border-surface-300 bg-surface-50 px-5 py-4 text-[16px] text-forest-800 placeholder:text-forest-500/50 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-100 transition-all"
            />
            {field.unit && (
              <span className="text-[16px] font-semibold text-forest-600 px-2">
                {field.unit}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
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
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 20 }}
      className={`group relative flex min-h-[72px] w-full items-center gap-3 rounded-xl border p-4 text-left transition-all duration-300 ${
        active
          ? "border-forest-800 bg-forest-800 text-white shadow-lg"
          : "border-surface-200 bg-white text-forest-700 hover:border-brand-400 hover:shadow-md"
      }`}
    >
      <div className="flex-1 min-w-0">
        <div
          className={`text-[15px] font-semibold leading-tight ${
            active ? "text-white" : "text-forest-900"
          }`}
        >
          {option.label}
        </div>
        {option.sub && (
          <div
            className={`mt-1 text-[13px] leading-snug ${
              active ? "text-white/80" : "text-forest-600"
            }`}
          >
            {option.sub}
          </div>
        )}
      </div>
      <span
        className={`grid h-6 w-6 flex-shrink-0 place-items-center rounded-full border-2 transition-all ${
          active
            ? "border-white bg-white text-forest-800"
            : "border-surface-300 text-transparent group-hover:border-brand-300"
        }`}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} />
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
