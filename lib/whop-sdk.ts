import { WhopServerSdk } from "@whop/api";

export const whopSdk = WhopServerSdk({
	// Add your app id here - this is required.
	// You can get this from the Whop dashboard after creating an app section.
	appId: process.env.NEXT_PUBLIC_WHOP_APP_ID ?? "fallback",

	// Add your app api key here - this is required.
	// You can get this from the Whop dashboard after creating an app section.
	appApiKey: process.env.WHOP_API_KEY ?? "fallback",

	// Add agent user ID for API requests made on behalf of the app
	onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID,

	// REMOVED companyId for multi-tenant support:
	// - companyId: Use .withCompany() instead when needed
	//
	// This allows the app to work with multiple companies dynamically
});
