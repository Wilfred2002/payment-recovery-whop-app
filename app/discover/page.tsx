import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function DiscoverPage() {
	const appId = process.env.NEXT_PUBLIC_WHOP_APP_ID;
	const installUrl = `https://whop.com/apps/${appId}`;

	return (
		<div className="min-h-screen bg-white flex flex-col">
			{/* Demo Banner */}
			<div className="bg-mint-800 text-white px-6 py-3 text-center">
				<p className="text-sm font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
					Discover Rebound · <a href={installUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold hover:text-mint-200">Install Now</a>
				</p>
			</div>

			<Header showNav={false} />

			{/* Main Content */}
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="max-w-4xl">
					<p className="text-7xl font-light text-mint-900 mb-8 leading-tight">
						Recover Failed Payments Automatically
					</p>

					<p className="text-xl text-mint-600 mb-12 max-w-2xl">
						Detect failed payments, send recovery emails, and reclaim{" "}
						<span className="font-semibold text-mint-800">$500-2000/month</span>{" "}
						in lost revenue.
					</p>

					{/* CTA Buttons */}
					<div className="flex flex-col sm:flex-row gap-4">
						<Link
							href="/discover/dashboard"
							className="inline-flex items-center justify-center gap-2 bg-mint-700 hover:bg-mint-800 text-white font-semibold px-8 py-4 rounded-md transition-all text-lg font-[family-name:var(--font-space-mono)] uppercase tracking-wider"
						>
							View Dashboard →
						</Link>
						<Link
							href="/discover/settings"
							className="inline-flex items-center justify-center gap-2 bg-white hover:bg-mint-50 text-mint-700 font-semibold px-8 py-4 rounded-md border-2 border-mint-700 transition-all text-lg font-[family-name:var(--font-space-mono)] uppercase tracking-wider"
						>
							Try Settings
						</Link>
					</div>

					<p className="text-sm text-mint-600 mt-8">
						Explore the interactive demo dashboard and settings panel before installing.
					</p>
				</div>
			</div>

			<Footer />
		</div>
	);
}
