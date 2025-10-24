"use client";

import { useIframeSdk } from "@whop/react";
import { useState } from "react";

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
	const iframeSdk = useIframeSdk();
	const [loading, setLoading] = useState(false);

	async function handleSubscribe() {
		setLoading(true);
		try {
			const res = await fetch("/api/subscription", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ experienceId, companyId }),
			});

			if (!res.ok) {
				const errorData = await res.json();
				throw new Error(errorData.error || "Failed to create checkout session");
			}

			const checkoutSession = await res.json();

			// Open the Whop checkout modal
			const result = await iframeSdk.inAppPurchase(checkoutSession);

			if (result.status === "ok") {
				// Success! The page will automatically refresh or update access
				console.log("✅ Subscription successful!");
				// Reload the page to reflect new subscription status
				window.location.reload();
			} else {
				console.error("Subscription failed:", result.error);
				alert(`Subscription failed: ${result.error || "Unknown error"}`);
			}
		} catch (err) {
			console.error("Subscription error:", err);
			alert(
				`An error occurred: ${err instanceof Error ? err.message : "Unknown error"}`,
			);
		} finally {
			setLoading(false);
		}
	}

	return (
		<button onClick={handleSubscribe} disabled={loading} className={className}>
			{loading ? "Processing..." : children}
		</button>
	);
}
