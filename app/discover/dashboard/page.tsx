import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function DiscoverPage() {
	const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
	const installUrl = `https://whop.com/apps/${appId}`;

	// Example high-ticket failed/recovered payments
	const exampleRecoveries = [
		{ name: "Alex M.", email: "alex.m@email.com", amount: 297, status: "recovered", failedAt: "Jan 15, 2:30 PM", time: "2h 15m" },
		{ name: "Sarah K.", email: "sarah.k@email.com", amount: 249, status: "recovered", failedAt: "Jan 15, 1:45 PM", time: "45m" },
		{ name: "Marcus T.", email: "marcus.t@email.com", amount: 199, status: "recovered", failedAt: "Jan 15, 12:20 PM", time: "1h 30m" },
		{ name: "Emma R.", email: "emma.r@email.com", amount: 279, status: "sent", failedAt: "Jan 15, 11:05 AM", time: "-" },
		{ name: "Jordan L.", email: "jordan.l@email.com", amount: 299, status: "recovered", failedAt: "Jan 14, 11:30 PM", time: "3h 45m" },
		{ name: "Taylor B.", email: "taylor.b@email.com", amount: 225, status: "recovered", failedAt: "Jan 14, 9:15 PM", time: "1h 12m" },
		{ name: "Casey D.", email: "casey.d@email.com", amount: 249, status: "recovered", failedAt: "Jan 14, 6:40 PM", time: "52m" },
		{ name: "Morgan P.", email: "morgan.p@email.com", amount: 197, status: "sent", failedAt: "Jan 14, 4:25 PM", time: "-" },
		{ name: "Riley S.", email: "riley.s@email.com", amount: 289, status: "recovered", failedAt: "Jan 14, 2:10 PM", time: "2h 05m" },
		{ name: "Jamie W.", email: "jamie.w@email.com", amount: 250, status: "recovered", failedAt: "Jan 14, 11:55 AM", time: "1h 38m" },
	];

	const totalFailed = exampleRecoveries.length;
	const totalRecovered = exampleRecoveries.filter((r) => r.status === "recovered").length;
	const recoveryRate = ((totalRecovered / totalFailed) * 100).toFixed(1);
	const totalSaved = exampleRecoveries
		.filter((r) => r.status === "recovered")
		.reduce((sum, r) => sum + r.amount, 0);

	return (
		<div className="min-h-screen bg-mint-50 flex flex-col">
			{/* Demo Banner */}
			<div className="bg-mint-800 text-white px-6 py-3 text-center">
				<p className="text-sm font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
					Demo Dashboard Preview · <a href={installUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-mint-200">Install Rebound to Get Started</a>
				</p>
			</div>

			<Header showNav={true} companyId="demo" />

			{/* Main Content: Exact Dashboard Layout */}
			<div className="flex-1">
				<div className="max-w-7xl mx-auto px-6 py-8">
					<div className="flex flex-col lg:flex-row gap-8">
						{/* Sidebar - Stats */}
						<aside className="lg:w-64 flex-shrink-0">
							<div className="space-y-4">
								<div className="bg-white rounded-lg p-5 border border-mint-200 shadow-sm">
									<p className="text-xs font-semibold text-mint-600 uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]">
										Failed Payments
									</p>
									<p className="text-2xl font-bold text-mint-700">{totalFailed}</p>
								</div>
								<div className="bg-mint-100 rounded-lg p-5 border border-mint-200 shadow-sm">
									<p className="text-xs font-semibold text-mint-600 uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]">
										Recovered
									</p>
									<p className="text-2xl font-bold text-mint-800">{totalRecovered}</p>
								</div>
								<div className="bg-white rounded-lg p-5 border border-mint-200 shadow-sm">
									<p className="text-xs font-semibold text-mint-600 uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]">
										Recovery Rate
									</p>
									<p className="text-2xl font-bold text-mint-700">{recoveryRate}%</p>
								</div>
								<div className="bg-mint-100 rounded-lg p-5 border border-mint-200 shadow-sm">
									<p className="text-xs font-semibold text-mint-600 uppercase tracking-wider mb-2 font-[family-name:var(--font-space-mono)]">
										Total Saved
									</p>
									<p className="text-2xl font-bold text-mint-800">${totalSaved.toFixed(2)}</p>
								</div>
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
											{exampleRecoveries.map((recovery, index) => (
												<tr key={index} className="hover:bg-mint-50 transition-colors">
													<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-mint-900">
														{recovery.name}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-700">
														{recovery.email}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-mint-800">
														${recovery.amount}.00
													</td>
													<td className="px-6 py-4 whitespace-nowrap">
														{recovery.status === "recovered" ? (
															<span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded border bg-mint-100 text-mint-800 border-mint-300 font-[family-name:var(--font-space-mono)] uppercase">
																recovered
															</span>
														) : (
															<span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded border bg-blue-50 text-blue-800 border-blue-300 font-[family-name:var(--font-space-mono)] uppercase">
																sent
															</span>
														)}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-600">
														{recovery.failedAt}
													</td>
													<td className="px-6 py-4 whitespace-nowrap text-sm text-mint-600">
														{recovery.time}
													</td>
												</tr>
											))}
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
