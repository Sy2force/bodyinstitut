import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin · Body Institut",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-surface-50 text-forest-800">{children}</div>;
}
