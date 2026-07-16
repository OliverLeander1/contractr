import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Priser - Hvad koster Nembyggestyring?",
  description: "Se priser på Nembyggestyrings pakker. Gratis grundscreening af dit tilbud eller kontrakt. Opgrader med rådgiverhjælp, juridisk bistand og løbende byggetilsyn.",
  keywords: ["Nembyggestyring pris", "byggeaftale screening pris", "byggerådgiver pris", "kontrakt tjek pris"],
  openGraph: {
    title: "Priser - Hvad koster Nembyggestyring?",
    description: "Gratis grundscreening. Opgrader med rådgiver og juridisk bistand.",
    url: "https://www.Nembyggestyring.dk/pakke",
  },
  alternates: { canonical: "https://www.Nembyggestyring.dk/pakke" },
};

export default function PakkeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
