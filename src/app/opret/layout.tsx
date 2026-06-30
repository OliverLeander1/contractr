import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tjek din byggeaftale gratis - Upload tilbud eller kontrakt",
  description: "Upload dit tilbud eller din kontrakt og få en gratis AI-screening på under 2 minutter. Vi tjekker pris, tidsplan, betalingsplan og AB-Forbruger for dig.",
  keywords: ["tjek byggeaftale", "upload tilbud", "kontrakt screening", "gratis byggetjek", "AB-Forbruger check"],
  openGraph: {
    title: "Tjek din byggeaftale gratis",
    description: "Upload dit tilbud eller kontrakt - AI-screening på under 2 minutter. Gratis og fortroligt.",
    url: "https://www.contractr.dk/opret",
  },
  alternates: { canonical: "https://www.contractr.dk/opret" },
};

export default function OpretLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
