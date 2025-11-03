import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendRecoveryEmail } from "@/lib/email";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

export async function POST(request: NextRequest): Promise<Response> {
	let webhookData;

	if (process.env.NODE_ENV === "development") {
		console.log("⚠️  Development mode: skipping webhook signature validation");
		webhookData = await request.json();
	} else {
		try {
			webhookData = await validateWebhook(request);
		} catch (error) {
			console.error("Webhook validation failed:", error);
			return new Response("Unauthorized", { status: 401 });
		}
	}

	// Log full payload to see what's available
	console.log("📦 Full webhook payload:", JSON.stringify(webhookData, null, 2));

	if (webhookData.type === "payment.failed") {
		const { id, total, user, membership, company } = webhookData.data;

		// Extract IDs from nested objects
		const user_id = user?.id;
		const membership_id = membership?.id;
		const company_id = company?.id;

		console.log(
			`💥 Payment failed: ${id} for user ${user_id}, company: ${company_id}, amount: $${total}`,
		);

		if (!company_id) {
			console.error("❌ No company_id in webhook payload");
		}

		waitUntil(handlePaymentFailure(id, total, user_id, membership_id, company_id));
	}

	if (webhookData.type === "payment.succeeded") {
		const { id, total, user, membership, company } = webhookData.data;

		// Extract IDs from nested objects
		const user_id = user?.id;
		const membership_id = membership?.id;
		const company_id = company?.id;

		console.log(
			`✅ Payment succeeded: ${id} for user ${user_id}, company: ${company_id}, amount: $${total}`,
		);

		waitUntil(handlePaymentSuccess(id, user_id, membership_id, company_id));
	}

	return new Response("OK", { status: 200 });
}

async function handlePaymentFailure(
	paymentId: string,
	amount: number,
	userId: string | null | undefined,
	membershipId: string | null | undefined,
	companyId: string | null | undefined,
) {
	if (!userId || !membershipId) {
		console.error("Missing userId or membershipId in payment.failed webhook");
		return;
	}

	try {
		// Get company_id from webhook payload
		let resolvedCompanyId = companyId;

		if (!resolvedCompanyId) {
			console.error("❌ No company_id in webhook payload - this is required");
			return;
		}

		// ✅ CRITICAL: Check if the COMPANY has purchased YOUR app
		// This prevents sending recovery emails for companies that haven't paid for your service
		const requiredProductId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID;
		const appOwnerCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

		// Always allow app owner's company (for testing/own use)
		if (appOwnerCompanyId && resolvedCompanyId === appOwnerCompanyId) {
			console.log(
				`✅ App owner company ${resolvedCompanyId} - proceeding with recovery email`,
			);
		} else if (requiredProductId) {
			// For other companies, check if any admin has purchased the app
			try {
				// Get admins of the company
				const adminsResponse = await fetch(
					`https://api.whop.com/api/v1/members?company_id=${resolvedCompanyId}&access_level=admin&first=5`,
					{
						headers: {
							Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
						},
					},
				);

				if (!adminsResponse.ok) {
					console.warn(
						`⚠️  Could not fetch company admins (${adminsResponse.status}). Skipping recovery email for safety.`,
					);
					return;
				}

				const adminsData = await adminsResponse.json();
				const admins = adminsData.data || [];

				if (admins.length === 0) {
					console.log(
						`⏸️  No admins found for company ${resolvedCompanyId}. Skipping recovery email.`,
					);
					return;
				}

				// Check if any admin has access to our product
				let hasCompanyAccess = false;
				for (const admin of admins) {
					const accessResponse = await fetch(
						`https://api.whop.com/api/v1/users/${admin.user.id}/access/${requiredProductId}`,
						{
							headers: {
								Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
							},
						},
					);

					if (accessResponse.ok) {
						const accessData = await accessResponse.json();
						if (accessData.has_access) {
							hasCompanyAccess = true;
							console.log(
								`✅ Company ${resolvedCompanyId} admin ${admin.user.id} has access to product ${requiredProductId}`,
							);
							break;
						}
					}
				}

				if (!hasCompanyAccess) {
					console.log(
						`⏸️  Company ${resolvedCompanyId} does not have access to product ${requiredProductId}. Skipping recovery email.`,
					);
					return;
				}
			} catch (error) {
				console.error("Error checking company product access:", error);
				console.warn("⚠️  Access check failed. Skipping recovery email for safety.");
				return;
			}
		} else {
			console.log(
				"✅ No product ID set - app is in open access mode. Sending email.",
			);
		}


		// ========================================
		// 🔧 DEVELOPMENT MODE BYPASS
		// ========================================
		// Allows testing without real Whop members
		// Automatically disabled in production (checks NODE_ENV)
		// Safe: Falls back to real API if env vars missing
		// ========================================
		const isDevBypass =
			process.env.NODE_ENV === "development" &&
			process.env.DEV_MODE_BYPASS_WHOP_API === "true";

		let userEmail: string;
		let userName: string;

		if (isDevBypass) {
			// DEV MODE: Use test data from environment
			console.warn("⚠️  DEV MODE ACTIVE: Using test email (not real Whop API)");
			console.warn("⚠️  This will be automatically disabled in production");

			userEmail = process.env.DEV_MODE_TEST_EMAIL || "test@example.com";
			userName = process.env.DEV_MODE_TEST_NAME || "Test User";

			console.log(`📧 Dev mode: Sending to ${userEmail}`);
		} else {
			// PRODUCTION MODE: Get real member data from Whop REST API
			// Requires: member:basic:read and member:email:read permissions
			const companyMemberId = `${userId}_${resolvedCompanyId}`;
			const memberResponse = await fetch(
				`https://api.whop.com/api/v1/companies/${resolvedCompanyId}/members/${companyMemberId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				},
			);

			if (!memberResponse.ok) {
				console.error(
					`❌ Unable to get member data: ${memberResponse.status} ${memberResponse.statusText}`,
				);
				return;
			}

			const memberData = await memberResponse.json();

			// Handle the response structure - member data is nested
			if (!memberData?.member) {
				console.error("❌ Unable to get member data from API response");
				return;
			}

			const member = memberData.member;
			userEmail = member.user?.email || "";
			userName = member.user?.name || member.user?.username || "there";

			if (!userEmail) {
				console.error(
					"❌ Unable to get user email - check app permissions (member:email:read required)",
				);
				return;
			}
		}

		const { data, error } = await supabaseAdmin
			.from("failed_payments")
			.insert({
				whop_payment_id: paymentId,
				whop_membership_id: membershipId,
				whop_user_id: userId,
				user_email: userEmail,
				user_name: userName,
				amount: amount,
				company_id: resolvedCompanyId,
				status: "pending",
			})
			.select()
			.single();

		if (error) {
			console.error("Failed to insert payment failure:", error);
			return;
		}

		console.log("💾 Failed payment saved to database:", data.id);

		// Check if recovery emails are enabled
		const { data: settings } = await supabaseAdmin
			.from("creator_settings")
			.select("*")
			.eq("company_id", resolvedCompanyId)
			.single();

		const emailEnabled = settings?.email_enabled ?? true; // Default to enabled if no settings

		if (!emailEnabled) {
			console.log("⏸️  Recovery emails are disabled. Skipping email.");
			return;
		}

		console.log("✅ Sending recovery email for all products (no filtering).");

		try {
			await sendRecoveryEmail({
				to: userEmail,
				userName: userName,
				amount: amount,
				membershipId: membershipId,
				customSubject: settings?.email_subject,
				customBody: settings?.email_body,
			});

			await supabaseAdmin
				.from("failed_payments")
				.update({
					status: "sent",
					email_sent_at: new Date().toISOString(),
				})
				.eq("id", data.id);

			console.log("📧 Recovery email sent to:", userEmail);
		} catch (emailError) {
			console.error("Failed to send recovery email:", emailError);
		}
	} catch (error) {
		console.error("Error handling payment failure:", error);
	}
}

async function handlePaymentSuccess(
	paymentId: string,
	userId: string | null | undefined,
	membershipId: string | null | undefined,
	companyId: string | null | undefined,
) {
	if (!userId || !membershipId) {
		return;
	}

	try {
		// Get company_id from webhook payload
		let resolvedCompanyId = companyId;

		if (!resolvedCompanyId) {
			console.error("❌ No company_id in webhook payload - this is required");
			return;
		}

		const { data: failedPayments, error } = await supabaseAdmin
			.from("failed_payments")
			.select("*")
			.eq("whop_membership_id", membershipId)
			.eq("whop_user_id", userId)
			.eq("company_id", resolvedCompanyId)
			.is("recovered_at", null)
			.order("failed_at", { ascending: false })
			.limit(1);

		if (error) {
			console.error("Error checking for failed payments:", error);
			return;
		}

		if (failedPayments && failedPayments.length > 0) {
			const failedPayment = failedPayments[0];

			await supabaseAdmin
				.from("failed_payments")
				.update({
					status: "recovered",
					recovered_at: new Date().toISOString(),
				})
				.eq("id", failedPayment.id);

			const recoveryTime = Math.floor(
				(new Date().getTime() - new Date(failedPayment.failed_at).getTime()) /
					1000 /
					60,
			);

			console.log(
				`🎉 Payment recovered! User: ${userId}, Amount: $${failedPayment.amount}, Time: ${recoveryTime} minutes`,
			);
		}
	} catch (error) {
		console.error("Error handling payment success:", error);
	}
}
