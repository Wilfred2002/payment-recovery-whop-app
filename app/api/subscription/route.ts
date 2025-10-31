import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);
		const { experienceId, companyId } = await request.json();

		// Verify the product ID is set
		const productId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID;
		if (!productId) {
			console.error("❌ NEXT_PUBLIC_WHOP_PRODUCT_ID not set in environment");
			return Response.json(
				{ error: "Subscription product not configured" },
				{ status: 500 },
			);
		}

		console.log(
			`Creating checkout session for user ${userId}, product ${productId}`,
		);

		// Step 1: Fetch plans for the product via REST API
		const plansResponse = await fetch(
			`https://api.whop.com/api/v1/plans?product_ids=["${productId}"]`,
			{
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
				},
			},
		);

		if (!plansResponse.ok) {
			console.error(
				`❌ Failed to fetch plans: ${plansResponse.status} ${plansResponse.statusText}`,
			);
			return Response.json(
				{ error: "Failed to fetch product plans" },
				{ status: 500 },
			);
		}

		const plansData = await plansResponse.json();

		if (!plansData.data || plansData.data.length === 0) {
			console.error(
				`❌ No plans found for product ${productId}. Create a plan in the Whop dashboard.`,
			);
			return Response.json(
				{ error: "No pricing plans available for this product" },
				{ status: 500 },
			);
		}

		const planId = plansData.data[0].id;
		console.log(`Using plan ${planId} for checkout`);

		// Step 2: Create checkout configuration via REST API
		const checkoutResponse = await fetch(
			"https://api.whop.com/api/v1/checkout_configurations",
			{
				method: "POST",
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					plan_id: planId,
					metadata: {
						experienceId: experienceId || "",
						companyId: companyId || "",
						userId,
					},
				}),
			},
		);

		if (!checkoutResponse.ok) {
			console.error(
				`❌ Failed to create checkout: ${checkoutResponse.status} ${checkoutResponse.statusText}`,
			);
			return Response.json(
				{ error: "Failed to create checkout session" },
				{ status: 500 },
			);
		}

		const checkoutSession = await checkoutResponse.json();

		console.log("✅ Checkout session created successfully");
		return Response.json(checkoutSession);
	} catch (error) {
		console.error("Error creating checkout session:", error);
		return Response.json(
			{ error: "Failed to create checkout session" },
			{ status: 500 },
		);
	}
}
