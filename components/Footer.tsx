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
            <img 
              src="/logo.svg" 
              alt="Body Institut" 
              className="h-7 w-auto"
            />
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
              Offre bilan
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
