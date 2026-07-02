import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tjek dit tilbud mod AB-Forbruger | Contractr",
  description: "Upload tilbud, kontrakt eller ordrebekræftelse og få det screenet mod AB-Forbruger 2012. Se præcis hvad du bør afklare inden du siger ja.",
  keywords: ["tjek tilbud", "gennemgang af kontrakt", "AB-Forbruger screening", "tilbud håndværker", "aftaletjek", "bygherre rettigheder"],
};

export default function UploadLayout({ children }: { children: React.ReactNode }) {
  return children;
}
