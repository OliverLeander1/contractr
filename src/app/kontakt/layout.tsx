import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontakt Nembyggestyring",
  description: "Kontakt Nembyggestyring med spørgsmål om platformen, din konto eller dit byggeprojekt.",
};

export default function KontaktLayout({ children }: { children: React.ReactNode }) {
  return children;
}
