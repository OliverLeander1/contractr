import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser – Hvad koster Contractr?",
  description: "Se priser på Contractrs pakker. Gratis grundscreening af dit tilbud eller kontrakt. Opgrader med rådgiverhjælp, juridisk bistand og løbende byggetilsyn.",
  keywords: ["Contractr pris", "byggeaftale screening pris", "byggerådgiver pris", "kontrakt tjek pris"],
  openGraph: {
    title: "Priser – Hvad koster Contractr?",
    description: "Gratis grundscreening. Opgrader med rådgiver og juridisk bistand.",
    url: "https://www.contractr.dk/pakke",
  },
  alternates: { canonical: "https://www.contractr.dk/pakke" },
};

export default function PakkeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
