import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import type { FailedPayment } from "@/lib/supabase";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";

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
		<div className="min-h-screen bg-mint-50 flex flex-col">
			<Header showNav={true} companyId={companyId} />

			{/* Main Content: Sidebar + Table */}
			<div className="flex-1">
				<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar - Stats */}
					<aside className="lg:w-64 flex-shrink-0">
						<div className="space-y-4">
							<StatCard
								title="Failed Payments"
								value={totalFailed.toString()}
								bgColor="bg-white"
								textColor="text-mint-700"
							/>
							<StatCard
								title="Recovered"
								value={totalRecovered.toString()}
								bgColor="bg-mint-100"
								textColor="text-mint-800"
							/>
							<StatCard
								title="Recovery Rate"
								value={`${recoveryRate}%`}
								bgColor="bg-white"
								textColor="text-mint-700"
							/>
							<StatCard
								title="Total Saved"
								value={`$${totalSaved.toFixed(2)}`}
								bgColor="bg-mint-100"
								textColor="text-mint-800"
							/>
						</div>
					</aside>

					{/* Main Table */}
					<main className="flex-1 min-w-0">
						<div className="bg-white border border-mint-200 rounded-lg overflow-hidden shadow-sm">
							<div className="px-6 py-4 border-b border-mint-200 bg-mint-50">
								<h2 className="text-sm font-bold text-mint-800 font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
									Recent Failed Payments
								</h2>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<thead>
										<tr className="border-b border-mint-100 bg-mint-50">
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Member
											</th>
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Email
											</th>
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Amount
											</th>
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Status
											</th>
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Failed At
											</th>
											<th className="px-6 py-3 text-left text-xs font-semibold text-mint-700 uppercase tracking-wider font-[family-name:var(--font-space-mono)]">
												Recovery Time
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-mint-100">
										{recentFailures.length === 0 ? (
											<tr>
												<td
													colSpan={6}
													className="px-6 py-16 text-center text-mint-600"
												>
													<div className="text-4xl mb-2">✓</div>
													<div className="text-sm font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
														No failed payments yet. This is good news!
													</div>
												</td>
											</tr>
										) : (
											recentFailures.map((failure) => (
												<tr
													key={failure.id}
													className="hover:bg-mint-50 transition-colors"
												>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-mint-900">
														{failure.user_name || "Unknown"}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-700">
														{failure.user_email}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-mint-800">
														${Number(failure.amount).toFixed(2)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														<StatusBadge status={failure.status} />
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-600">
														{formatDate(failure.failed_at)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-600">
														{failure.recovered_at
															? getTimeDiff(
																	failure.failed_at,
																	failure.recovered_at,
																)
															: "-"}
													</td>
												</tr>
											))
										)}
									</tbody>
								</table>
							</div>
						</div>
					</main>
				</div>
				</div>
			</div>

			<Footer />
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
		<div className={`${bgColor} rounded-lg p-5 border border-mint-200 shadow-sm`}>
			<p className="text-xs font-semibold text-mint-600 uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]">
				{title}
			</p>
			<p className={`text-2xl font-bold ${textColor}`}>{value}</p>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const styles = {
		pending: "bg-yellow-50 text-yellow-800 border-yellow-300",
		sent: "bg-blue-50 text-blue-800 border-blue-300",
		recovered: "bg-mint-100 text-mint-800 border-mint-300",
		lost: "bg-gray-100 text-gray-700 border-gray-300",
	};

	return (
		<span
			className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded border font-[family-name:var(--font-space-mono)] uppercase ${styles[status as keyof typeof styles] || "bg-gray-50 text-gray-700 border-gray-200"}`}
		>
			{status}
		</span>
	);
}

function formatDate(dateString: string): string {
	const date = new Date(dateString);
	return new Intl.DateTimeFormat("en-US", {
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "2-digit",
		hour12: true,
	}).format(date);
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
