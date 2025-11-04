import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import Header from "@/app/components/Header";

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
						<h1 className="text-3xl font-bold text-mint-700 mb-4">
							Experience Not Found
						</h1>
						<p className="text-mint-600">
							The experience you're looking for doesn't exist.
						</p>
					</div>
				</div>
			</div>
		);
	}

	const experience = await experienceResponse.json();
	const companyId = experience.company.id;

	console.log(`🔍 Experience page - User: ${userId}, Company: ${companyId}`);

	// Check if user is a member of the company (more reliable than experience check)
	const companyMemberId = `${userId}_${companyId}`;
	const memberResponse = await fetch(
		`https://api.whop.com/api/v1/companies/${companyId}/members/${companyMemberId}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
			},
		},
	);

	console.log(`🔍 Member check response status: ${memberResponse.status}`);

	// Determine user's access level
	let hasAccess = false;
	let isAdmin = false;

	if (memberResponse.ok) {
		const memberData = await memberResponse.json();
		console.log(`🔍 Member data:`, JSON.stringify(memberData, null, 2));

		if (memberData.member) {
			hasAccess = true;
			// Check for admin OR owner access levels
			isAdmin = memberData.member.access_level === "admin" || memberData.member.access_level === "owner";
			console.log(`✅ User has access - Access Level: ${memberData.member.access_level}, Is Admin/Owner: ${isAdmin}`);
		} else {
			console.log(`❌ No member data in response`);
		}
	} else {
		console.log(`❌ Member API call failed: ${memberResponse.status} ${memberResponse.statusText}`);

		// ✅ FALLBACK: Check if user is company owner
		console.log(`🔧 Checking if user is company owner...`);

		try {
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
					hasAccess = true;
					isAdmin = true;
				}
			}
		} catch (error) {
			console.error(`❌ Error checking company owner:`, error);
		}
	}

	// If user is an admin, show admin dashboard access page
	if (isAdmin && companyId) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={true} companyId={companyId} />
				<div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-8">
					<div className="text-center max-w-xl">
						<div className="text-4xl sm:text-6xl mb-4 sm:mb-6">👑</div>
						<h1 className="text-2xl sm:text-3xl font-bold text-mint-700 mb-3 sm:mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Admin Access
						</h1>
						<p className="text-base sm:text-lg text-mint-700 mb-4 sm:mb-6">
							Welcome, Admin! 👋
						</p>
						<div className="bg-white border border-mint-200 rounded-lg p-4 sm:p-6 shadow-sm text-left mb-4 sm:mb-6">
							<p className="text-sm sm:text-base text-mint-700 mb-4">
								You have admin access to the Payment Recovery Dashboard.
								Click the button below to manage failed payments, view recovery
								statistics, and configure email settings.
							</p>
							<div className="flex justify-center">
								<a
									href={`/dashboard/${companyId}`}
									className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-mint-600 text-white font-semibold rounded-lg hover:bg-mint-700 transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider text-sm"
								>
									Go to Dashboard →
								</a>
							</div>
						</div>
						<p className="text-xs sm:text-sm text-mint-500">
							This app helps you automatically recover failed payments by sending
							personalized recovery emails to customers.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// If user has no access, show access denied
	if (!hasAccess) {
		return (
			<div className="min-h-screen bg-mint-50 flex flex-col">
				<Header showNav={false} companyId={companyId} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">🔒</div>
						<h1 className="text-3xl font-bold text-mint-700 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
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
			</div>
		);
	}

	// If user is a regular customer (not admin), show info message
	return (
		<div className="min-h-screen bg-mint-50 flex flex-col">
			<Header showNav={false} companyId={companyId} />
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="text-center max-w-2xl">
					<div className="text-6xl mb-6">💳</div>
					<h1 className="text-3xl font-bold text-mint-700 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
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
		</div>
	);
}
