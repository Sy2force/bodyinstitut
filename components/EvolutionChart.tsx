"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface Props {
  glow: string;
  intensity: "leger" | "moyen" | "important" | null;
}

const WEEKS = [0, 1, 2, 3, 4, 5, 6];

export default function EvolutionChart({ glow, intensity }: Props) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const factor =
    intensity === "important" ? 1 : intensity === "moyen" ? 0.7 : 0.45;

  const start = 100;
  const end = 100 - 35 * factor;
  const points = WEEKS.map((w) => {
    const t = w / (WEEKS.length - 1);
    const eased = 1 - Math.pow(1 - t, 2.6);
    return start - eased * (start - end);
  });

  const W = 400;
  const H = 160;
  const padX = 14;
  const padY = 24;
  const xs = WEEKS.map(
    (_, i) => padX + (i * (W - padX * 2)) / (WEEKS.length - 1)
  );
  const minY = Math.min(...points);
  const maxY = Math.max(...points);
  const ys = points.map(
    (p) => padY + ((maxY - p) / (maxY - minY || 1)) * (H - padY * 2)
  );

  const path = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`)
    .join(" ");
  const fill = `${path} L ${xs[xs.length - 1]} ${H} L ${xs[0]} ${H} Z`;

  return (
    <div className="rounded-3xl border border-surface-200 bg-surface-50 p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-[10px] uppercase tracking-[0.22em] text-forest-700/55">
          Courbe d'évolution
        </p>
        <p className="text-[11px] font-medium" style={{ color: glow }}>
          6 semaines · projection
        </p>
      </div>
      <svg
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        className="h-auto w-full"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="evoFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={glow} stopOpacity="0.35" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={W - padX}
            y1={padY + (H - padY * 2) * t}
            y2={padY + (H - padY * 2) * t}
            stroke="rgba(15,46,42,0.08)"
          />
        ))}

        <motion.path
          d={fill}
          fill="url(#evoFill)"
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
        />

        <motion.path
          d={path}
          fill="none"
          stroke={glow}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
        />

        {xs.map((x, i) => (
          <motion.circle
            key={i}
            cx={x}
            cy={ys[i]}
            r={i === xs.length - 1 ? 5 : 2.5}
            fill={i === xs.length - 1 ? "#ffffff" : glow}
            stroke={i === xs.length - 1 ? glow : "none"}
            strokeWidth={i === xs.length - 1 ? 2 : 0}
            initial={{ scale: 0 }}
            animate={inView ? { scale: 1 } : { scale: 0 }}
            transition={{
              duration: 0.35,
              delay: 0.7 + i * 0.08,
              ease: [0.22, 1, 0.36, 1],
            }}
          />
        ))}
      </svg>
      <div className="mt-2 flex justify-between text-[10px] text-forest-700/45">
        <span>S0</span>
        <span>S1</span>
        <span>S2</span>
        <span>S3</span>
        <span>S4</span>
        <span>S5</span>
        <span className="font-medium" style={{ color: glow }}>S6</span>
      </div>
    </div>
  );
}
