import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Sans } from "next/font/google";
import "./globals.css";
import CookieBanner from "@/components/CookieBanner";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["200"],
});

const BASE_URL = "https://www.Nembyggestyring.dk";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "Nembyggestyring: Forstå din byggeaftale inden det er for sent",
    template: "%s | Nembyggestyring",
  },
  description: "Upload dit tilbud eller kontrakt og få en gratis AI-screening mod AB-Forbruger 2012. Find ud af præcis hvad du skal afklare med håndværkeren inden du siger ja.",
  keywords: ["byggeaftale", "tilbud håndværker", "AB-Forbruger", "kontrakt screening", "bygherre", "renovation", "byggetilsyn", "håndværker kontrakt"],
  authors: [{ name: "Nembyggestyring" }],
  creator: "Nembyggestyring",
  openGraph: {
    type: "website",
    locale: "da_DK",
    url: BASE_URL,
    siteName: "Nembyggestyring",
    title: "Nembyggestyring: Forstå din byggeaftale inden det er for sent",
    description: "Gratis AI-screening af dit tilbud eller kontrakt mod AB-Forbruger 2012. Få præcist at vide hvad du skal afklare med håndværkeren.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Nembyggestyring: Renover trygt" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nembyggestyring: Forstå din byggeaftale inden det er for sent",
    description: "Gratis AI-screening af dit tilbud eller kontrakt mod AB-Forbruger 2012.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
  alternates: { canonical: BASE_URL },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" className={`${jakarta.variable} ${dmSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        {children}
        <CookieBanner />
      </body>
    </html>
  );
}
