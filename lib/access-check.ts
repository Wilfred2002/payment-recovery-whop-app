import { supabaseAdmin } from "./supabase";

/**
 * Checks if a company has an active trial (30 days)
 */
async function checkHasActiveTrial(companyId: string): Promise<boolean> {
	try {
		const { data: settings } = await supabaseAdmin
			.from("creator_settings")
			.select("trial_ends_at")
			.eq("company_id", companyId)
			.single();

		if (!settings?.trial_ends_at) {
			// No trial set - initialize one for new users
			const trialEndsAt = new Date();
			trialEndsAt.setDate(trialEndsAt.getDate() + 30);

			await supabaseAdmin
				.from("creator_settings")
				.upsert({
					company_id: companyId,
					trial_ends_at: trialEndsAt.toISOString(),
				});

			console.log(`✅ Initialized 30-day trial for company ${companyId}`);
			return true;
		}

		const now = new Date();
		const trialEnd = new Date(settings.trial_ends_at);
		const isActive = trialEnd > now;

		if (isActive) {
			const daysLeft = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
			console.log(`✅ Company ${companyId} has ${daysLeft} days left in trial`);
		} else {
			console.log(`❌ Trial expired for company ${companyId}`);
		}

		return isActive;
	} catch (error) {
		console.error("Error checking trial status:", error);
		return false;
	}
}

/**
 * Checks if a user has access to this app's product
 * Uses Whop's check access REST API endpoint with product ID
 * Also checks for active 30-day trial period
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

		let memberData = null;

		if (memberResponse.ok) {
			memberData = await memberResponse.json();
			if (!memberData.member) {
				console.error("Member response OK but no member data - checking owner fallback");
				// Don't return false yet - try owner check fallback
				memberData = null;
			}
		}

		if (!memberData) {
			// 404 means not found via member endpoint - check if user is company owner
			console.warn(
				`Member endpoint failed (${memberResponse.status}). Checking if user is company owner...`,
			);

			try {
				// Check if user is the company owner via company endpoint
				const companyResponse = await fetch(
					`https://api.whop.com/api/v1/companies/${companyId}`,
					{
						headers: {
							Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
						},
					},
				);

				if (companyResponse.ok) {
					const companyData = await companyResponse.json();
					const ownerId = companyData.owner_user?.id;

					console.log(`🔍 Company owner: ${ownerId}, Current user: ${userId}`);
					console.log(`🔍 Checking company: ${companyId}, App owner company: ${process.env.NEXT_PUBLIC_WHOP_COMPANY_ID}`);

					const appOwnerCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID?.trim();
					const isAppOwnerCompany = appOwnerCompanyId && companyId === appOwnerCompanyId;

					console.log(`🔍 DEBUG isAppOwnerCompany:`, {
						appOwnerCompanyId,
						companyId,
						match: companyId === appOwnerCompanyId,
						isAppOwnerCompany,
						companyIdType: typeof companyId,
						appOwnerType: typeof appOwnerCompanyId,
					});

					if (ownerId === userId) {
						console.log(`✅ User is company owner`);

						// For app owner company, owner always has access without subscription
						if (isAppOwnerCompany) {
							console.log(`✅ App owner company - granting access without subscription check`);
							return true;
						} else {
							console.log(`❌ isAppOwnerCompany is false - not granting access`);
						}
					}

					// Also check if user is an admin by listing admins
					if (isAppOwnerCompany) {
						console.log(`🔍 Checking if user is an admin in app owner company...`);
						try {
							const adminsResponse = await fetch(
								`https://api.whop.com/api/v1/members?company_id=${companyId}&access_level=admin`,
								{
									headers: {
										Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
									},
								},
							);

							if (adminsResponse.ok) {
								const adminsData = await adminsResponse.json();
								const isAdmin = adminsData.data?.some((member: any) => member.user?.id === userId);

								if (isAdmin) {
									console.log(`✅ User is an admin in app owner company - granting access`);
									return true;
								}
							}
						} catch (adminCheckError) {
							console.error("Admin list check failed:", adminCheckError);
						}
					}
				}
			} catch (fallbackError) {
				console.error("Company owner check failed:", fallbackError);
			}

			// If not owner or checks fail, deny access
			console.error(
				`Failed to check company access: ${memberResponse.status} ${memberResponse.statusText}`,
			);
			return false;
		}

		// ✅ BYPASS: App owner company (biz_BtHV9ujFzzNw6H) admins/owners for testing
		// Only admins/owners of the app owner's company get access without subscription
		// Regular customers still need to purchase the product
		const appOwnerCompanyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;
		if (appOwnerCompanyId && companyId === appOwnerCompanyId) {
			const accessLevel = memberData.member.access_level;
			if (accessLevel === "admin" || accessLevel === "owner") {
				console.log(
					`✅ App owner company ${accessLevel} ${userId} has full access (testing bypass)`,
				);
				return true;
			}
		}

		// If NEXT_PUBLIC_WHOP_PRODUCT_ID is not set, app is in open beta mode
		const requiredProductId = process.env.NEXT_PUBLIC_WHOP_PRODUCT_ID?.trim();
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

		// ✅ Check for active 30-day trial before checking subscription
		const hasActiveTrial = await checkHasActiveTrial(companyId);
		if (hasActiveTrial) {
			console.log(`✅ Company ${companyId} has active trial - granting access`);
			return true;
		}

		// Check if user has access to the product using Whop's check access API
		try {
			const response = await fetch(
				`https://api.whop.com/api/v1/users/${userId}/access/${requiredProductId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY?.trim()}`,
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
 * Checks if a user is an admin or owner of the company
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

		if (memberResponse.ok) {
			const memberData = await memberResponse.json();
			const accessLevel = memberData.member?.access_level;
			return accessLevel === "admin" || accessLevel === "owner";
		}

		// 404 fallback: Check if user is company owner
		console.warn(
			`Member endpoint failed (${memberResponse.status}). Checking if user is company owner...`,
		);

		try {
			// Check if user is the company owner via company endpoint
			const companyResponse = await fetch(
				`https://api.whop.com/api/v1/companies/${companyId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				},
			);

			if (companyResponse.ok) {
				const companyData = await companyResponse.json();
				const ownerId = companyData.owner_user?.id;

				console.log(`🔍 Company owner: ${ownerId}, Current user: ${userId}`);

				if (ownerId === userId) {
					console.log(`✅ User is company owner - granting admin access`);
					return true;
				}

				// Also check if user is an admin by listing admins
				console.log(`🔍 Checking if user is an admin by listing admins...`);
				try {
					const adminsResponse = await fetch(
						`https://api.whop.com/api/v1/members?company_id=${companyId}&access_level=admin`,
						{
							headers: {
								Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
							},
						},
					);

					if (adminsResponse.ok) {
						const adminsData = await adminsResponse.json();
						const isAdmin = adminsData.data?.some((member: any) => member.user?.id === userId);

						if (isAdmin) {
							console.log(`✅ User found in admins list - granting admin access`);
							return true;
						}
					}
				} catch (adminCheckError) {
					console.error("Admin list check failed:", adminCheckError);
				}
			}
		} catch (fallbackError) {
			console.error("Company owner check failed:", fallbackError);
		}

		console.error(
			`Failed to check admin status: ${memberResponse.status} ${memberResponse.statusText}`,
		);
		return false;
	} catch (error) {
		console.error("Error checking admin status:", error);
		return false;
	}
}
