import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { whopSdk } from "@/lib/whop-sdk";

export default async function Page() {
	const companyId = process.env.NEXT_PUBLIC_WHOP_COMPANY_ID;

	if (!companyId) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
				<div className="max-w-md text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Payment Recovery Bot
					</h1>
					<p className="text-gray-600 mb-6">
						Automatically recover failed payments and save your revenue.
					</p>
					<p className="text-sm text-gray-500">
						Please configure your company ID in environment variables.
					</p>
				</div>
			</div>
		);
	}

	try {
		const headersList = await headers();
		const { userId } = await whopSdk.verifyUserToken(headersList);

		const result = await whopSdk.access.checkIfUserHasAccessToCompany({
			userId,
			companyId,
		});

		if (result.accessLevel === "admin") {
			redirect(`/dashboard/${companyId}`);
		}

		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
				<div className="max-w-md text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Payment Recovery Bot
					</h1>
					<p className="text-gray-600 mb-6">
						This app is for company creators and admins only.
					</p>
					<p className="text-sm text-gray-500">
						If you're a creator, install this app from your Whop company
						settings to access the dashboard.
					</p>
				</div>
			</div>
		);
	} catch (error) {
		return (
			<div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
				<div className="max-w-md text-center">
					<h1 className="text-3xl font-bold text-gray-900 mb-4">
						Payment Recovery Bot
					</h1>
					<p className="text-gray-600 mb-6">
						Automatically recover failed payments and save your revenue.
					</p>
					<p className="text-sm text-gray-500">
						Install this app from your Whop company settings to get started.
					</p>
				</div>
			</div>
		);
	}
}
