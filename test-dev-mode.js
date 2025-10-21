/**
 * DEV MODE TEST - Works WITHOUT Real Whop Members!
 *
 * This test uses the development mode bypass to test the full flow:
 * - Webhook receives data ✅
 * - Database saves failed payment ✅
 * - Email sends to YOUR inbox ✅
 * - Dashboard shows the payment ✅
 *
 * Requirements:
 * 1. Dev server running: npm run dev
 * 2. DEV_MODE_BYPASS_WHOP_API=true in .env.development.local
 *
 * Usage: node test-dev-mode.js
 *
 * ⚠️  This ONLY works in development mode
 * ⚠️  Automatically disabled in production (safe!)
 */

const WEBHOOK_URL = "http://localhost:3000/api/webhooks";

// Your real company ID (already in .env.development.local)
const COMPANY_ID = "biz_OcALrGzGNTqHU0";

const payload = {
  action: "payment.failed",
  data: {
    id: "pay_dev_test_" + Date.now(),
    final_amount: 97.00,
    user_id: "user_dev_test_123", // Fake - doesn't matter in dev mode
    membership_id: "mem_dev_test_456", // Fake - doesn't matter in dev mode
    company_id: COMPANY_ID, // Real company ID
  }
};

console.log("\n🧪 DEV MODE TEST - Testing Full Flow\n");
console.log("This will:");
console.log("  1. Send webhook to your local server");
console.log("  2. Save failed payment to database");
console.log("  3. Send recovery email to: wfnaraga@gmail.com");
console.log("  4. You can see it in your dashboard\n");

console.log("📦 Sending webhook...\n");
console.log(JSON.stringify(payload, null, 2));
console.log("");

fetch(WEBHOOK_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
})
  .then(async (response) => {
    console.log(`📥 Response: ${response.status} ${response.statusText}\n`);

    if (response.ok) {
      console.log("✅ SUCCESS!\n");
      console.log("🎉 What to check now:\n");

      console.log("1. SERVER LOGS (in your terminal running 'npm run dev'):");
      console.log("   Look for:");
      console.log("   - ⚠️  DEV MODE ACTIVE: Using test email");
      console.log("   - 📧 Dev mode: Sending to wfnaraga@gmail.com");
      console.log("   - 💾 Failed payment saved to database");
      console.log("   - 📧 Recovery email sent\n");

      console.log("2. EMAIL INBOX (wfnaraga@gmail.com):");
      console.log("   - Check for recovery email");
      console.log("   - Subject: '⚠️ Your payment failed - Update needed'");
      console.log("   - May take 1-2 minutes to arrive\n");

      console.log("3. SUPABASE DATABASE:");
      console.log("   - Go to: https://supabase.com");
      console.log("   - Table Editor → failed_payments");
      console.log("   - Should see new row with:");
      console.log("     • amount: 97.00");
      console.log("     • company_id: biz_OcALrGzGNTqHU0");
      console.log("     • user_email: wfnaraga@gmail.com");
      console.log("     • status: 'sent'\n");

      console.log("4. DASHBOARD:");
      console.log(`   - Go to: http://localhost:3000/dashboard/${COMPANY_ID}`);
      console.log("   - Should see the failed payment in the table");
      console.log("   - Stats should update\n");

      console.log("5. RESEND DASHBOARD:");
      console.log("   - Go to: https://resend.com/emails");
      console.log("   - See delivery status\n");

      console.log("───────────────────────────────────────────────────\n");
      console.log("💡 To test payment recovery:");
      console.log("   Run: node test-payment-recovery-dev.js");
      console.log("   (Simulates payment succeeding after failure)\n");

      console.log("📝 To disable dev mode (before production):");
      console.log("   1. Set DEV_MODE_BYPASS_WHOP_API=false in .env");
      console.log("   2. Or just deploy - it auto-disables in production!\n");

    } else {
      const error = await response.text();
      console.log("❌ Webhook failed:");
      console.log(error);
      console.log("\n💡 Troubleshooting:");
      console.log("- Is dev server running? (npm run dev)");
      console.log("- Is DEV_MODE_BYPASS_WHOP_API=true in .env.development.local?");
      console.log("- Check server terminal for error messages\n");
    }
  })
  .catch((error) => {
    console.error("\n❌ Connection Error:", error.message);
    console.error("\n💡 Make sure dev server is running:");
    console.log("   npm run dev\n");
  });
