import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const PAKKE_PRISER: Record<string, { beloeb: number; navn: string }> = {
  lille:  { beloeb: 29900,  navn: "Mindre byggeprojekt" },
  mellem: { beloeb: 249900, navn: "Mellemstort byggeprojekt" },
  stor:   { beloeb: 499900, navn: "Stort byggeprojekt" },
  // bagudkompatibilitet
  renovering:      { beloeb: 249900, navn: "Mellemstort byggeprojekt" },
  totalrenovering: { beloeb: 499900, navn: "Stort byggeprojekt" },
};

export async function POST(req: NextRequest) {
  try {
    const { email, navn, pakke, projekt_id, bruger_id } = await req.json();

    if (!email) return NextResponse.json({ error: "E-mail mangler" }, { status: 400 });

    const valgtPakke = PAKKE_PRISER[pakke] ?? PAKKE_PRISER.renovering;
    const baseUrl = process.env.NEXT_PUBLIC_URL ?? "https://www.nembyggestyring.dk";

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "dkk",
          product_data: {
            name: `Nembyggestyring — ${valgtPakke.navn}`,
            description: "Digitalt projektrum med aftalegrundlag og løbende rapporter",
          },
          unit_amount: valgtPakke.beloeb,
        },
        quantity: 1,
      }],
      mode: "payment",
      customer_email: email,
      metadata: { navn: navn ?? "", pakke, projekt_id: projekt_id ?? "", bruger_id: bruger_id ?? "" },
      success_url: `${baseUrl}/pakke/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/pakke`,
      locale: "da",
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Ukendt fejl";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
