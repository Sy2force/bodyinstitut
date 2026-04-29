"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import AdminLoginModal from "./AdminLoginModal";

/**
 * Floating admin button, discreet, bottom-right.
 * Hidden on admin pages. Opens login popup when clicked.
 * If already authenticated, redirects directly to /admin.
 */
export default function AdminFab() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);

  if (pathname?.startsWith("/admin")) return null;

  async function handleClick() {
    // Check if the user is already authenticated — if so, skip the popup.
    setCheckingAuth(true);
    try {
      const res = await fetch("/api/admin/me", { cache: "no-store" });
      if (res.ok) {
        router.push("/admin");
        return;
      }
    } catch {
      // fallthrough to popup
    } finally {
      setCheckingAuth(false);
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        disabled={checkingAuth}
        aria-label="Accès administrateur"
        title="Accès administrateur"
        className="group fixed bottom-[92px] right-4 z-30 grid h-10 w-10 place-items-center rounded-full border border-surface-200 bg-white/80 text-forest-700 opacity-55 shadow-card-soft backdrop-blur-md transition-all duration-300 hover:opacity-100 hover:shadow-card-hover disabled:cursor-wait md:bottom-6 md:right-6 md:h-11 md:w-11"
      >
        <Lock className="h-4 w-4 transition-transform group-hover:scale-110" />
      </button>
      <AdminLoginModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
