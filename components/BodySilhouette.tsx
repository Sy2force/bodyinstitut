"use client";

import { motion } from "framer-motion";
import { useId } from "react";

const ZONE_PATHS: Record<
  string,
  { cx: number; cy: number; rx: number; ry: number; label: string }
> = {
  ventre: { cx: 100, cy: 178, rx: 22, ry: 22, label: "Ventre" },
  flancs: { cx: 100, cy: 178, rx: 38, ry: 16, label: "Flancs" },
  cuisses: { cx: 100, cy: 252, rx: 30, ry: 36, label: "Cuisses" },
  hanches: { cx: 100, cy: 218, rx: 34, ry: 14, label: "Hanches" },
  bras: { cx: 100, cy: 150, rx: 50, ry: 14, label: "Bras" },
  dos: { cx: 100, cy: 150, rx: 30, ry: 28, label: "Dos" },
  jambes: { cx: 100, cy: 320, rx: 26, ry: 50, label: "Jambes" },
  fessiers: { cx: 100, cy: 218, rx: 28, ry: 16, label: "Fessiers" },
  abdos: { cx: 100, cy: 178, rx: 20, ry: 26, label: "Abdomen" },
  visage: { cx: 100, cy: 56, rx: 16, ry: 18, label: "Visage" },
  decollete: { cx: 100, cy: 112, rx: 24, ry: 10, label: "Décolleté" },
};

const BODY_PATH = `
  M 100 30
  C 86 30 76 42 76 56
  C 76 68 84 78 92 82
  L 92 92
  C 80 96 70 102 64 110
  C 56 120 50 130 48 142
  C 42 156 40 174 42 196
  C 44 206 50 214 54 220
  C 50 226 48 234 50 244
  C 52 256 56 268 60 280
  C 64 296 66 318 66 340
  C 66 360 66 376 70 388
  L 84 388
  C 86 376 86 360 86 348
  C 86 326 88 308 92 290
  C 96 274 98 258 100 244
  C 102 258 104 274 108 290
  C 112 308 114 326 114 348
  C 114 360 114 376 116 388
  L 130 388
  C 134 376 134 360 134 340
  C 134 318 136 296 140 280
  C 144 268 148 256 150 244
  C 152 234 150 226 146 220
  C 150 214 156 206 158 196
  C 160 174 158 156 152 142
  C 150 130 144 120 136 110
  C 130 102 120 96 108 92
  L 108 82
  C 116 78 124 68 124 56
  C 124 42 114 30 100 30 Z
`;

interface Props {
  highlightZone?: string;
  glow: string;
  reveal?: boolean;
  intensity?: number;
}

export default function BodySilhouette({
  highlightZone,
  glow,
  reveal = false,
  intensity = 0.6,
}: Props) {
  const id = useId().replace(/[:]/g, "");
  const zone = highlightZone ? ZONE_PATHS[highlightZone] : undefined;
  const shrinkX = reveal ? 1 - intensity * 0.06 : 1;
  const shrinkY = reveal ? 1 - intensity * 0.02 : 1;

  return (
    <div className="relative mx-auto w-full max-w-[240px]">
      <svg
        viewBox="0 0 200 420"
        className="h-auto w-full"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`body-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#fbf9f4" stopOpacity="0.95" />
            <stop offset="60%" stopColor="#f3ede3" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
          </linearGradient>

          <linearGradient id={`stroke-${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0a0806" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#9a8254" stopOpacity="0.35" />
          </linearGradient>

          <radialGradient id={`zoneGlow-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.9" />
            <stop offset="60%" stopColor={glow} stopOpacity="0.25" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>

          <radialGradient id={`ambient-${id}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={glow} stopOpacity="0.22" />
            <stop offset="100%" stopColor={glow} stopOpacity="0" />
          </radialGradient>

          <filter id={`soft-${id}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" />
          </filter>

          <clipPath id={`clip-${id}`}>
            <path d={BODY_PATH} />
          </clipPath>
        </defs>

        {/* floor halo */}
        <ellipse
          cx="100"
          cy="395"
          rx="60"
          ry="6"
          fill={`url(#ambient-${id})`}
        />

        <motion.g
          initial={false}
          animate={{ scaleX: shrinkX, scaleY: shrinkY }}
          style={{ transformOrigin: "100px 210px" }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <path
            d={BODY_PATH}
            fill={`url(#body-${id})`}
            stroke={`url(#stroke-${id})`}
            strokeWidth="1.4"
          />

          {/* center line */}
          <path
            d="M 100 92 L 100 240"
            stroke="rgba(10,8,6,0.08)"
            strokeWidth="1"
            strokeLinecap="round"
          />

          <g clipPath={`url(#clip-${id})`}>
            {zone && (
              <motion.g
                key={highlightZone}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx + 16}
                  ry={zone.ry + 16}
                  fill={`url(#zoneGlow-${id})`}
                  filter={`url(#soft-${id})`}
                />
                <motion.ellipse
                  cx={zone.cx}
                  cy={zone.cy}
                  rx={zone.rx}
                  ry={zone.ry}
                  fill={glow}
                  opacity={0.2}
                  animate={{ opacity: [0.12, 0.28, 0.12] }}
                  transition={{
                    duration: 2.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
              </motion.g>
            )}
          </g>

          {zone && (
            <motion.ellipse
              key={`ring-${highlightZone}`}
              cx={zone.cx}
              cy={zone.cy}
              rx={zone.rx}
              ry={zone.ry}
              fill="none"
              stroke={glow}
              strokeWidth="1.4"
              strokeDasharray="3 4"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 0.95, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: `${zone.cx}px ${zone.cy}px` }}
            />
          )}
        </motion.g>
      </svg>

      {zone && (
        <motion.div
          key={`label-${highlightZone}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="absolute left-1/2 top-1 -translate-x-1/2 rounded-full border border-sand-200 bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.22em] text-sand-700 backdrop-blur"
        >
          {zone.label}
        </motion.div>
      )}
    </div>
  );
}
