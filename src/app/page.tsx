import type { Metadata } from "next";
import Link from "next/link";
import ForsideHero from "@/components/ForsideHero";
import ForsideHeader from "@/components/ForsideHeader";

export const metadata: Metadata = {
  title: "Nembyggestyring - Hele byggeprojektet samlet ét sted",
  description: "Opret dit byggeprojekt, inviter entreprenøren og styr hele sagen digitalt. Med tilbudstjek, kontrakt, ekstraarbejde og betalingsplan samlet ét sted.",
  keywords: ["byggesag", "byggeprojekt", "tilbud håndværker", "AB-Forbruger", "kontrakt screening", "bygherre", "renovering", "projektstyring", "byggesagkyndig"],
  openGraph: {
    title: "Nembyggestyring - Hele byggeprojektet samlet ét sted",
    description: "Opret dit byggeprojekt, inviter entreprenøren og styr hele sagen digitalt.",
    url: "https://www.nembyggestyring.dk",
    type: "website",
    siteName: "Nembyggestyring",
  },
  alternates: { canonical: "https://www.nembyggestyring.dk" },
  robots: { index: true, follow: true },
};

export default function Forside() {
  return (
    <div className="min-h-screen bg-[#f5f3ee] flex flex-col">

      <header className="px-4 sm:px-6 py-4 sticky top-0 bg-[#f5f3ee]/95 backdrop-blur z-50 border-b border-[#e0ddd6]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
          <Link href="/" className="flex-shrink-0">
            <span className="logo">nembyggestyring</span>
          </Link>
          <ForsideHeader />
        </div>
      </header>

      <main className="flex-1">
        <ForsideHero />
      </main>

      <footer className="border-t border-[#e0ddd6] bg-[#f5f3ee] px-4 sm:px-6 py-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="text-xs text-gray-400">2025 Nembyggestyring</span>
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <Link href="/det-gode-byggeprojekt" className="text-xs text-gray-400 hover:text-gray-600">Guides</Link>
            <Link href="/abforbruger" className="text-xs text-gray-400 hover:text-gray-600">AB-Forbruger</Link>
            <Link href="/tilkoeb" className="text-xs text-gray-400 hover:text-gray-600">Rådgivere</Link>
            <Link href="/vilkaar" className="text-xs text-gray-400 hover:text-gray-600">Vilkår</Link>
            <Link href="/privatliv" className="text-xs text-gray-400 hover:text-gray-600">Privatlivspolitik</Link>
            <Link href="/entreprenoer" className="text-xs text-gray-400 hover:text-gray-600">Entreprenør</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
