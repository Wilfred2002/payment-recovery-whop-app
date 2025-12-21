import { NextRequest, NextResponse } from "next/server";

/**
 * Test endpoint to simulate payment.failed webhook
 * Useful for testing logging and webhook handling
 * 
 * Usage: POST /api/webhooks/test
 * 
 * Optional query params:
 * - companyId: Company ID to use (defaults to env var)
 * - userId: User ID to use (defaults to test user)
 * - amount: Payment amount (defaults to 97.00)
 */
export async function POST(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("companyId") || process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || "test_company_123";
		const userId = searchParams.get("userId") || "test_user_123";
		const amount = parseFloat(searchParams.get("amount") || "97.00");

		// Create a mock webhook payload that matches Whop's structure
		const paymentId = `test_payment_${Date.now()}`;
		const membershipId = `test_membership_${Date.now()}`;
		
		const mockWebhookPayload = {
			type: "payment.failed",
			data: {
				id: paymentId,
				total: amount,
				user: {
					id: userId,
					name: "Test User",
					email: "test@example.com",
				},
				membership: {
					id: membershipId,
					company: {
						id: companyId,
					},
				},
				company: {
					id: companyId,
				},
			},
		};

		console.log("=".repeat(80));
		console.log("🧪 TEST WEBHOOK - Simulating payment.failed event");
		console.log("=".repeat(80));
		console.log("Mock payload:", JSON.stringify(mockWebhookPayload, null, 2));
		console.log("=".repeat(80));

		// Create a mock request to forward to webhook handler
		const baseUrl = request.url.replace("/api/webhooks/test", "");
		const webhookUrl = `${baseUrl}/api/webhooks`;
		
		// In development, webhook validation is skipped, so this should work
		const webhookResponse = await fetch(webhookUrl, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(mockWebhookPayload),
		});

		const responseText = await webhookResponse.text();

		return NextResponse.json({
			message: "Test webhook sent successfully",
			status: webhookResponse.status,
			webhookResponse: responseText,
			testPayload: {
				paymentId,
				membershipId,
				userId,
				companyId,
				amount,
			},
			note: "Check Vercel logs to see the payment failure logging",
		});
	} catch (error) {
		console.error("=".repeat(80));
		console.error("❌ ERROR IN TEST WEBHOOK");
		console.error("Error:", error);
		console.error("=".repeat(80));
		return NextResponse.json(
			{ error: "Failed to send test webhook", message: String(error) },
			{ status: 500 },
		);
	}
}

/**
 * GET endpoint to show test webhook info
 */
export async function GET(request: NextRequest) {
	return NextResponse.json({
		message: "Test webhook endpoint",
		usage: "POST /api/webhooks/test",
		queryParams: {
			companyId: "Optional - Company ID (defaults to env var)",
			userId: "Optional - User ID (defaults to test_user_123)",
			amount: "Optional - Payment amount (defaults to 97.00)",
		},
		examples: [
			"POST /api/webhooks/test",
			"POST /api/webhooks/test?companyId=comp_123&amount=150.00",
			"POST /api/webhooks/test?userId=user_456&companyId=comp_789",
		],
		note: "This will trigger the payment.failed webhook handler and you can see the logs in Vercel",
	});
}



