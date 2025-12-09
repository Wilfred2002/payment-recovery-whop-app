"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface HeaderProps {
	showNav?: boolean;
	companyId?: string;
}

export default function Header({ showNav = false, companyId }: HeaderProps) {
	const pathname = usePathname();

	const isActive = (path: string) => pathname?.startsWith(path);

	// Detect if we're in discover mode
	const isDiscoverMode = companyId === "demo";
	const dashboardUrl = isDiscoverMode
		? "/discover/dashboard"
		: `/dashboard/${companyId}`;
	const settingsUrl = isDiscoverMode ? "/discover/settings" : `/settings/${companyId}`;

	// Always show navigation when we have a companyId (unless explicitly disabled)
	const shouldShowNav = companyId && showNav !== false;

	return (
		<header className="px-4 sm:px-8 py-4 border-b border-mint-100 dark:border-mint-900 bg-white dark:bg-black">
			<div className="flex items-center justify-between">
				<h1 className="text-2xl sm:text-4xl font-bold text-mint-700 dark:text-mint-400 font-[family-name:var(--font-space-mono)] uppercase tracking-tight">
					Rebound
				</h1>

				{shouldShowNav && (
					<nav className="flex items-center gap-6">
						<Link
							href={dashboardUrl}
							className={`text-sm font-semibold font-[family-name:var(--font-space-mono)] uppercase tracking-wider transition-colors ${
								isActive("/dashboard") || isActive("/discover/dashboard")
									? "text-mint-700 dark:text-mint-400 border-b-2 border-mint-700 dark:border-mint-400"
									: "text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300"
							}`}
						>
							Dashboard
						</Link>
						<Link
							href={settingsUrl}
							className={`text-sm font-semibold font-[family-name:var(--font-space-mono)] uppercase tracking-wider transition-colors ${
								isActive("/settings") || isActive("/discover/settings")
									? "text-mint-700 dark:text-mint-400 border-b-2 border-mint-700 dark:border-mint-400"
									: "text-mint-600 dark:text-mint-400 hover:text-mint-700 dark:hover:text-mint-300"
							}`}
						>
							Settings
						</Link>
					</nav>
				)}
			</div>
		</header>
	);
}
