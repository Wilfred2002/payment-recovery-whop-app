import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import type { FailedPayment } from "@/lib/supabase";

export default async function DashboardPage({
	params,
}: {
	params: Promise<{ companyId: string }>;
}) {
	const headersList = await headers();
	const { companyId } = await params;
	const { userId } = await whopSdk.verifyUserToken(headersList);

	const result = await whopSdk.access.checkIfUserHasAccessToCompany({
		userId,
		companyId,
	});

	if (result.accessLevel !== "admin") {
		return (
			<div className="flex justify-center items-center h-screen px-8">
				<h1 className="text-xl text-red-500">
					Access Denied: You must be an admin to view this dashboard.
				</h1>
			</div>
		);
	}

	const company = await whopSdk.companies.getCompany({ companyId });

	const { data: allFailures } = await supabaseAdmin
		.from("failed_payments")
		.select("*")
		.eq("company_id", companyId)
		.order("failed_at", { ascending: false });

	const failures = (allFailures || []) as FailedPayment[];

	const totalFailed = failures.length;
	const totalRecovered = failures.filter((f) => f.status === "recovered").length;
	const recoveryRate =
		totalFailed > 0 ? ((totalRecovered / totalFailed) * 100).toFixed(1) : "0";
	const totalSaved = failures
		.filter((f) => f.status === "recovered")
		.reduce((sum, f) => sum + Number(f.amount), 0);

	const recentFailures = failures.slice(0, 20);

	return (
		<div className="min-h-screen bg-gray-50 py-8 px-4">
			<div className="max-w-7xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-3xl font-bold text-gray-900">
						Payment Recovery Dashboard
					</h1>
					<p className="text-gray-600 mt-2">{company.title}</p>
				</div>

				{/* Stats Grid */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<StatCard
						title="Failed Payments"
						value={totalFailed.toString()}
						bgColor="bg-red-50"
						textColor="text-red-600"
					/>
					<StatCard
						title="Recovered"
						value={totalRecovered.toString()}
						bgColor="bg-green-50"
						textColor="text-green-600"
					/>
					<StatCard
						title="Recovery Rate"
						value={`${recoveryRate}%`}
						bgColor="bg-blue-50"
						textColor="text-blue-600"
					/>
					<StatCard
						title="Total Saved"
						value={`$${totalSaved.toFixed(2)}`}
						bgColor="bg-purple-50"
						textColor="text-purple-600"
					/>
				</div>

				{/* Recent Failures Table */}
				<div className="bg-white rounded-lg shadow">
					<div className="px-6 py-4 border-b border-gray-200">
						<h2 className="text-xl font-semibold text-gray-900">
							Recent Failed Payments
						</h2>
					</div>
					<div className="overflow-x-auto">
						<table className="min-w-full divide-y divide-gray-200">
							<thead className="bg-gray-50">
								<tr>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Member
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Amount
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Status
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Failed At
									</th>
									<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
										Time to Recovery
									</th>
								</tr>
							</thead>
							<tbody className="bg-white divide-y divide-gray-200">
								{recentFailures.length === 0 ? (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-12 text-center text-gray-500"
										>
											No failed payments yet. This is good news!
										</td>
									</tr>
								) : (
									recentFailures.map((failure) => (
										<tr key={failure.id}>
											<td className="px-6 py-4 whitespace-nowrap">
												<div className="text-sm font-medium text-gray-900">
													{failure.user_name || "Unknown"}
												</div>
												<div className="text-sm text-gray-500">
													{failure.user_email}
												</div>
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
												${Number(failure.amount).toFixed(2)}
											</td>
											<td className="px-6 py-4 whitespace-nowrap">
												<StatusBadge status={failure.status} />
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{new Date(failure.failed_at).toLocaleString()}
											</td>
											<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
												{failure.recovered_at
													? getTimeDiff(failure.failed_at, failure.recovered_at)
													: "-"}
											</td>
										</tr>
									))
								)}
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}

function StatCard({
	title,
	value,
	bgColor,
	textColor,
}: {
	title: string;
	value: string;
	bgColor: string;
	textColor: string;
}) {
	return (
		<div className={`${bgColor} rounded-lg p-6`}>
			<p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
			<p className={`text-3xl font-bold ${textColor}`}>{value}</p>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const styles = {
		pending: "bg-yellow-100 text-yellow-800",
		sent: "bg-blue-100 text-blue-800",
		recovered: "bg-green-100 text-green-800",
		lost: "bg-red-100 text-red-800",
	};

	return (
		<span
			className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${styles[status as keyof typeof styles] || "bg-gray-100 text-gray-800"}`}
		>
			{status.charAt(0).toUpperCase() + status.slice(1)}
		</span>
	);
}

function getTimeDiff(start: string, end: string): string {
	const diff = new Date(end).getTime() - new Date(start).getTime();
	const minutes = Math.floor(diff / 1000 / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (days > 0) return `${days}d ${hours % 24}h`;
	if (hours > 0) return `${hours}h ${minutes % 60}m`;
	return `${minutes}m`;
}
