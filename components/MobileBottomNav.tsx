"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Home, Info, Sparkles } from "lucide-react";

/**
 * Mobile bottom nav — app-like UX.
 * Fixed at bottom. 3 items with the center Simulateur button raised and highlighted
 * (always visible "Commencer la simulation" CTA).
 */
export default function MobileBottomNav() {
  const pathname = usePathname();
  const [active, setActive] = useState<string>("accueil");

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
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  if (pathname?.startsWith("/admin")) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface-200 bg-white/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-8px_24px_-12px_rgba(15,46,42,0.12)] backdrop-blur-xl md:hidden"
      role="navigation"
      aria-label="Navigation principale"
    >
      <ul className="mx-auto grid max-w-md grid-cols-[1fr_auto_1fr] items-end gap-2">
        {/* Accueil */}
        <NavItem
          href="#accueil"
          label="Accueil"
          Icon={Home}
          isActive={pathname === "/" && active === "accueil"}
        />

        {/* Simulateur — center, raised, emphasized */}
        <li className="flex justify-center">
          <Link
            href="#simulator"
            aria-label="Offre bilan"
            className="relative -mt-6 flex h-16 w-16 flex-col items-center justify-center rounded-full bg-brand-500 text-white shadow-brand-glow transition-all active:scale-95"
          >
            <Sparkles className="h-6 w-6" strokeWidth={2.2} />
            <span className="sr-only">Commencer la simulation</span>
            <span
              aria-hidden
              className={`absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-white/90 transition-opacity ${
                pathname === "/" && active === "simulator"
                  ? "opacity-100"
                  : "opacity-0"
              }`}
            />
          </Link>
        </li>

        {/* À propos */}
        <NavItem
          href="#about"
          label="À propos"
          Icon={Info}
          isActive={pathname === "/" && active === "about"}
        />
      </ul>
      <p className="mt-1.5 text-center text-[9px] font-medium uppercase tracking-[0.2em] text-brand-700">
        Simuler
      </p>
    </nav>
  );
}

function NavItem({
  href,
  label,
  Icon,
  isActive,
}: {
  href: string;
  label: string;
  Icon: typeof Home;
  isActive: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={`flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 transition-all ${
          isActive
            ? "bg-brand-50 text-brand-700"
            : "text-forest-700 active:bg-surface-100"
        }`}
      >
        <Icon
          className={`h-5 w-5 transition-transform ${
            isActive ? "scale-110" : ""
          }`}
          strokeWidth={isActive ? 2.4 : 2}
        />
        <span
          className={`text-[10px] font-medium uppercase tracking-wider ${
            isActive ? "text-brand-700" : "text-forest-700/70"
          }`}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}
