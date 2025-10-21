export default function DashboardLoading() {
	return (
		<div className="min-h-screen bg-mint-50">
			{/* Header Skeleton */}
			<div className="border-b border-mint-200 bg-white px-6 py-8">
				<div className="max-w-7xl mx-auto">
					<div className="h-8 w-48 bg-mint-200 rounded animate-pulse"></div>
				</div>
			</div>

			{/* Main Content Skeleton */}
			<div className="max-w-7xl mx-auto px-6 py-8">
				<div className="flex flex-col lg:flex-row gap-8">
					{/* Sidebar Skeleton */}
					<aside className="lg:w-64 flex-shrink-0">
						<div className="space-y-4">
							{[1, 2, 3, 4].map((i) => (
								<div
									key={i}
									className="bg-white rounded-lg p-5 border border-mint-200 shadow-sm"
								>
									<div className="h-3 w-24 bg-mint-200 rounded animate-pulse mb-3"></div>
									<div className="h-8 w-16 bg-mint-300 rounded animate-pulse"></div>
								</div>
							))}
						</div>
					</aside>

					{/* Table Skeleton */}
					<main className="flex-1 min-w-0">
						<div className="bg-white border border-mint-200 rounded-lg overflow-hidden shadow-sm">
							<div className="px-6 py-4 border-b border-mint-200 bg-mint-50">
								<div className="h-4 w-48 bg-mint-300 rounded animate-pulse"></div>
							</div>
							<div className="p-6">
								<div className="space-y-4">
									{[1, 2, 3, 4, 5].map((i) => (
										<div key={i} className="flex gap-4">
											<div className="h-4 w-32 bg-mint-100 rounded animate-pulse"></div>
											<div className="h-4 w-48 bg-mint-100 rounded animate-pulse"></div>
											<div className="h-4 w-20 bg-mint-100 rounded animate-pulse"></div>
											<div className="h-4 w-24 bg-mint-100 rounded animate-pulse"></div>
										</div>
									))}
								</div>
							</div>
						</div>
					</main>
				</div>
			</div>
		</div>
	);
}
