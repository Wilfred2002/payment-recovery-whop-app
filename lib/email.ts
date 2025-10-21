import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendRecoveryEmailParams {
	to: string;
	userName: string;
	amount: number;
	membershipId: string;
	customSubject?: string;
	customBody?: string;
}

export async function sendRecoveryEmail({
	to,
	userName,
	amount,
	membershipId,
	customSubject,
	customBody,
}: SendRecoveryEmailParams) {
	const updatePaymentUrl = `https://whop.com/hub/settings/billing`;

	// Use custom subject or default
	const subject = customSubject || "⚠️ Your payment failed - Update needed";

	// If custom body is provided, use it
	if (customBody) {
		// Replace variables in custom body
		const processedBody = customBody
			.replace(/{name}/g, userName || "there")
			.replace(/{amount}/g, `$${amount.toFixed(2)}`)
			.replace(
				/{updateLink}/g,
				`<a href="${updatePaymentUrl}" style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold; margin: 20px 0;">Update Payment Method</a>`,
			);

		// Simple HTML wrapper for custom template
		const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px; white-space: pre-wrap;">
${processedBody}
  </div>
  <div style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
    <p style="margin: 0;">
      This is an automated message from your membership provider.
    </p>
  </div>
</body>
</html>
`;

		const textContent = customBody
			.replace(/{name}/g, userName || "there")
			.replace(/{amount}/g, `$${amount.toFixed(2)}`)
			.replace(/{updateLink}/g, updatePaymentUrl);

		try {
			const { data, error } = await resend.emails.send({
				from: "Payment Recovery <onboarding@resend.dev>",
				to,
				subject,
				html: htmlContent,
				text: textContent,
			});

			if (error) {
				console.error("Failed to send email:", error);
				throw new Error(`Email send failed: ${error.message}`);
			}

			console.log("Recovery email sent successfully:", data);
			return data;
		} catch (error) {
			console.error("Error sending recovery email:", error);
			throw error;
		}
	}

	// Default template (original code)
	const defaultSubject = subject;

	const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">

  <div style="background-color: #f8f9fa; border-radius: 8px; padding: 30px; margin-bottom: 20px;">
    <h1 style="color: #dc3545; margin: 0 0 20px 0; font-size: 24px;">
      Payment Failed
    </h1>

    <p style="margin: 0 0 15px 0; font-size: 16px;">
      Hi ${userName || "there"},
    </p>

    <p style="margin: 0 0 15px 0; font-size: 16px;">
      We tried to process your payment of <strong>$${amount.toFixed(2)}</strong>, but it was declined.
    </p>

    <p style="margin: 0 0 15px 0; font-size: 16px;">
      This usually happens when:
    </p>

    <ul style="margin: 0 0 20px 0; padding-left: 20px;">
      <li>Your card has expired</li>
      <li>Your card has reached its limit</li>
      <li>Your bank declined the transaction</li>
      <li>Your billing information has changed</li>
    </ul>

    <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #856404;">
        <strong>⏰ Action Required:</strong> Please update your payment method within 24 hours to keep your access.
      </p>
    </div>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${updatePaymentUrl}"
         style="display: inline-block; background-color: #28a745; color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-size: 16px; font-weight: bold;">
        Update Payment Method
      </a>
    </div>

    <p style="margin: 20px 0 0 0; font-size: 14px; color: #6c757d;">
      If you have any questions, just reply to this email. We're here to help!
    </p>
  </div>

  <div style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
    <p style="margin: 0;">
      This is an automated message from your membership provider.
    </p>
  </div>

</body>
</html>
`;

	const textContent = `
Payment Failed

Hi ${userName || "there"},

We tried to process your payment of $${amount.toFixed(2)}, but it was declined.

This usually happens when:
- Your card has expired
- Your card has reached its limit
- Your bank declined the transaction
- Your billing information has changed

⏰ ACTION REQUIRED: Please update your payment method within 24 hours to keep your access.

Update your payment method here:
${updatePaymentUrl}

If you have any questions, just reply to this email. We're here to help!

---
This is an automated message from your membership provider.
`;

	try {
		const { data, error } = await resend.emails.send({
			from: "Payment Recovery <onboarding@resend.dev>",
			to,
			subject,
			html: htmlContent,
			text: textContent,
		});

		if (error) {
			console.error("Failed to send email:", error);
			throw new Error(`Email send failed: ${error.message}`);
		}

		console.log("Recovery email sent successfully:", data);
		return data;
	} catch (error) {
		console.error("Error sending recovery email:", error);
		throw error;
	}
}
