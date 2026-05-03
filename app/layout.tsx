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
    default: "Body Institut — La technologie qui sculpte votre silhouette.",
    template: "%s · Body Institut",
  },
  description:
    "Institut de soins corps à Paris 18. Obtenez votre protocole sur-mesure en 3 minutes grâce à notre simulateur — cryolipolyse, radiofréquence, pressothérapie. Bilan diagnostique offert.",
  applicationName: "Body Institut",
  keywords: [
    "Institut soins corps Paris",
    "technologies corps certifiées",
    "simulateur bilan corps",
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
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
  openGraph: {
    title: "Body Institut — La science de sculpter votre silhouette.",
    description:
      "Simulateur de transformation corps en 3 minutes. Protocole certifié sur-mesure. Bilan diagnostique offert à Paris 18.",
    url: "/",
    siteName: "Body Institut",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Body Institut — La science de sculpter votre silhouette.",
    description:
      "Protocole sur-mesure en 3 minutes · Bilan diagnostique offert à Paris 18.",
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
