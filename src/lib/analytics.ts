import posthog from "posthog-js";

type EventName =
  | "signup_completed"
  | "login_completed"
  | "project_started"
  | "document_generated"
  | "aftale_created"
  | "haandvaerker_invited"
  | "tilbud_uploaded"
  | "screening_completed"
  | "raadgiver_booked"
  | "pakke_purchased";

export function track(event: EventName, props?: Record<string, unknown>) {
  try {
    if (typeof window === "undefined") return;
    if (!posthog.__loaded) return;
    posthog.capture(event, props);
  } catch {
    // Analytics må aldrig crashe appen
  }
}

export function identifyUser(userId: string, props?: Record<string, unknown>) {
  try {
    if (!posthog.__loaded) return;
    posthog.identify(userId, props);
  } catch { /* ignore */ }
}
