"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { Suspense } from "react";

const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://eu.i.posthog.com";

function PageTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!POSTHOG_KEY || !posthog.__loaded) return;
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : "");
    posthog.capture("$pageview", { $current_url: url });
  }, [pathname, searchParams]);

  return null;
}

export default function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (!POSTHOG_KEY) return;

    const samtykke = localStorage.getItem("cookie-samtykke");
    if (samtykke !== "alle") {
      // Lyt efter at brugeren accepterer cookies
      const handler = () => {
        const nytSamtykke = localStorage.getItem("cookie-samtykke");
        if (nytSamtykke === "alle") init();
      };
      window.addEventListener("cookie-samtykke-accepteret", handler);
      return () => window.removeEventListener("cookie-samtykke-accepteret", handler);
    }

    init();
  }, []);

  function init() {
    if (!POSTHOG_KEY || posthog.__loaded) return;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: false, // Vi tracker manuelt via PageTracker
      capture_pageleave: true,
      autocapture: false, // Kun events vi eksplicit tracker
      persistence: "localStorage",
      loaded: (ph) => {
        if (process.env.NODE_ENV === "development") ph.debug();
      },
    });
  }

  return (
    <>
      <Suspense>
        <PageTracker />
      </Suspense>
      {children}
    </>
  );
}
