import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { priceId, customerEmail, organizationSlug } = body;

    if (!priceId) {
      return NextResponse.json(
        { error: "priceId es requerido" },
        { status: 400 }
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "https://filo.com.es";

    // Mapa explícito de price IDs a planes (evita false positives con includes("pro"))
    const priceIdToPlan: Record<string, string> = {
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_NORMAL || ""]: "normal",
      [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || ""]: "pro",
      [process.env.NEXT_PUBLIC_PRICE_ID_BASICO_MONTHLY || ""]: "normal",
      [process.env.NEXT_PUBLIC_PRICE_ID_PRO_MONTHLY || ""]: "pro",
    };

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      customer_email: customerEmail || undefined,
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
      metadata: {
        organizationSlug: organizationSlug || "",
        plan: priceIdToPlan[priceId] || "normal",
      },
      subscription_data: {
        metadata: {
          organizationSlug: organizationSlug || "",
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error creando checkout session:", error);
    return NextResponse.json(
      { error: "Error al crear la sesión de pago" },
      { status: 500 }
    );
  }
}
