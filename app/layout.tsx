import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Body Institut — Soin minceur & silhouette à Paris 18",
  description:
    "Drainage, madérothérapie, radiofréquence et soins minceur pour affiner, drainer et raffermir la silhouette. Paris 18.",
  icons: { icon: "/logo.svg" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className={`${inter.className} bg-white text-stone-800 antialiased`}>
        {children}
      </body>
    </html>
  );
}
