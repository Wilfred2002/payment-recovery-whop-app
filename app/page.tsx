import Header from "./components/Header";
import Footer from "./components/Footer";

export default async function Page() {
	return (
		<div className="min-h-screen bg-white flex flex-col">
			<Header showNav={false} />

			{/* Main Content */}
			<div className="flex-1 flex items-center justify-center px-8">
				<div className="max-w-4xl text-center">
					<p className="text-7xl font-light text-mint-900 mb-8 leading-tight">
						Recover Failed Payments Automatically
					</p>

					<p className="text-xl text-mint-600 mb-12 max-w-2xl mx-auto">
						Detect failed payments, send recovery emails, and reclaim{" "}
						<span className="font-semibold text-mint-800">$500-2000/month</span>{" "}
						in lost revenue.
					</p>

					{/* Information */}
					<div className="bg-mint-50 border border-mint-200 rounded-lg p-8 max-w-2xl mx-auto text-left">
						<h2 className="text-2xl font-bold text-mint-800 mb-4 font-[family-name:var(--font-space-mono)] uppercase">
							How to Access
						</h2>
						<div className="space-y-4 text-mint-700">
							<p>
								<strong>For Company Admins:</strong> Access this app through your Whop
								company's experiences or direct installation.
							</p>
							<p>
								<strong>Not installed yet?</strong> Add this app to your company from
								the Whop App Store.
							</p>
							<div className="mt-6 pt-6 border-t border-mint-200">
								<h3 className="font-semibold text-mint-800 mb-2">Features:</h3>
								<ul className="space-y-2 text-sm">
									<li>✓ Automated recovery emails</li>
									<li>✓ Real-time payment tracking</li>
									<li>✓ Customizable email templates</li>
									<li>✓ Recovery analytics</li>
								</ul>
							</div>
						</div>
					</div>

					<p className="text-sm text-mint-500 mt-8">
						<a
							href="https://whop.com/innovai-solutions-004c/rebound-premium/"
							target="_blank"
							rel="noopener noreferrer"
							className="hover:text-mint-700 underline transition-colors"
						>
							Learn more about Rebound →
						</a>
					</p>
				</div>
			</div>

			<Footer />
		</div>
	);
}
