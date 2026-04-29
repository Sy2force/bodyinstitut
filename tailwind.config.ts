import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /* ─── Body Institut palette ── Apple warm neutral ─────
         * Primary = near-black (CTA, emphasis)
         * Accent  = warm beige / sand (highlights, eyebrows)
         * Text    = forest-* mapped to near-black/graphite
         * Bg      = surface-* mapped to warm cream
         */
        brand: {
          /* Used for CTAs. 500 = near-black. 50-300 = warm sand tones. */
          50:  "#faf7f2",
          100: "#f4efe4",
          200: "#e8dfc9",
          300: "#d6c6a0",
          400: "#3a3630",
          500: "#17140f", // primary near-black
          600: "#0a0806",
          700: "#1d1b17",
          800: "#0a0906",
          900: "#000000",
        },
        /* Warm beige accent — use for eyebrows, highlights, gold dots. */
        sand: {
          50:  "#fbf9f4",
          100: "#f4efe4",
          200: "#e8dfc9",
          300: "#d6c6a0",
          400: "#c2ae7e",
          500: "#9a8254",
          600: "#7e6940",
          700: "#62522f",
          800: "#4a3d21",
          900: "#2e2513",
        },
        /* "forest" is reused as text-color family. Primary text = 800. */
        forest: {
          50:  "#f5f4f1",
          100: "#e7e5e1",
          300: "#a19d94",
          500: "#6b6760",
          600: "#3a3630",
          700: "#1d1b17",
          800: "#0a0806", // primary text (near-black)
          900: "#000000",
        },
        /* Warm cream surfaces. */
        surface: {
          0:   "#ffffff",
          50:  "#faf7f2",   // warm cream bg
          100: "#f3ede3",   // soft sand
          200: "#e8dfc9",   // sand border
          300: "#d6c6a0",
          400: "#a19d94",
          500: "#6b6760",
          700: "#2e2b26",
          900: "#0a0806",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "system-ui",
          "sans-serif",
        ],
      },
      letterSpacing: {
        tightest: "-0.04em",
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        /* Apple-style depth — ambient + key + contact */
        "brand-glow": "0 30px 80px -20px rgba(10, 8, 6, 0.45), 0 8px 24px -8px rgba(10, 8, 6, 0.18)",
        "card-soft":  "0 1px 2px rgba(10, 8, 6, 0.04), 0 12px 32px -12px rgba(10, 8, 6, 0.10)",
        "card-hover": "0 2px 4px rgba(10, 8, 6, 0.06), 0 30px 60px -20px rgba(10, 8, 6, 0.22)",
        "3d":         "0 1px 0 rgba(255,255,255,0.6) inset, 0 -1px 0 rgba(10,8,6,0.04) inset, 0 24px 48px -16px rgba(10,8,6,0.22), 0 4px 12px -4px rgba(10,8,6,0.12)",
        "3d-lg":      "0 1px 0 rgba(255,255,255,0.7) inset, 0 -1px 0 rgba(10,8,6,0.05) inset, 0 40px 80px -24px rgba(10,8,6,0.28), 0 8px 24px -6px rgba(10,8,6,0.14)",
        "sand-glow":  "0 30px 80px -20px rgba(154, 130, 84, 0.35)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-1000px 0" },
          "100%": { backgroundPosition: "1000px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.8s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        "soft-pulse": "soft-pulse 3s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
      },
      backgroundImage: {
        "hero-fade":
          "radial-gradient(ellipse 80% 60% at 50% 20%, rgba(214,198,160,0.35), transparent 65%)",
        "forest-fade":
          "radial-gradient(ellipse at bottom, rgba(10,8,6,0.06), transparent 70%)",
        "sand-fade":
          "radial-gradient(ellipse 70% 50% at 50% 0%, rgba(154,130,84,0.18), transparent 60%)",
        /* Apple-like grain / noise can be layered via CSS after */
        "cream":
          "linear-gradient(180deg, #faf7f2 0%, #f3ede3 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
