/**
 * Checks if a user has access to this app's product
 * Uses Whop's check access REST API endpoint with product ID
 */
export async function checkHasActiveSubscription(
	userId: string,
	companyId: string,
): Promise<boolean> {
	try {
		// First check basic company access via REST API
		const companyMemberId = `${userId}_${companyId}`;
		const memberResponse = await fetch(
			`https://api.whop.com/api/v1/companies/${companyId}/members/${companyMemberId}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
				},
			},
		);

		if (!memberResponse.ok) {
			console.error(
				`Failed to check company access: ${memberResponse.status} ${memberResponse.statusText}`,
			);
			return false;
		}

		const memberData = await memberResponse.json();
		if (!memberData.member) {
			return false;
		}

		// If NEXT_PUBLIC_WHOP_PRODUCT_ID is not set, app is in open beta mode
		const requiredProductId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID;
		if (!requiredProductId) {
			console.warn(
				"⚠️  NEXT_PUBLIC_WHOP_PRODUCT_ID not set - app is in OPEN ACCESS mode",
			);
			console.warn(
				"⚠️  Set this env var to enable subscription gating",
			);
			// In development/testing without product ID, allow access
			return true;
		}

		// Check if user has access to the product using Whop's check access API
		try {
			const response = await fetch(
				`https://api.whop.com/api/v1/users/${userId}/access/${requiredProductId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				},
			);

			if (!response.ok) {
				console.error(
					`Failed to check access: ${response.status} ${response.statusText}`,
				);
				return false;
			}

			const data = await response.json();

			if (data.has_access) {
				console.log(
					`✅ User ${userId} has access to product ${requiredProductId}`,
				);
				return true;
			} else {
				console.log(
					`❌ User ${userId} does not have access to product ${requiredProductId}`,
				);
				return false;
			}
		} catch (error) {
			console.error("Error checking product access:", error);
			// If we can't verify, deny access for security
			return false;
		}
	} catch (error) {
		console.error("Error checking subscription access:", error);
		return false;
	}
}

/**
 * Checks if a user is an admin of the company
 */
export async function checkIsAdmin(
	userId: string,
	companyId: string,
): Promise<boolean> {
	try {
		const companyMemberId = `${userId}_${companyId}`;
		const memberResponse = await fetch(
			`https://api.whop.com/api/v1/companies/${companyId}/members/${companyMemberId}`,
			{
				headers: {
					Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
				},
			},
		);

		if (!memberResponse.ok) {
			console.error(
				`Failed to check admin status: ${memberResponse.status} ${memberResponse.statusText}`,
			);
			return false;
		}

		const memberData = await memberResponse.json();
		return memberData.member?.access_level === "admin";
	} catch (error) {
		console.error("Error checking admin status:", error);
		return false;
	}
}
