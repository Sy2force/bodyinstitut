import type { Metadata, Viewport } from "next";
import "./globals.css";
import Header from "@/components/Header";
import MobileBottomNav from "@/components/MobileBottomNav";
import AdminFab from "@/components/AdminFab";
import Footer from "@/components/Footer";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://bodyinstitut.fr";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Body Institut — Votre corps. Votre transformation.",
    template: "%s · Body Institut",
  },
  description:
    "Institut minceur & soins corps à Paris 18. Simulation personnalisée en 3 minutes pour découvrir le protocole idéal — cryolipolyse, radiofréquence, pressothérapie.",
  applicationName: "Body Institut",
  keywords: [
    "institut minceur Paris",
    "cryolipolyse",
    "radiofréquence",
    "pressothérapie",
    "bilan minceur offert",
    "Paris 18",
  ],
  authors: [{ name: "Body Institut" }],
  creator: "Body Institut",
  publisher: "Body Institut",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "Body Institut — Votre transformation, sur-mesure",
    description:
      "Simulation personnalisée en 3 minutes. Protocole sur-mesure. Bilan offert.",
    url: "/",
    siteName: "Body Institut",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Body Institut — Votre transformation, sur-mesure",
    description:
      "Simulation personnalisée en 3 minutes · Bilan offert à Paris 18.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf7f2" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0806" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="bg-white">
      <body className="bg-white text-forest-800 antialiased">
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
        <MobileBottomNav />
        <AdminFab />
      </body>
    </html>
  );
}
