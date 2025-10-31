import Link from "next/link";
import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";
import Header from "./components/Header";
import Footer from "./components/Footer";

export default async function Page() {
	const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

	if (!companyId) {
		return (
			<div className="min-h-screen bg-white flex flex-col">
				<Header showNav={false} />

				{/* Main Content */}
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="max-w-3xl">
						<p className="text-6xl font-light text-mint-900 mb-6 leading-tight">
							Recover Failed Payments Automatically
						</p>
						<p className="text-lg text-mint-600 mb-8">
							Please configure your company ID in environment variables.
						</p>
					</div>
				</div>

				<Footer />
			</div>
		);
	}

	// Check if user has access
	let hasAccess = false;
	try {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		// Check admin access via REST API
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
			hasAccess = memberData.member?.access_level === "admin";
		}
	} catch (error) {
		// User not authenticated or no access
		hasAccess = false;
	}

	return (
		<div className="min-h-screen bg-white flex flex-col">
			<Header showNav={hasAccess} companyId={hasAccess ? companyId : undefined} />

			{/* Main Content */}
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="max-w-4xl">
					<p className="text-7xl font-light text-mint-900 mb-8 leading-tight">
						Recover Failed Payments Automatically
					</p>

					<p className="text-xl text-mint-600 mb-12 max-w-2xl">
						Detect failed payments, send recovery emails, and reclaim{" "}
						<span className="font-semibold text-mint-800">$500-2000/month</span>{" "}
						in lost revenue.
					</p>

					{/* CTA */}
					{hasAccess ? (
						<Link
							href={`/dashboard/${companyId}`}
							className="inline-flex items-center gap-2 bg-mint-700 hover:bg-mint-800 text-white font-semibold px-8 py-4 rounded-md transition-all text-lg font-[family-name:var(--font-space-mono)] uppercase tracking-wider"
						>
							Dashboard →
						</Link>
					) : (
						<div className="space-y-3 max-w-xl">
							<p className="text-mint-700 text-lg">
								This app is for company creators and admins only.
							</p>
							<p className="text-sm text-mint-600">
								Install this app from your Whop company settings to access the
								dashboard.
							</p>
						</div>
					)}
				</div>
			</div>

			<Footer />
		</div>
	);
}
