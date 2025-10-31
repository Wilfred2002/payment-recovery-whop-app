import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, type CreatorSettings } from "@/lib/supabase";
import { whopSdk } from "@/lib/whop-sdk";
import { headers } from "next/headers";

// GET - Fetch settings
export async function GET(request: NextRequest) {
	try {
		// Get company_id from query params
		const { searchParams } = new URL(request.url);
		const companyId = searchParams.get("company_id");

		if (!companyId) {
			return NextResponse.json(
				{ error: "company_id is required" },
				{ status: 400 },
			);
		}

		// Verify user has access to this company
		try {
			const headersList = await headers();
			const { userId } = await whopSdk.verifyUserToken(headersList);

			// Check admin access via REST API
			const companyMemberId = `${userId}_${companyId}`;
			const memberResponse = await fetch(
				`https://api.whop.com/api/v1/companies/${companyId}/members/${companyMemberId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				},
			);

			if (!memberResponse.ok) {
				return NextResponse.json(
					{ error: "Unauthorized: Admin access required" },
					{ status: 403 },
				);
			}

			const memberData = await memberResponse.json();
			if (memberData.member?.access_level !== "admin") {
				return NextResponse.json(
					{ error: "Unauthorized: Admin access required" },
					{ status: 403 },
				);
			}
		} catch (authError) {
			return NextResponse.json(
				{ error: "Authentication failed" },
				{ status: 401 },
			);
		}

		const { data, error } = await supabaseAdmin
			.from("creator_settings")
			.select("*")
			.eq("company_id", companyId)
			.single();

		if (error && error.code !== "PGRST116") {
			// PGRST116 is "not found" error
			console.error("Error fetching settings:", error);
			return NextResponse.json({ error: error.message }, { status: 500 });
		}

		// If no settings exist, return defaults
		if (!data) {
			return NextResponse.json({
				email_enabled: true,
				email_subject: "⚠️ Your payment failed - Update needed",
				email_body: `Hi {name},

We noticed your recent payment of {amount} failed. This can happen for a few reasons:

• Your card has expired
• You've reached your card limit
• Your bank declined the charge

To keep your access, please update your payment method within 24 hours.

{updateLink}

If you have any questions, feel free to reach out. We're here to help!

Best,
The Team`,
			});
		}

		return NextResponse.json(data);
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}

// POST - Save settings
export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			email_enabled,
			email_subject,
			email_body,
			company_id,
		} = body;

		// Validate required fields
		if (
			!company_id ||
			email_enabled === undefined ||
			!email_subject ||
			!email_body
		) {
			return NextResponse.json(
				{ error: "Missing required fields" },
				{ status: 400 },
			);
		}

		// Verify user has access to this company
		try {
			const headersList = await headers();
			const { userId } = await whopSdk.verifyUserToken(headersList);

			// Check admin access via REST API
			const companyMemberId = `${userId}_${company_id}`;
			const memberResponse = await fetch(
				`https://api.whop.com/api/v1/companies/${company_id}/members/${companyMemberId}`,
				{
					headers: {
						Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
					},
				},
			);

			if (!memberResponse.ok) {
				return NextResponse.json(
					{ error: "Unauthorized: Admin access required" },
					{ status: 403 },
				);
			}

			const memberData = await memberResponse.json();
			if (memberData.member?.access_level !== "admin") {
				return NextResponse.json(
					{ error: "Unauthorized: Admin access required" },
					{ status: 403 },
				);
			}
		} catch (authError) {
			return NextResponse.json(
				{ error: "Authentication failed" },
				{ status: 401 },
			);
		}

		// Validate that required variables are present
		if (!email_body.includes("{updateLink}")) {
			return NextResponse.json(
				{ error: "Email body must include {updateLink} variable" },
				{ status: 400 },
			);
		}

		// Check if settings exist
		const { data: existingSettings } = await supabaseAdmin
			.from("creator_settings")
			.select("id")
			.eq("company_id", company_id)
			.single();

		if (existingSettings) {
			// Update existing settings
			const { data, error } = await supabaseAdmin
				.from("creator_settings")
				.update({
					email_enabled,
					email_subject,
					email_body,
					updated_at: new Date().toISOString(),
				})
				.eq("company_id", company_id)
				.select()
				.single();

			if (error) {
				console.error("Error updating settings:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json(data);
		} else {
			// Insert new settings
			const { data, error } = await supabaseAdmin
				.from("creator_settings")
				.insert({
					company_id: company_id,
					email_enabled,
					email_subject,
					email_body,
				})
				.select()
				.single();

			if (error) {
				console.error("Error inserting settings:", error);
				return NextResponse.json({ error: error.message }, { status: 500 });
			}

			return NextResponse.json(data);
		}
	} catch (error) {
		console.error("Unexpected error:", error);
		return NextResponse.json(
			{ error: "Internal server error" },
			{ status: 500 },
		);
	}
}
