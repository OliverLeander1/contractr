import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase-server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) return NextResponse.json({ error: "Ingen signatur" }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Ugyldig webhook signatur" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const { pakke, projekt_id, bruger_id } = session.metadata ?? {};

    if (bruger_id && projekt_id && pakke) {
      const db = createServiceClient();
      await db.from("projekter").update({
        pakke,
        pakke_betalt: true,
      }).eq("id", projekt_id).eq("bygherre_id", bruger_id);
    }
  }

  return NextResponse.json({ received: true });
}
