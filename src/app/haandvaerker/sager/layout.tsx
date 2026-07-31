import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Håndværkerportal - Mine sager | Nembyggestyring",
  description: "Se og administrér dine aktive sager. Modtag aftalegrundlag fra bygherre og send dit tilbud tilbage.",
};

export default function HaandvaerkerSagerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
