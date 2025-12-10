"use client";

interface TrialBannerProps {
	trialEndsAt: string | null;
}

export default function TrialBanner({ trialEndsAt }: TrialBannerProps) {
	if (!trialEndsAt) return null;

	const now = new Date();
	const trialEnd = new Date(trialEndsAt);
	const daysLeft = Math.ceil(
		(trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
	);
	const isExpired = daysLeft <= 0;

	if (isExpired) {
		return (
			<div className="bg-red-50 dark:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-lg p-3 sm:p-4 mb-4">
				<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
					<div>
						<p className="text-sm font-bold text-red-700 dark:text-red-300">
							Trial Expired
						</p>
						<p className="text-xs text-red-600 dark:text-red-400 mt-1">
							Upgrade to continue using Rebound and recover failed payments.
						</p>
					</div>
					<a
						href="https://whop.com/innovai-solutions-004c/rebound-premium/"
						target="_blank"
						rel="noopener noreferrer"
						className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white px-4 py-2 rounded-md text-xs font-semibold transition-colors text-center whitespace-nowrap"
					>
						Upgrade Now
					</a>
				</div>
			</div>
		);
	}

	const isUrgent = daysLeft <= 7;
	const bgColor = isUrgent ? "bg-amber-50 dark:bg-amber-900/40" : "bg-mint-50 dark:bg-neutral-800";
	const borderColor = isUrgent ? "border-amber-200 dark:border-amber-800" : "border-mint-200 dark:border-neutral-700";
	const textColor = isUrgent ? "text-amber-700 dark:text-amber-300" : "text-mint-700 dark:text-mint-300";
	const buttonBg = isUrgent
		? "bg-amber-600 hover:bg-amber-700 dark:bg-amber-600 dark:hover:bg-amber-700"
		: "bg-mint-600 hover:bg-mint-700 dark:bg-mint-600 dark:hover:bg-mint-700";

	return (
		<div
			className={`${bgColor} border ${borderColor} rounded-lg p-3 sm:p-4 mb-4`}
		>
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
				<div>
					<p className={`text-sm font-bold ${textColor}`}>
						{daysLeft} {daysLeft === 1 ? "day" : "days"} left in your free
						trial
					</p>
					<p className={`text-xs ${textColor} mt-1 opacity-90`}>
						Upgrade now to continue accessing all features after your trial
						ends.
					</p>
				</div>
				<a
					href="https://whop.com/innovai-solutions-004c/rebound-premium/"
					target="_blank"
					rel="noopener noreferrer"
					className={`${buttonBg} text-white px-4 py-2 rounded-md text-xs font-semibold transition-colors text-center whitespace-nowrap`}
				>
					Upgrade Now
				</a>
			</div>
		</div>
	);
}
