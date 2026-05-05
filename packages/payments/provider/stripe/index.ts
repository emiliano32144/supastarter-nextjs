import {
	createPurchase,
	deletePurchaseBySubscriptionId,
	getPurchaseBySubscriptionId,
	updatePurchase,
} from "@repo/database";
import { logger } from "@repo/logs";
import Stripe from "stripe";
import { setCustomerIdToEntity } from "../../src/lib/customer";
import type {
	CancelSubscription,
	CreateCheckoutLink,
	CreateCustomerPortalLink,
	SetSubscriptionSeats,
	WebhookHandler,
} from "../../types";

let stripeClient: Stripe | null = null;

export function getStripeClient() {
	if (stripeClient) {
		return stripeClient;
	}

	const stripeSecretKey = process.env.STRIPE_SECRET_KEY as string;

	logger.log("[Stripe] Inicializando cliente de Stripe");
	logger.log("[Stripe] STRIPE_SECRET_KEY presente:", !!stripeSecretKey);
	logger.log("[Stripe] STRIPE_SECRET_KEY prefijo:", stripeSecretKey?.substring(0, 12) || "NO DEFINIDO");

	if (!stripeSecretKey) {
		logger.error("[Stripe] STRIPE_SECRET_KEY no está definida en process.env");
		logger.error("[Stripe] Variables de entorno disponibles:", Object.keys(process.env).filter(k => k.includes("STRIPE")));
		throw new Error("Missing env variable STRIPE_SECRET_KEY");
	}

	try {
		stripeClient = new Stripe(stripeSecretKey);
		logger.log("[Stripe] Cliente de Stripe inicializado correctamente");
	} catch (error) {
		logger.error("[Stripe] Error al inicializar cliente:", error);
		throw error;
	}

	return stripeClient;
}

export const createCheckoutLink: CreateCheckoutLink = async (options) => {
	logger.log("[Stripe] createCheckoutLink llamado con:", {
		productId: options.productId,
		type: options.type,
		email: options.email,
		userId: options.userId,
		organizationId: options.organizationId,
	});

	if (!options.productId || options.productId === "undefined" || options.productId === "null") {
		logger.error("[Stripe] Invalid productId:", options.productId);
		throw new Error("Invalid productId");
	}

	const stripeClient = getStripeClient();
	logger.log("[Stripe] Cliente de Stripe inicializado");
	const {
		type,
		productId,
		redirectUrl,
		customerId,
		organizationId,
		userId,
		trialPeriodDays,
		seats,
		email,
	} = options;

	const metadata = {
		organization_id: organizationId || null,
		user_id: userId || null,
	};

	try {
		logger.log("[Stripe] Creando checkout session con:", {
			mode: type === "subscription" ? "subscription" : "payment",
			price: productId,
			email,
			customerId,
			redirectUrl,
			trialPeriodDays,
		});

		const response = await stripeClient.checkout.sessions.create({
			mode: type === "subscription" ? "subscription" : "payment",
			success_url: redirectUrl ?? "",
			line_items: [
				{
					quantity: seats ?? 1,
					price: productId,
				},
			],
			...(customerId ? { customer: customerId } : { customer_email: email }),
			...(type === "one-time"
				? {
						payment_intent_data: {
							metadata,
						},
						customer_creation: "always",
					}
				: {
						subscription_data: {
							metadata,
							trial_period_days: trialPeriodDays,
						},
					}),
			metadata,
		});

		logger.log("[Stripe] Checkout session creada exitosamente:", {
			sessionId: response.id,
			url: response.url,
		});

		return response.url;
	} catch (error) {
		logger.error("[Stripe] Error al crear checkout session:", error);
		logger.error("[Stripe] Error details:", {
			message: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			type: error instanceof Error ? error.constructor.name : typeof error,
		});
		throw error;
	}
};

export const createCustomerPortalLink: CreateCustomerPortalLink = async ({
	customerId,
	redirectUrl,
}) => {
	const stripeClient = getStripeClient();

	const response = await stripeClient.billingPortal.sessions.create({
		customer: customerId,
		return_url: redirectUrl ?? "",
	});

	return response.url;
};

export const setSubscriptionSeats: SetSubscriptionSeats = async ({
	id,
	seats,
}) => {
	const stripeClient = getStripeClient();

	const subscription = await stripeClient.subscriptions.retrieve(id);

	if (!subscription) {
		throw new Error("Subscription not found.");
	}

	await stripeClient.subscriptions.update(id, {
		items: [
			{
				id: subscription.items.data[0].id,
				quantity: seats,
			},
		],
	});
};

export const cancelSubscription: CancelSubscription = async (id) => {
	const stripeClient = getStripeClient();

	await stripeClient.subscriptions.cancel(id);
};

export const webhookHandler: WebhookHandler = async (req) => {
	const stripeClient = getStripeClient();

	if (!req.body) {
		return new Response("Invalid request.", {
			status: 400,
		});
	}

	let event: Stripe.Event | undefined;

	try {
		event = await stripeClient.webhooks.constructEventAsync(
			await req.text(),
			req.headers.get("stripe-signature") as string,
			process.env.STRIPE_WEBHOOK_SECRET as string,
		);
	} catch (e) {
		logger.error(e);

		return new Response("Invalid request.", {
			status: 400,
		});
	}

	try {
		switch (event.type) {
			case "checkout.session.completed": {
				const { mode, metadata, customer, id } = event.data.object;

				if (mode === "subscription") {
					break;
				}

				const checkoutSession =
					await stripeClient.checkout.sessions.retrieve(id, {
						expand: ["line_items"],
					});

				const productId = checkoutSession.line_items?.data[0].price?.id;

				if (!productId) {
					return new Response("Missing product ID.", {
						status: 400,
					});
				}

				await createPurchase({
					organizationId: metadata?.organization_id || null,
					userId: metadata?.user_id || null,
					customerId: customer as string,
					type: "ONE_TIME",
					productId,
				});

				await setCustomerIdToEntity(customer as string, {
					organizationId: metadata?.organization_id,
					userId: metadata?.user_id,
				});

				break;
			}
			case "customer.subscription.created": {
				const { metadata, customer, items, id } = event.data.object;

				const productId = items?.data[0].price?.id;

				if (!productId) {
					return new Response("Missing product ID.", {
						status: 400,
					});
				}

				await createPurchase({
					subscriptionId: id,
					organizationId: metadata?.organization_id || null,
					userId: metadata?.user_id || null,
					customerId: customer as string,
					type: "SUBSCRIPTION",
					productId,
					status: event.data.object.status,
				});

				await setCustomerIdToEntity(customer as string, {
					organizationId: metadata?.organization_id,
					userId: metadata?.user_id,
				});

				break;
			}
			case "customer.subscription.updated": {
				const subscriptionId = event.data.object.id;

				const existingPurchase =
					await getPurchaseBySubscriptionId(subscriptionId);

				if (existingPurchase) {
					await updatePurchase({
						id: existingPurchase.id,
						status: event.data.object.status,
						productId: event.data.object.items?.data[0].price?.id,
					});
				}

				break;
			}
			case "customer.subscription.deleted": {
				await deletePurchaseBySubscriptionId(event.data.object.id);

				break;
			}

			default:
				return new Response("Unhandled event type.", {
					status: 200,
				});
		}

		return new Response(null, { status: 204 });
	} catch (error) {
		return new Response(
			`Webhook error: ${error instanceof Error ? error.message : ""}`,
			{
				status: 400,
			},
		);
	}
};
