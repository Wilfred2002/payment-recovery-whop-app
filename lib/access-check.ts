import { whopSdk } from "./whop-sdk";

/**
 * Checks if a user/company has an active subscription to this app
 * Returns true only if they have a valid membership to the premium plan
 */
export async function checkHasActiveSubscription(
	userId: string,
	companyId: string,
): Promise<boolean> {
	try {
		// First check basic company access
		const accessResult = await whopSdk.access.checkIfUserHasAccessToCompany({
			userId,
			companyId,
		});

		if (!accessResult.hasAccess) {
			return false;
		}

		// If NEXT_PUBLIC_PREMIUM_PLAN_ID is not set, app is in open beta mode
		const requiredPlanId = process.env.NEXT_PUBLIC_PREMIUM_PLAN_ID;
		if (!requiredPlanId) {
			console.warn(
				"⚠️  NEXT_PUBLIC_PREMIUM_PLAN_ID not set - app is in OPEN ACCESS mode",
			);
			console.warn(
				"⚠️  Set this env var and create a paid product to enable subscription gating",
			);
			// In development/testing without plan ID, allow access
			return true;
		}

		// Check if user has an active membership to the premium plan
		try {
			const memberships = await whopSdk.companies.listMemberships({
				companyId,
				userId,
			});

			// Check if any membership is for our premium plan and is valid
			const hasActivePlan = memberships.data.some((membership) => {
				const isCorrectPlan = membership.planId === requiredPlanId;
				const isValid = membership.valid === true;
				const isActive =
					membership.status === "active" ||
					membership.status === "trialing";

				return isCorrectPlan && isValid && isActive;
			});

			if (!hasActivePlan) {
				console.log(
					`❌ User ${userId} in company ${companyId} does not have active subscription to plan ${requiredPlanId}`,
				);
				return false;
			}

			console.log(
				`✅ User ${userId} in company ${companyId} has active subscription`,
			);
			return true;
		} catch (error) {
			console.error("Error checking memberships:", error);
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
	const result = await whopSdk.access.checkIfUserHasAccessToCompany({
		userId,
		companyId,
	});

	return result.accessLevel === "admin";
}
