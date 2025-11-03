interface SubscribeButtonProps {
	experienceId?: string;
	companyId?: string;
	className?: string;
	children?: React.ReactNode;
}

export default function SubscribeButton({
	experienceId,
	companyId,
	className = "inline-block px-6 py-3 bg-mint-600 text-white font-semibold rounded-lg hover:bg-mint-700 transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider",
	children = "Subscribe for $30/month",
}: SubscribeButtonProps) {
	// Direct link to product checkout page
	const productUrl = "https://whop.com/innovai-solutions-004c/rebound-premium/";

	return (
		<a
			href={productUrl}
			target="_blank"
			rel="noopener noreferrer"
			className={className}
		>
			{children}
		</a>
	);
}
