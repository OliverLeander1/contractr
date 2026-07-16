import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Log ind på Nembyggestyring",
  description: "Log ind på din Nembyggestyring-konto og hold styr på dine byggeprojekter, aftaler, betalinger og dokumenter.",
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
