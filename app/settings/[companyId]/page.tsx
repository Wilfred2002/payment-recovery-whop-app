"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import toast, { Toaster } from "react-hot-toast";

const DEFAULT_SUBJECT = "⚠️ Your payment failed - Update needed";
const DEFAULT_BODY = `Hi {name},

We noticed your recent payment of {amount} failed. This can happen for a few reasons:

• Your card has expired
• You've reached your card limit
• Your bank declined the charge

To keep your access, please update your payment method within 24 hours.

{updateLink}

If you have any questions, feel free to reach out. We're here to help!

Best,
The Team`;

export default function SettingsPage() {
	const params = useParams();
	const companyId = params.companyId as string;

	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [emailEnabled, setEmailEnabled] = useState(true);
	const [emailSubject, setEmailSubject] = useState(DEFAULT_SUBJECT);
	const [emailBody, setEmailBody] = useState(DEFAULT_BODY);
	const [showConfirmModal, setShowConfirmModal] = useState(false);

	// Load settings on mount
	useEffect(() => {
		if (companyId) {
			fetchSettings();
		}
	}, [companyId]);

	const fetchSettings = async () => {
		try {
			const response = await fetch(`/api/settings?company_id=${companyId}`);
			if (response.ok) {
				const data = await response.json();
				if (data) {
					setEmailEnabled(data.email_enabled);
					setEmailSubject(data.email_subject || DEFAULT_SUBJECT);
					setEmailBody(data.email_body || DEFAULT_BODY);
				}
			}
		} catch (error) {
			toast.error("Failed to load settings");
		} finally {
			setLoading(false);
		}
	};

	const handleSave = async () => {
		setSaving(true);
		try {
			const response = await fetch("/api/settings", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					company_id: companyId,
					email_enabled: emailEnabled,
					email_subject: emailSubject,
					email_body: emailBody,
				}),
			});

			if (response.ok) {
				toast.success("Settings saved successfully!");
			} else {
				throw new Error("Failed to save");
			}
		} catch (error) {
			toast.error("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	const handleReset = () => {
		setEmailSubject(DEFAULT_SUBJECT);
		setEmailBody(DEFAULT_BODY);
		toast.success("Reset to default template");
	};

	const handleToggle = () => {
		if (emailEnabled) {
			setShowConfirmModal(true);
		} else {
			setEmailEnabled(true);
			toast.success("Recovery emails enabled");
		}
	};

	const confirmDisable = () => {
		setEmailEnabled(false);
		setShowConfirmModal(false);
		toast.success("Recovery emails disabled");
	};

	// Preview with sample data
	const previewSubject = emailSubject
		.replace("{name}", "John Doe")
		.replace("{amount}", "$97.00")
		.replace("{updateLink}", "https://whop.com/hub/settings/billing");

	const previewBody = emailBody
		.replace(/{name}/g, "John Doe")
		.replace(/{amount}/g, "$97.00")
		.replace(/{updateLink}/g, "https://whop.com/hub/settings/billing");

	if (loading) {
		return (
			<div className="min-h-screen bg-white flex flex-col">
				<Header showNav={true} companyId={companyId} />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-mint-600 font-[family-name:var(--font-space-mono)] uppercase">
						Loading...
					</div>
				</div>
				<Footer />
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-mint-50 flex flex-col">
			<Toaster position="top-right" />
			<Header showNav={true} companyId={companyId} />

			<div className="flex-1 px-8 py-8">
				<div className="max-w-6xl mx-auto">
					<h1 className="text-3xl font-bold text-mint-800 mb-8 font-[family-name:var(--font-space-mono)] uppercase tracking-tight">
						Settings
					</h1>

					<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
						{/* Left: Form */}
						<div className="bg-white rounded-lg border border-mint-200 p-6 shadow-sm">
							<h2 className="text-sm font-bold text-mint-800 mb-6 font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
								Email Configuration
							</h2>

							{/* Enable/Disable Toggle */}
							<div className="mb-6">
								<label className="flex items-center justify-between cursor-pointer">
									<span className="text-sm font-semibold text-mint-700">
										Recovery Emails
									</span>
									<div className="relative">
										<input
											type="checkbox"
											checked={emailEnabled}
											onChange={handleToggle}
											className="sr-only peer"
										/>
										<div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-mint-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-mint-600"></div>
									</div>
								</label>
								<p className="text-xs text-mint-700 mt-1">
									{emailEnabled
										? "Emails will be sent when payments fail"
										: "Emails are currently paused"}
								</p>
							</div>

							{/* Email Subject */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-mint-700 mb-2">
									Email Subject
								</label>
								<input
									type="text"
									value={emailSubject}
									onChange={(e) => setEmailSubject(e.target.value)}
									className="w-full px-4 py-2 border border-mint-200 rounded-md focus:outline-none focus:ring-2 focus:ring-mint-500 text-sm"
									placeholder="Email subject line"
								/>
							</div>

							{/* Email Body */}
							<div className="mb-6">
								<label className="block text-sm font-semibold text-mint-700 mb-2">
									Email Body
								</label>
								<textarea
									value={emailBody}
									onChange={(e) => setEmailBody(e.target.value)}
									rows={12}
									className="w-full px-4 py-2 border border-mint-200 rounded-md focus:outline-none focus:ring-2 focus:ring-mint-500 text-sm font-mono"
									placeholder="Email body text"
								/>
								<p className="text-xs text-mint-700 mt-2">
									Available variables: <code className="bg-mint-100 px-1 rounded">{`{name}`}</code>,{" "}
									<code className="bg-mint-100 px-1 rounded">{`{amount}`}</code>, <code className="bg-mint-100 px-1 rounded">{`{updateLink}`}</code>
								</p>
							</div>

							{/* Buttons */}
							<div className="flex gap-3">
								<button
									onClick={handleSave}
									disabled={saving}
									className="flex-1 bg-mint-700 hover:bg-mint-800 text-white font-semibold px-6 py-3 rounded-md transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider text-sm disabled:opacity-50"
								>
									{saving ? "Saving..." : "Save Changes"}
								</button>
								<button
									onClick={handleReset}
									className="bg-white hover:bg-gray-50 text-mint-700 font-semibold px-6 py-3 rounded-md border border-mint-200 transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider text-sm"
								>
									Reset
								</button>
							</div>
						</div>

						{/* Right: Preview */}
						<div className="bg-white rounded-lg border border-mint-200 p-6 shadow-sm">
							<h2 className="text-sm font-bold text-mint-800 mb-6 font-[family-name:var(--font-space-mono)] uppercase tracking-wider">
								Email Preview
							</h2>

							<div className="border border-mint-200 rounded-md p-4 bg-mint-50">
								<div className="mb-4 pb-4 border-b border-mint-200">
									<p className="text-xs text-mint-700 font-semibold mb-1">Subject:</p>
									<p className="font-semibold text-mint-900">{previewSubject}</p>
								</div>
								<div className="whitespace-pre-wrap text-sm text-mint-800">
									{previewBody}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>

			<Footer />

			{/* Confirmation Modal */}
			{showConfirmModal && (
				<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
					<div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
						<h3 className="text-lg font-bold text-mint-800 mb-3 font-[family-name:var(--font-space-mono)] uppercase">
							Disable Recovery Emails?
						</h3>
						<p className="text-sm text-mint-700 mb-6">
							This will stop sending recovery emails when payments fail. You can
							re-enable this anytime.
						</p>
						<div className="flex gap-3">
							<button
								onClick={confirmDisable}
								className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-md transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider text-sm"
							>
								Yes, Disable
							</button>
							<button
								onClick={() => setShowConfirmModal(false)}
								className="flex-1 bg-mint-100 hover:bg-mint-200 text-mint-800 font-semibold px-6 py-3 rounded-md border border-mint-300 transition-colors font-[family-name:var(--font-space-mono)] uppercase tracking-wider text-sm"
							>
								Cancel
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
