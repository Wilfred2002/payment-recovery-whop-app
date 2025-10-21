import { waitUntil } from "@vercel/functions";
import { makeWebhookValidator } from "@whop/api";
import type { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { sendRecoveryEmail } from "@/lib/email";
import { whopSdk } from "@/lib/whop-sdk";

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

	if (webhookData.action === "payment.failed") {
		const { id, final_amount, user_id, membership_id } = webhookData.data;

		console.log(
			`💥 Payment failed: ${id} for user ${user_id}, amount: $${final_amount}`,
		);

		waitUntil(handlePaymentFailure(id, final_amount, user_id, membership_id));
	}

	if (webhookData.action === "payment.succeeded") {
		const { id, final_amount, user_id, membership_id } = webhookData.data;

		console.log(
			`✅ Payment succeeded: ${id} for user ${user_id}, amount: $${final_amount}`,
		);

		waitUntil(handlePaymentSuccess(id, user_id, membership_id));
	}

	return new Response("OK", { status: 200 });
}

async function handlePaymentFailure(
	paymentId: string,
	amount: number,
	userId: string | null | undefined,
	membershipId: string | null | undefined,
) {
	if (!userId || !membershipId) {
		console.error("Missing userId or membershipId in payment.failed webhook");
		return;
	}

	try {
		const user = await whopSdk.users.getUser({ userId });
		const companyId =
			process.env.NEXT_PUBLIC_WHOP_COMPANY_ID || "unknown_company";
		const userEmail = "wfnaraga@gmail.com";

		const { data, error } = await supabaseAdmin
			.from("failed_payments")
			.insert({
				whop_payment_id: paymentId,
				whop_membership_id: membershipId,
				whop_user_id: userId,
				user_email: userEmail,
				user_name: user.name || user.username,
				amount: amount,
				company_id: companyId,
				status: "pending",
			})
			.select()
			.single();

		if (error) {
			console.error("Failed to insert payment failure:", error);
			return;
		}

		console.log("💾 Failed payment saved to database:", data.id);

		try {
			await sendRecoveryEmail({
				to: userEmail,
				userName: user.name || user.username || "there",
				amount: amount,
				membershipId: membershipId,
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
) {
	if (!userId || !membershipId) {
		return;
	}

	try {
		const { data: failedPayments, error } = await supabaseAdmin
			.from("failed_payments")
			.select("*")
			.eq("whop_membership_id", membershipId)
			.eq("whop_user_id", userId)
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
