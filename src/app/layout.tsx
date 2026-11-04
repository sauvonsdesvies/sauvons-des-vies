
import type { Metadata } from "next";
import "./globals.css";

// ==========================================================
// FONDATION SAUVONS DES VIES
// ROOT LAYOUT — Next.js 16
// Polices système : aucun téléchargement Google Fonts
// ==========================================================

export const metadata: Metadata = {
  title: "Fondation Sauvons des Vies",
  description:
    "Fondation Sauvons des Vies — Ensemble, sauvons des vies grâce à la solidarité et aux dons.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}
