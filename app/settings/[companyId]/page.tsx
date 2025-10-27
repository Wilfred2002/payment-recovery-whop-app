import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import SettingsClient from "./SettingsClient";
import SubscribeButton from "@/app/components/SubscribeButton";
import { checkHasActiveSubscription, checkIsAdmin } from "@/lib/access-check";

export default async function SettingsPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const headersList = await headers();
	const { companyId } = await params;

	const { userId } = await whopSdk.verifyUserToken(headersList);

	// ✅ FIRST: Check if they have an active subscription to this app
	const hasSubscription = await checkHasActiveSubscription(userId, companyId);

	if (!hasSubscription) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">🔒</div>
						<h1 className="text-3xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Subscription Required
						</h1>
						<p className="text-lg text-mint-700 mb-4">
							This app requires an active subscription to access settings.
						</p>
						<div className="bg-white border border-mint-200 rounded-lg p-6 shadow-sm text-left mb-6">
							<p className="text-mint-700 mb-4">
								<strong>Payment Recovery Dashboard</strong> helps you automatically recover failed payments and increase revenue.
							</p>
							<ul className="text-sm text-mint-600 space-y-2 mb-4">
								<li>✓ Automated recovery emails</li>
								<li>✓ Real-time payment tracking</li>
								<li>✓ Customizable email templates</li>
								<li>✓ Recovery analytics</li>
							</ul>
						</div>
						<SubscribeButton companyId={companyId}>
							Subscribe Now →
						</SubscribeButton>
						<p className="text-xs text-mint-500 mt-4">
							$30/month • Cancel anytime
						</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// ✅ SECOND: Check if they're an admin
	const isAdmin = await checkIsAdmin(userId, companyId);

	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">👑</div>
						<h1 className="text-3xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Admin Access Required
						</h1>
						<p className="text-lg text-mint-700 mb-2">
							Hi there!
						</p>
						<p className="text-mint-600">
							You must be an admin to access settings. Please contact your company administrator.
						</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// Fetch initial settings server-side
	const { data: settings } = await supabaseAdmin
		.from("creator_settings")
		.select("*")
		.eq("company_id", companyId)
		.single();

	return <SettingsClient companyId={companyId} initialSettings={settings} />;
}
