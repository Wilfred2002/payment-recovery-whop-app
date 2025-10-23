import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	// The headers contains the user token
	const headersList = await headers();

	// The experienceId is a path param
	const { experienceId } = await params;

	// Debug: Log if x-whop-user-token header is present
	const hasUserToken = headersList.has("x-whop-user-token");
	console.log("[DEBUG] x-whop-user-token present:", hasUserToken);
	if (!hasUserToken) {
		console.log("[DEBUG] Available headers:", Array.from(headersList.keys()));
	}

	// The user token is in the headers
	const { userId } = await whopSdk.verifyUserToken(headersList);

	// Check if user has access to this experience
	const result = await whopSdk.access.checkIfUserHasAccessToExperience({
		userId,
		experienceId,
	});

	// Get experience details to find the company_id
	const experience = await whopSdk.experiences.getExperience({ experienceId });
	const companyId = experience.company.id;

	// If user is an admin, show admin dashboard access page
	if (result.accessLevel === "admin" && companyId) {
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
