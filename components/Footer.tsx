"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname?.startsWith("/admin")) return null;

  return (
    <footer className="border-t border-surface-200 bg-surface-50">
      <div className="container-wide py-12">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div className="flex items-center gap-2.5 text-[15px] font-semibold text-forest-800">
            <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-forest-800 text-white shadow-3d">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-3.5 w-3.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2C8 6 6 10 6 13a6 6 0 0 0 12 0c0-3-2-7-6-11Z" />
              </svg>
              <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-sand-400" aria-hidden />
            </span>
            Body Institut
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-forest-700/75">
            <Link href="#accueil" className="transition-colors hover:text-sand-700">
              Accueil
            </Link>
            <Link href="#about" className="transition-colors hover:text-sand-700">
              À propos
            </Link>
            <Link href="#simulator" className="transition-colors hover:text-sand-700">
              Simulateur
            </Link>
            <a
              href="mailto:contact@bodyinstitut.fr"
              className="transition-colors hover:text-sand-700"
            >
              contact@bodyinstitut.fr
            </a>
          </nav>
        </div>

        <div className="mt-8 flex flex-col items-start justify-between gap-2 border-t border-surface-200 pt-6 text-xs text-forest-700/55 md:flex-row md:items-center">
          <p>© {new Date().getFullYear()} Body Institut · Paris 18ᵉ · Tous droits réservés.</p>
          <p>Institut minceur & soins corps premium.</p>
        </div>
      </div>
    </footer>
  );
}
