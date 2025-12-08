import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendRecoveryEmail } from "@/lib/email";

const validateWebhook = makeWebhookValidator({
	webhookSecret: process.env.WHOP_WEBHOOK_SECRET ?? "fallback",
});

// ✅ RETRY UTILITY: Retry transient API failures with exponential backoff
async function fetchWithRetry(
	url: string,
	options: RequestInit,
	maxRetries = 3,
	initialDelay = 1000,
): Promise<Response> {
	let lastError: Error | null = null;

	for (let attempt = 0; attempt < maxRetries; attempt++) {
		try {
			const response = await fetch(url, options);

			// Retry on rate limit (429) or server errors (5xx)
			if (response.status === 429 || response.status >= 500) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}

			return response;
		} catch (error) {
			lastError = error as Error;
			const isLastAttempt = attempt === maxRetries - 1;

			if (isLastAttempt) {
				console.error(`❌ API request failed after ${maxRetries} attempts:`, url);
				console.error("Error:", error);
				break;
			}

			// Exponential backoff: 1s, 2s, 4s
			const delay = initialDelay * Math.pow(2, attempt);
			console.warn(
				`⚠️  API request failed (attempt ${attempt + 1}/${maxRetries}), retrying in ${delay}ms...`,
			);
			await new Promise((resolve) => setTimeout(resolve, delay));
		}
	}

	throw lastError || new Error("Unknown error during fetch with retry");
}

export async function POST(request: NextRequest): Promise<Response> {
	let webhookData;

	if (process.env.NODE_ENV === "development") {
		console.log("⚠️  Development mode: skipping webhook signature validation");
		webhookData = await request.json();
	} else {
		try {
			webhookData = await validateWebhook(request);
		} catch (error) {
			console.error("=".repeat(80));
			console.error("❌ WEBHOOK VALIDATION FAILED");
			console.error("Error:", error);
			console.error("=".repeat(80));
			return new Response("Unauthorized", { status: 401 });
		}
	}

	// Log full payload to see what's available
	console.log("📦 Full webhook payload:", JSON.stringify(webhookData, null, 2));
	console.log("📦 Webhook type:", webhookData.type);

	if (webhookData.type === "payment.failed") {
		const data = webhookData.data || {};
		
		// Try multiple possible payload structures
		const paymentId = data.id || data.payment_id || webhookData.id;
		const amount = data.total || data.amount || 0;
		
		// Extract user ID from various possible locations
		const user_id = data.user?.id || data.user_id || data.userId;
		
		// Extract membership ID from various possible locations
		const membership_id = data.membership?.id || data.membership_id || data.membershipId;
		
		// Extract company ID from various possible locations
		const company_id = data.company?.id || data.company_id || data.companyId || data.membership?.company?.id;

		// Enhanced logging for Vercel logs - easy to spot payment failures
		console.log("=".repeat(80));
		console.log("🚨 PAYMENT FAILED - WEBHOOK RECEIVED");
		console.log("=".repeat(80));
		console.log("Payment ID:", paymentId);
		console.log("Amount: $", amount);
		console.log("User ID:", user_id);
		console.log("Membership ID:", membership_id);
		console.log("Company ID:", company_id);
		console.log("Timestamp:", new Date().toISOString());
		console.log("=".repeat(80));

		if (!paymentId) {
			console.error("❌ No payment ID in webhook payload");
			return new Response("Missing payment ID", { status: 400 });
		}

		if (!user_id || !membership_id) {
			console.error("❌ Missing userId or membershipId in payment.failed webhook", {
				user_id,
				membership_id,
				payload: data,
			});
			// Still try to process if we have company_id, as we might be able to get user info
		}

		if (!company_id) {
			console.error("❌ No company_id in webhook payload - attempting to extract from membership");
			// Try to get company_id from membership if available
			if (membership_id) {
				try {
					const membershipResponse = await fetchWithRetry(
						`https://api.whop.com/api/v1/memberships/${membership_id}`,
						{
							headers: {
								Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
							},
						},
					);
					if (membershipResponse.ok) {
						const membershipData = await membershipResponse.json();
						const extractedCompanyId = membershipData.company?.id || membershipData.company_id;
						if (extractedCompanyId) {
							console.log(`✅ Extracted company_id from membership: ${extractedCompanyId}`);
							waitUntil(handlePaymentFailure(paymentId, amount, user_id, membership_id, extractedCompanyId));
							return new Response("OK", { status: 200 });
						}
					}
				} catch (error) {
					console.error("=".repeat(80));
					console.error("❌ ERROR FETCHING MEMBERSHIP TO GET COMPANY_ID");
					console.error("Error:", error);
					console.error("=".repeat(80));
				}
			}
			console.error("❌ Cannot process payment failure without company_id");
			return new Response("Missing company_id", { status: 400 });
		}

		waitUntil(handlePaymentFailure(paymentId, amount, user_id, membership_id, company_id));
	}

	if (webhookData.type === "payment.succeeded") {
		const data = webhookData.data || {};
		
		// Try multiple possible payload structures
		const paymentId = data.id || data.payment_id || webhookData.id;
		const user_id = data.user?.id || data.user_id || data.userId;
		const membership_id = data.membership?.id || data.membership_id || data.membershipId;
		const company_id = data.company?.id || data.company_id || data.companyId || data.membership?.company?.id;

		console.log(
			`✅ Payment succeeded: ${paymentId} for user ${user_id}, membership: ${membership_id}, company: ${company_id}`,
		);

		if (paymentId && user_id && membership_id && company_id) {
			waitUntil(handlePaymentSuccess(paymentId, user_id, membership_id, company_id));
		} else {
			console.warn("⚠️ Missing data in payment.succeeded webhook, skipping processing");
		}
	}

	return new Response("OK", { status: 200 });
}

export async function handlePaymentFailure(
	paymentId: string,
	amount: number,
	userId: string | null | undefined,
	membershipId: string | null | undefined,
	companyId: string | null | undefined,
) {
	console.log("=".repeat(80));
	console.log("🔍 PROCESSING PAYMENT FAILURE");
	console.log("=".repeat(80));
	console.log("Payment ID:", paymentId);
	console.log("Amount: $", amount);
	console.log("User ID:", userId);
	console.log("Membership ID:", membershipId);
	console.log("Company ID:", companyId);
	console.log("=".repeat(80));

	if (!userId || !membershipId) {
		console.error("❌ Missing userId or membershipId in payment.failed webhook", {
			paymentId,
			userId,
			membershipId,
			companyId,
		});
		// Try to continue if we have paymentId and companyId - we might be able to get user info
		if (!paymentId || !companyId) {
			console.error("❌ Cannot proceed without paymentId and companyId");
			return;
		}
	}

	try {
		// Get company_id from webhook payload
		let resolvedCompanyId = companyId;

		if (!resolvedCompanyId) {
			console.error("❌ No company_id in webhook payload - this is required");
			return;
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
			const memberResponse = await fetchWithRetry(
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

				// ✅ FALLBACK: Try to get user data directly via user endpoint
				// Member endpoint returns 404 for company owners, so we fetch user data directly
				console.log(`🔧 Attempting fallback: Fetching user data directly for user ${userId}`);

				try {
					const userResponse = await fetchWithRetry(
						`https://api.whop.com/api/v1/users/${userId}`,
						{
							headers: {
								Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
							},
						},
					);

					if (userResponse.ok) {
						const userData = await userResponse.json();
						userEmail = userData.email || "";
						userName = userData.name || userData.username || "there";

						if (!userEmail) {
							console.error("❌ Unable to get user email from fallback - check app permissions (user:email:read required)");
							return;
						}

						console.log(`✅ Got user data via fallback for user ${userId}`);
					} else {
						console.error(`❌ Fallback user fetch failed: ${userResponse.status} ${userResponse.statusText}`);
						return;
					}
				} catch (fallbackError) {
					console.error("=".repeat(80));
					console.error("❌ FALLBACK USER FETCH ERROR");
					console.error("Error:", fallbackError);
					console.error("User ID:", userId);
					console.error("=".repeat(80));
					return;
				}
			} else {
				// Original path - get data from member response
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
		}

		// ✅ IDEMPOTENCY CHECK: Prevent duplicate payment records
		const { data: existingPayment } = await supabaseAdmin
			.from("failed_payments")
			.select("id, status, email_sent_at")
			.eq("whop_payment_id", paymentId)
			.maybeSingle();

		if (existingPayment) {
			console.log("=".repeat(80));
			console.log("⚠️  DUPLICATE WEBHOOK DETECTED - SKIPPING");
			console.log("Payment ID:", paymentId);
			console.log("Existing Record ID:", existingPayment.id);
			console.log("Status:", existingPayment.status);
			console.log("Email Sent At:", existingPayment.email_sent_at || "Not sent");
			console.log("=".repeat(80));
			return;
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
			console.error("=".repeat(80));
			console.error("❌ FAILED TO INSERT PAYMENT FAILURE");
			console.error("Error:", error);
			console.error("Payment ID:", paymentId);
			console.error("User Email:", userEmail);
			console.error("=".repeat(80));
			return;
		}

		console.log("=".repeat(80));
		console.log("💾 PAYMENT FAILURE SAVED TO DATABASE");
		console.log("Database ID:", data.id);
		console.log("Payment ID:", paymentId);
		console.log("User Email:", userEmail);
		console.log("Amount: $", amount);
		console.log("=".repeat(80));

		// ✅ Check if company has access (subscription OR trial) before sending email
		// This check happens AFTER tracking the payment in the database
		const requiredProductId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID?.trim();
		const appOwnerCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID?.trim();
		let hasAccess = false;

		// Always allow app owner's company (for testing/own use)
		if (appOwnerCompanyId && resolvedCompanyId === appOwnerCompanyId) {
			console.log(
				`✅ App owner company ${resolvedCompanyId} - has access for recovery email`,
			);
			hasAccess = true;
		} else if (!requiredProductId) {
			// No product ID set - open access mode
			console.log(
				"✅ No product ID set - app is in open access mode. Sending email.",
			);
			hasAccess = true;
		} else {
			// Check for trial first
			const { data: trialSettings } = await supabaseAdmin
				.from("creator_settings")
				.select("trial_ends_at")
				.eq("company_id", resolvedCompanyId)
				.maybeSingle();

			if (trialSettings?.trial_ends_at) {
				const now = new Date();
				const trialEnd = new Date(trialSettings.trial_ends_at);
				if (trialEnd > now) {
					console.log(`✅ Company ${resolvedCompanyId} has active trial - will send email`);
					hasAccess = true;
				}
			}

			// If no trial, check if company has purchased the app
			if (!hasAccess) {
				try {
					// Get admins of the company
					const adminsResponse = await fetchWithRetry(
						`https://api.whop.com/api/v1/members?company_id=${resolvedCompanyId}&access_level=admin&first=5`,
						{
							headers: {
								Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
							},
						},
					);

					if (adminsResponse.ok) {
						const adminsData = await adminsResponse.json();
						const admins = adminsData.data || [];

						// Check if any admin has access to our product
						for (const admin of admins) {
							const accessResponse = await fetchWithRetry(
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
									hasAccess = true;
									console.log(
										`✅ Company ${resolvedCompanyId} admin ${admin.user.id} has access to product ${requiredProductId}`,
									);
									break;
								}
							}
						}
					}
				} catch (error) {
					console.error("=".repeat(80));
					console.error("❌ ERROR CHECKING COMPANY PRODUCT ACCESS");
					console.error("Error:", error);
					console.error("Company ID:", resolvedCompanyId);
					console.error("=".repeat(80));
				}
			}
		}

		if (!hasAccess) {
			console.log("=".repeat(80));
			console.log("⏸️  PAYMENT TRACKED BUT EMAIL NOT SENT");
			console.log("Reason: Company does not have access (no trial or subscription)");
			console.log("Company ID:", resolvedCompanyId);
			console.log("Payment ID:", paymentId);
			console.log("=".repeat(80));
			return;
		}

		// Check if recovery emails are enabled
		const { data: settings } = await supabaseAdmin
			.from("creator_settings")
			.select("*")
			.eq("company_id", resolvedCompanyId)
			.maybeSingle();

		const emailEnabled = settings?.email_enabled ?? true; // Default to enabled if no settings

		if (!emailEnabled) {
			console.log("=".repeat(80));
			console.log("⏸️  PAYMENT TRACKED BUT EMAIL NOT SENT");
			console.log("Reason: Recovery emails are disabled in settings");
			console.log("Company ID:", resolvedCompanyId);
			console.log("Payment ID:", paymentId);
			console.log("=".repeat(80));
			return;
		}

		console.log("=".repeat(80));
		console.log("✅ SENDING RECOVERY EMAIL");
		console.log("To:", userEmail);
		console.log("Payment ID:", paymentId);
		console.log("Amount: $", amount);
		console.log("=".repeat(80));

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

			console.log("=".repeat(80));
			console.log("📧 RECOVERY EMAIL SENT SUCCESSFULLY");
			console.log("To:", userEmail);
			console.log("Payment ID:", paymentId);
			console.log("Database ID:", data.id);
			console.log("=".repeat(80));
		} catch (emailError) {
			console.error("=".repeat(80));
			console.error("❌ FAILED TO SEND RECOVERY EMAIL");
			console.error("Error:", emailError);
			console.error("Payment ID:", paymentId);
			console.error("User Email:", userEmail);
			console.error("=".repeat(80));
		}
	} catch (error) {
		console.error("=".repeat(80));
		console.error("❌ ERROR HANDLING PAYMENT FAILURE");
		console.error("Error:", error);
		console.error("Payment ID:", paymentId);
		console.error("=".repeat(80));
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
			console.error("=".repeat(80));
			console.error("❌ ERROR CHECKING FOR FAILED PAYMENTS");
			console.error("Error:", error);
			console.error("=".repeat(80));
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
		console.error("=".repeat(80));
		console.error("❌ ERROR HANDLING PAYMENT SUCCESS");
		console.error("Error:", error);
		console.error("=".repeat(80));
	}
}
