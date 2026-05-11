import Stripe from "stripe";
import { NextResponse } from "next/server";
import { createPurchase, updatePurchase, getPurchaseBySubscriptionId } from "@repo/database";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Webhook de Stripe para manejar eventos de suscripción
 * Endpoint: POST /api/webhooks/stripe
 *
 * Eventos manejados:
 * - checkout.session.completed → Crear Purchase en DB
 * - invoice.payment_succeeded → Actualizar status a "active"
 * - invoice.payment_failed → Actualizar status a "past_due"
 * - customer.subscription.deleted → Actualizar status a "cancelled"
 */
export async function POST(request: Request) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err: any) {
    console.error("[Stripe Webhook] Error verificando firma:", err.message);
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 });
  }

  console.log("[Stripe Webhook] Evento recibido:", event.type, event.id);

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      case "customer.subscription.deleted":
      case "customer.subscription.canceled": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      default:
        console.log(`[Stripe Webhook] Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook] Error procesando ${event.type}:`, err);
    return NextResponse.json(
      { error: "Error procesando evento" },
      { status: 500 }
    );
  }
}

/**
 * Buscar organización por slug o por email del customer
 */
async function findOrganizationId(
  organizationSlug?: string,
  customerEmail?: string | null
): Promise<string | null> {
  // 1. Buscar por slug en business_config
  if (organizationSlug) {
    const { data: config } = await supabase
      .from("business_config")
      .select("organization_id")
      .eq("slug", organizationSlug)
      .single();

    if (config?.organization_id) {
      return config.organization_id;
    }
  }

  // 2. Buscar por email del customer en la tabla de usuarios de Better Auth
  if (customerEmail) {
    const { data: user } = await supabase
      .from("user")
      .select("id")
      .eq("email", customerEmail)
      .single();

    if (user?.id) {
      // Buscar la organización principal del usuario
      const { data: member } = await supabase
        .from("member")
        .select("organizationId")
        .eq("userId", user.id)
        .order("createdAt", { ascending: true })
        .limit(1)
        .single();

      if (member?.organizationId) {
        return member.organizationId;
      }
    }
  }

  return null;
}

/**
 * Mapear Price ID a plan de FILO
 */
function getPlanFromPriceId(priceId: string): string {
  const planMap: Record<string, string> = {
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_NORMAL || '']: 'normal',
    [process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO || '']: 'pro',
  };
  return planMap[priceId] || 'trial';
}
async function getProductIdFromPriceId(priceId: string): Promise<string | null> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    return typeof price.product === "string" ? price.product : null;
  } catch {
    return null;
  }
}

/**
 * checkout.session.completed
 * → Crear Purchase en DB cuando el usuario completa el pago
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const customerEmail = session.customer_details?.email || session.customer_email;
  const organizationSlug = session.metadata?.organizationSlug || "";

  console.log("[Stripe Webhook] Checkout completado:", {
    subscriptionId,
    customerId,
    customerEmail,
    organizationSlug,
  });

  if (!subscriptionId) {
    console.log("[Stripe Webhook] Sin subscriptionId, ignorando (pago único)");
    return;
  }

  // Verificar si ya existe
  const existing = await getPurchaseBySubscriptionId(subscriptionId);
  if (existing) {
    console.log("[Stripe Webhook] Purchase ya existe:", existing.id);
    return;
  }

  // Obtener datos de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;
  const productId = priceId ? await getProductIdFromPriceId(priceId) : null;

  // Buscar organizationId
  const organizationId = await findOrganizationId(organizationSlug, customerEmail);

  if (!organizationId) {
    console.error("[Stripe Webhook] No se encontró organizationId. Slug:", organizationSlug, "Email:", customerEmail);
    // Guardar igual pero sin organizationId (para debugging manual)
  }

  // Crear Purchase
  const purchase = await createPurchase({
    organizationId: organizationId || undefined,
    userId: undefined, // Se asocia a org, no a user directo
    type: "SUBSCRIPTION",
    customerId,
    subscriptionId,
    productId: priceId || productId || "unknown",
    status: "active",
  });

  console.log("[Stripe Webhook] Purchase creado:", purchase?.id);

  // Actualizar business_config con plan y datos de Stripe
  if (organizationId && priceId) {
    const plan = getPlanFromPriceId(priceId);
    await supabase
      .from("business_config")
      .update({
        plan,
        trial_ends_at: null,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
      })
      .eq("organization_id", organizationId);
    console.log("[Stripe Webhook] business_config actualizado:", organizationId, "plan:", plan);
  }
}

/**
 * invoice.payment_succeeded
 * → Confirmar que la suscripción sigue activa
 */
async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const purchase = await getPurchaseBySubscriptionId(subscriptionId);
  if (!purchase) {
    console.log("[Stripe Webhook] Purchase no encontrado para subscription:", subscriptionId);
    return;
  }

  await updatePurchase({
    id: purchase.id,
    status: "active",
  });

  console.log("[Stripe Webhook] Purchase actualizado a active:", purchase.id);
}

/**
 * invoice.payment_failed
 * → Marcar como past_due
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = invoice.subscription as string;
  if (!subscriptionId) return;

  const purchase = await getPurchaseBySubscriptionId(subscriptionId);
  if (!purchase) return;

  await updatePurchase({
    id: purchase.id,
    status: "past_due",
  });

  console.log("[Stripe Webhook] Purchase actualizado a past_due:", purchase.id);
}

/**
 * customer.subscription.deleted / canceled
 * → Marcar como cancelled
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const purchase = await getPurchaseBySubscriptionId(subscription.id);
  if (!purchase) {
    console.log("[Stripe Webhook] Purchase no encontrado para subscription:", subscription.id);
    return;
  }

  await updatePurchase({
    id: purchase.id,
    status: "cancelled",
  });

  // Actualizar business_config: volver a trial
  if (purchase.organizationId) {
    const trialEnd = new Date();
    trialEnd.setDate(trialEnd.getDate() + 3); // 3 días de gracia post-cancelación
    await supabase
      .from("business_config")
      .update({
        plan: 'trial',
        trial_ends_at: trialEnd.toISOString(),
        stripe_subscription_id: null,
      })
      .eq("organization_id", purchase.organizationId);
    console.log("[Stripe Webhook] business_config revertido a trial:", purchase.organizationId);
  }

  console.log("[Stripe Webhook] Purchase actualizado a cancelled:", purchase.id);
}

/**
 * customer.subscription.updated
 * → Actualizar status según el estado de Stripe
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const purchase = await getPurchaseBySubscriptionId(subscription.id);
  if (!purchase) return;

  const statusMap: Record<string, string> = {
    active: "active",
    canceled: "cancelled",
    incomplete: "incomplete",
    incomplete_expired: "incomplete_expired",
    past_due: "past_due",
    paused: "paused",
    trialing: "trialing",
    unpaid: "unpaid",
  };

  const newStatus = statusMap[subscription.status] || subscription.status;

  await updatePurchase({
    id: purchase.id,
    status: newStatus,
  });

  console.log("[Stripe Webhook] Purchase actualizado a:", newStatus, purchase.id);
}
