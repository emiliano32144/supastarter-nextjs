import { ORPCError } from "@orpc/client";
// Force rebuild - Dec 26 2025 v3
import { type Config, config } from "@repo/config";
import { getOrganizationById } from "@repo/database";
import { logger } from "@repo/logs";
import {
	createCheckoutLink as createCheckoutLinkFn,
	getCustomerIdFromEntity,
} from "@repo/payments";
import { z } from "zod";
import { localeMiddleware } from "../../../orpc/middleware/locale-middleware";
import { protectedProcedure } from "../../../orpc/procedures";

export const createCheckoutLink = protectedProcedure
	.use(localeMiddleware)
	.route({
		method: "POST",
		path: "/payments/create-checkout-link",
		tags: ["Payments"],
		summary: "Create checkout link",
		description:
			"Creates a checkout link for a one-time or subscription product",
	})
	.input(
		z.object({
			type: z.enum(["one-time", "subscription"]),
			productId: z.string(),
			redirectUrl: z.string().optional(),
			organizationId: z.string().optional(),
		}),
	)
	.handler(
		async ({
			input: { productId, redirectUrl, type, organizationId },
			context: { user },
		}) => {
			logger.log("[Checkout] Iniciando creación de checkout link", {
				productId,
				type,
				userId: user.id,
				organizationId,
			});

			if (!productId || productId === "undefined" || productId === "null") {
				logger.error("[Checkout] Invalid productId:", productId);
				throw new ORPCError("BAD_REQUEST", { message: "Invalid productId" });
			}

			const customerId = await getCustomerIdFromEntity(
				organizationId
					? {
							organizationId,
						}
					: {
							userId: user.id,
						},
			);

			logger.log("[Checkout] Customer ID obtenido:", customerId);

			const plans = config.payments.plans as Config["payments"]["plans"];

			logger.log("[Checkout] Buscando plan con productId:", productId);
			logger.log("[Checkout] Planes disponibles:", Object.keys(plans));

			const plan = Object.entries(plans).find(([_planId, plan]) =>
				plan.prices?.find((price) => price.productId === productId),
			);

			if (!plan) {
				logger.error("[Checkout] Plan no encontrado para productId:", productId);
				logger.error("[Checkout] Planes y sus productIds:", 
					Object.entries(plans).map(([planId, plan]) => ({
						planId,
						productIds: plan.prices?.map(p => p.productId),
					}))
				);
				throw new ORPCError("NOT_FOUND", { message: "Plan not found for productId" });
			}

			logger.log("[Checkout] Plan encontrado:", plan[0]);

			const price = plan?.[1].prices?.find(
				(price) => price.productId === productId,
			);

			if (!price) {
				logger.error("[Checkout] Price no encontrado en plan:", plan[0]);
				throw new ORPCError("NOT_FOUND", { message: "Price not found" });
			}

			logger.log("[Checkout] Price encontrado:", price);
			const trialPeriodDays =
				price && "trialPeriodDays" in price
					? price.trialPeriodDays
					: undefined;

			const organization = organizationId
				? await getOrganizationById(organizationId)
				: undefined;

			if (organization === null) {
				throw new ORPCError("NOT_FOUND");
			}

			const seats =
				organization && price && "seatBased" in price && price.seatBased
					? organization.members.length
					: undefined;

			try {
				logger.log("[Checkout] Llamando a createCheckoutLinkFn con:", {
					type,
					productId,
					email: user.email,
					name: user.name ?? "",
					redirectUrl,
					userId: user.id,
					trialPeriodDays,
					seats,
					customerId: customerId ?? undefined,
				});

				const checkoutLink = await createCheckoutLinkFn({
					type,
					productId,
					email: user.email,
					name: user.name ?? "",
					redirectUrl,
					...(organizationId
						? { organizationId }
						: { userId: user.id }),
					trialPeriodDays,
					seats,
					customerId: customerId ?? undefined,
				});

				if (!checkoutLink) {
					logger.error("[Checkout] createCheckoutLinkFn retornó null/undefined");
					throw new ORPCError("INTERNAL_SERVER_ERROR");
				}

				logger.log("[Checkout] Checkout link creado exitosamente:", checkoutLink);
				return { checkoutLink };
			} catch (e) {
				logger.error("[Checkout] Error al crear checkout link:", e);
				logger.error("[Checkout] Error details:", {
					message: e instanceof Error ? e.message : String(e),
					stack: e instanceof Error ? e.stack : undefined,
					error: e,
				});
				throw new ORPCError("INTERNAL_SERVER_ERROR");
			}
		},
	);

