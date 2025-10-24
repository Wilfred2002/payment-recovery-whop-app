import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
	try {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);
		const { experienceId, companyId } = await request.json();

		// Verify the plan ID is set
		const planId = process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID;
		if (!planId) {
			console.error("❌ NEXT_PUBLIC_PREMIUM_PLAN_ID not set in environment");
			return Response.json(
				{ error: "Subscription plan not configured" },
				{ status: 500 },
			);
		}

		console.log(
			`Creating checkout session for user ${userId}, plan ${planId}`,
		);

		// Create checkout session for your $30/month plan
		const checkoutSession = await whopSdk.payments.createCheckoutSession({
			planId,
			metadata: {
				experienceId: experienceId || "",
				companyId: companyId || "",
				userId,
			},
		});

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
