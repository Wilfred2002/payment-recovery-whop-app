import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const headersList = await headers();
	const { experienceId } = await params;

	const { userId } = await whopSdk.verifyUserToken(headersList);

	// Get experience details via REST API to find the company_id
	const experienceResponse = await fetch(
		`https://api.whop.com/api/v1/experiences/${experienceId}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
			},
		},
	);

	if (!experienceResponse.ok) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">❌</div>
						<h1 className="text-3xl font-bold text-mint-800 mb-4">
							Experience Not Found
						</h1>
						<p className="text-mint-600">
							The experience you're looking for doesn't exist.
						</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	const experience = await experienceResponse.json();
	const companyId = experience.company.id;

	// Check if user has access to this experience via REST API
	const accessResponse = await fetch(
		`https://api.whop.com/api/v1/users/${userId}/access/${experienceId}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
			},
		},
	);

	let result = { hasAccess: false, accessLevel: "no_access" as const };
	if (accessResponse.ok) {
		result = await accessResponse.json();
	}

	// Check if user is admin of the company
	let isAdmin = false;
	if (companyId && result.hasAccess) {
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
			isAdmin = memberData.member?.access_level === "admin";
		}
	}

	// If user is an admin, show admin dashboard access page
	if (isAdmin && companyId) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-2xl">
						<div className="text-6xl mb-6">👑</div>
						<h1 className="text-3xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Admin Access
						</h1>
						<p className="text-lg text-mint-700 mb-6">
							Welcome, Admin! 👋
						</p>
						<div className="bg-white border border-mint-200 rounded-lg p-6 shadow-sm text-left mb-6">
							<p className="text-mint-700 mb-4">
								You have admin access to the Payment Recovery Dashboard. 
								Click the button below to manage failed payments, view recovery 
								statistics, and configure email settings.
							</p>
							<div className="flex justify-center">
								<a
									href={`/dashboard/${companyId}`}
									className="inline-flex items-center px-6 py-3 bg-mint-600 text-white font-semibold rounded-lg hover:bg-mint-700 transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider"
								>
									Go to Dashboard →
								</a>
							</div>
						</div>
						<p className="text-sm text-mint-500">
							This app helps you automatically recover failed payments by sending 
							personalized recovery emails to customers.
						</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// If user has no access, show access denied
	if (!result.hasAccess) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">🔒</div>
						<h1 className="text-3xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Access Denied
						</h1>
						<p className="text-lg text-mint-700 mb-2">
							Hi there!
						</p>
						<p className="text-mint-600">
							You don't have access to this experience yet. Please purchase a
							membership to continue.
						</p>
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	// If user is a regular customer (not admin), show info message
	return (
		<div className="min-h-screen bg-mint-50 flex flex-col">
			<Header showNav={false} />
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="text-center max-w-2xl">
					<div className="text-6xl mb-6">💳</div>
					<h1 className="text-3xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
						Rebound Payment Recovery
					</h1>
					<p className="text-lg text-mint-700 mb-4">
						Hi there! 👋
					</p>
					<div className="bg-white border border-mint-200 rounded-lg p-6 shadow-sm text-left">
						<p className="text-mint-700 mb-4">
							This app helps business owners automatically recover failed
							payments by sending personalized recovery emails to customers.
						</p>
						<p className="text-mint-600 text-sm">
							As a member, you don't need to interact with this app directly. If
							you ever have a payment issue, you'll receive an automated email
							with instructions to update your payment method.
						</p>
					</div>
					<p className="text-sm text-mint-500 mt-6">
						Questions? Contact your community administrator.
					</p>
				</div>
			</div>
			<Footer />
		</div>
	);
}
