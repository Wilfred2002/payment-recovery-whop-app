import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";
import { supabaseAdmin } from "@/lib/supabase";
import type { FailedPayment } from "@/lib/supabase";
import Header from "@/app/components/Header";
import SubscribeButton from "@/app/components/SubscribeButton";
import TrialBanner from "@/app/components/TrialBanner";
import { checkHasActiveSubscription, checkIsAdmin } from "@/lib/access-check";

export default async function DashboardPage({
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
			<div className="min-h-screen bg-mint-50 dark:bg-[oklch(21%_0.006_285.885)] flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">🔒</div>
						<h1 className="text-3xl font-bold text-mint-700 dark:text-mint-300 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Subscription Required
						</h1>
						<p className="text-lg text-mint-700 dark:text-mint-300 mb-4">
							This app requires an active subscription to access the dashboard.
						</p>
						<div className="bg-white dark:bg-neutral-800 border border-mint-200 dark:border-neutral-700 dark:border-neutral-700 rounded-lg p-6 shadow-sm text-left mb-6">
							<p className="text-mint-700 dark:text-mint-300 mb-4">
								<strong>Payment Recovery Dashboard</strong> helps you automatically recover failed payments and increase revenue.
							</p>
							<ul className="text-sm text-mint-600 dark:text-mint-300 space-y-2 mb-4">
								<li>✓ Automated recovery emails</li>
								<li>✓ Real-time payment tracking</li>
								<li>✓ Customizable email templates</li>
								<li>✓ Recovery analytics</li>
							</ul>
						</div>
						<SubscribeButton companyId={companyId}>
							Subscribe Now →
						</SubscribeButton>
						<p className="text-xs text-mint-500 dark:text-mint-300 mt-4">
							$30/month • Cancel anytime
						</p>
					</div>
				</div>
			</div>
		);
	}

	// ✅ SECOND: Check if they're an admin
	const isAdmin = await checkIsAdmin(userId, companyId);

	if (!isAdmin) {
		return (
			<div className="min-h-screen bg-mint-50 dark:bg-[oklch(21%_0.006_285.885)] flex flex-col">
				<Header showNav={false} />
				<div className="flex-1 flex items-center justify-center px-8">
					<div className="text-center max-w-md">
						<div className="text-6xl mb-6">👑</div>
						<h1 className="text-3xl font-bold text-mint-700 dark:text-mint-300 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							Admin Access Required
						</h1>
						<p className="text-lg text-mint-700 dark:text-mint-300 mb-2">
							Hi there!
						</p>
						<p className="text-mint-600 dark:text-mint-300">
							You must be an admin to view this dashboard. Please contact your company administrator.
						</p>
					</div>
				</div>
			</div>
		);
	}

	// Get company details via REST API
	const companyResponse = await fetch(
		`https://api.whop.com/api/v1/companies/${companyId}`,
		{
			headers: {
				Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
			},
		},
	);

	if (!companyResponse.ok) {
		throw new Error(
			`Failed to fetch company: ${companyResponse.status} ${companyResponse.statusText}`,
		);
	}

	const company = await companyResponse.json();

	// Fetch trial information
	const { data: settings } = await supabaseAdmin
		.from("creator_settings")
		.select("trial_ends_at")
		.eq("company_id", companyId)
		.single();

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
		<div className="min-h-screen bg-mint-50 dark:bg-[oklch(21%_0.006_285.885)] flex flex-col">
			<Header showNav={true} companyId={companyId} />

			{/* Main Content: Sidebar + Table */}
			<div className="flex-1">
				<div className="max-w-6xl mx-auto px-4 py-4">
				<TrialBanner trialEndsAt={settings?.trial_ends_at || null} />
				<div className="flex flex-col lg:flex-row gap-3">
					{/* Sidebar - Stats */}
					<aside className="lg:w-40 xl:w-44 shrink-0">
						<div className="space-y-2">
							<StatCard
								title="Failed Payments"
								value={totalFailed.toString()}
								bgColor="bg-white"
								textColor="text-mint-700 dark:text-mint-300"
							/>
							<StatCard
								title="Recovered"
								value={totalRecovered.toString()}
								bgColor="bg-mint-100"
								textColor="text-mint-700 dark:text-mint-300"
							/>
							<StatCard
								title="Recovery Rate"
								value={`${recoveryRate}%`}
								bgColor="bg-white"
								textColor="text-mint-700 dark:text-mint-300"
							/>
							<StatCard
								title="Total Saved"
								value={`$${totalSaved.toFixed(2)}`}
								bgColor="bg-mint-100"
								textColor="text-mint-700 dark:text-mint-300"
							/>
						</div>
					</aside>

					{/* Main Table */}
					<main className="flex-1 min-w-0">
						<div className="bg-white dark:bg-neutral-800 border border-mint-200 dark:border-neutral-700 dark:border-neutral-700 rounded-lg overflow-hidden shadow-sm">
							<div className="px-4 py-3 border-b border-mint-200 dark:border-neutral-700 bg-mint-50 dark:bg-[oklch(21%_0.006_285.885)]">
								<h2 className="text-xs sm:text-sm font-bold text-mint-700 dark:text-mint-300 font-(family-name:--font-space-mono) uppercase tracking-wider">
									Recent Failed Payments
								</h2>
							</div>
							<div className="overflow-x-auto">
								<table className="min-w-full">
									<thead>
										<tr className="border-b border-mint-100 dark:border-neutral-700 bg-mint-50 dark:bg-[oklch(21%_0.006_285.885)]">
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Member
											</th>
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Email
											</th>
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Amount
											</th>
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Status
											</th>
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Failed At
											</th>
											<th className="px-3 py-2 text-left text-xs font-semibold text-mint-700 dark:text-mint-300 uppercase tracking-wider font-(family-name:--font-space-mono)">
												Recovery Time
											</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-mint-100 dark:divide-mint-800">
										{recentFailures.length === 0 ? (
											<tr>
												<td
													colSpan={6}
													className="px-3 py-12 text-center text-mint-600 dark:text-mint-300"
												>
													<div className="text-3xl mb-2">✓</div>
													<div className="text-xs sm:text-sm font-(family-name:--font-space-mono) uppercase tracking-wider">
														No failed payments yet. This is good news!
													</div>
												</td>
											</tr>
										) : (
											recentFailures.map((failure) => (
												<tr
													key={failure.id}
													className="hover:bg-mint-50 dark:hover:bg-neutral-700 transition-colors"
												>
													<td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-medium text-mint-900 dark:text-mint-400">
														{failure.user_name || "Unknown"}
													</td>
													<td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-mint-700 dark:text-mint-300">
														{failure.user_email}
													</td>
													<td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm font-semibold text-mint-700 dark:text-mint-300">
														${Number(failure.amount).toFixed(2)}
													</td>
													<td className="px-3 py-3 whitespace-nowrap">
														<StatusBadge status={failure.status} />
													</td>
													<td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-mint-600 dark:text-mint-300">
														{formatDate(failure.failed_at)}
													</td>
													<td className="px-3 py-3 whitespace-nowrap text-xs sm:text-sm text-mint-600 dark:text-mint-300">
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
		<div className={`${bgColor} dark:bg-neutral-800 rounded-lg p-2 sm:p-3 border border-mint-200 dark:border-neutral-700 shadow-sm`}>
			<p className="text-[10px] sm:text-xs font-semibold text-mint-600 dark:text-mint-300 uppercase tracking-wide mb-1 font-(family-name:--font-space-mono)">
				{title}
			</p>
			<p className={`text-lg sm:text-xl font-bold ${textColor}`}>{value}</p>
		</div>
	);
}

function StatusBadge({ status }: { status: string }) {
	const styles = {
		pending: "bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700",
		sent: "bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700",
		recovered: "bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300 border-mint-300 dark:border-mint-700",
		lost: "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-neutral-700",
	};

	return (
		<span
			className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded border font-(family-name:--font-space-mono) uppercase ${styles[status as keyof typeof styles] || "bg-gray-50 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-neutral-700"}`}
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
