import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
	auth: {
		autoRefreshToken: false,
		persistSession: false,
	},
});

export type FailedPayment = {
	id: string;
	whop_payment_id: string;
	whop_membership_id: string;
	whop_user_id: string;
	user_email: string;
	user_name: string | null;
	amount: number;
	company_id: string;
	failed_at: string;
	email_sent_at: string | null;
	recovered_at: string | null;
	status: "pending" | "sent" | "recovered" | "lost";
	created_at: string;
};
