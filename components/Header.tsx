"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";

const NAV = [
  { href: "#accueil", label: "Accueil", id: "accueil" },
  { href: "#simulator", label: "Simulateur", id: "simulator", highlight: true },
  { href: "#about", label: "À propos", id: "about" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string>("accueil");

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // scroll-spy for anchors
  useEffect(() => {
    if (pathname !== "/") return;
    const ids = ["accueil", "about", "simulator"];
    const els = ids
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-surface-200 bg-white/85 backdrop-blur-xl"
          : "border-b border-transparent bg-white/50 backdrop-blur-sm"
      }`}
    >
      <div className="container-wide flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link
          href="#accueil"
          className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight text-forest-800"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-forest-800 text-white shadow-3d">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4"
              stroke="currentColor"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2C8 6 6 10 6 13a6 6 0 0 0 12 0c0-3-2-7-6-11Z" />
            </svg>
          </span>
          <span className="hidden sm:inline">Body Institut</span>
        </Link>

        {/* Desktop nav — Accueil · Simulateur (centre) · À propos */}
        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const isActive = pathname === "/" && active === item.id;
            if (item.highlight) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mx-2 inline-flex items-center gap-1.5 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    isActive
                      ? "bg-brand-600 text-white shadow-brand-glow"
                      : "bg-brand-500 text-white shadow-brand-glow hover:-translate-y-0.5 hover:bg-brand-600"
                  }`}
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-sand-100 text-sand-700"
                    : "text-forest-700 hover:text-sand-700"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Admin link — discreet but always visible */}
        <Link
          href="/admin"
          title="Espace administration"
          className="inline-flex items-center gap-1.5 rounded-full border border-surface-200 bg-white/80 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-forest-700 backdrop-blur transition-colors hover:border-forest-700 hover:text-forest-800"
        >
          <ShieldCheck className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Admin</span>
        </Link>
      </div>
    </header>
  );
}
