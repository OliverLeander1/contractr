import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Håndværkerportal - Mine sager | Nembyggestyring",
  description: "Se og administrér dine aktive tilbud og byggesager. Modtag udbudsforespørgsler digitalt og send strukturerede tilbud tilbage til bygherren.",
};

export default function HaandvaerkerSagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
