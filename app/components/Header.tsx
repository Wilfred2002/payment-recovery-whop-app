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
	const homeUrl = isDiscoverMode ? "/discover" : "/";

	return (
		<header className="px-8 py-6 border-b border-mint-100 bg-white">
			<div className="flex items-center justify-between">
				<Link href={homeUrl}>
					<h1 className="text-4xl font-bold text-mint-800 font-[family-name:var(--font-space-mono)] uppercase tracking-tight hover:text-mint-700 transition-colors cursor-pointer">
						Rebound
					</h1>
				</Link>

				{showNav && companyId && (
					<nav className="flex items-center gap-6">
						<Link
							href={dashboardUrl}
							className={`text-sm font-semibold font-[family-name:var(--font-space-mono)] uppercase tracking-wider transition-colors ${
								isActive("/dashboard") || isActive("/discover/dashboard")
									? "text-mint-800 border-b-2 border-mint-800"
									: "text-mint-600 hover:text-mint-800"
							}`}
						>
							Dashboard
						</Link>
						<Link
							href={settingsUrl}
							className={`text-sm font-semibold font-[family-name:var(--font-space-mono)] uppercase tracking-wider transition-colors ${
								isActive("/settings") || isActive("/discover/settings")
									? "text-mint-800 border-b-2 border-mint-800"
									: "text-mint-600 hover:text-mint-800"
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
