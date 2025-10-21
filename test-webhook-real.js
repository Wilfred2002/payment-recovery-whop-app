/**
 * Real Webhook Test - With actual Whop IDs
 *
 * This simulates a payment.failed webhook using REAL IDs from your Whop companies.
 * This will actually try to fetch member data and send emails!
 *
 * Setup:
 * 1. Create a test member in your Whop company
 * 2. Get the IDs from the member page
 * 3. Update the values below
 * 4. Run: node test-webhook-real.js
 */

// ========================================
// 🔧 UPDATE THESE WITH YOUR REAL IDS
// ========================================

const TEST_CONFIG = {
  // Get these from: Whop Dashboard → Members → Click on member
  company_id: "biz_",        // Replace: Your company ID (from URL: biz_XXXXX)
  user_id: "user_",          // Replace: Member's user ID
  membership_id: "mem_",     // Replace: Membership ID

  // These can stay as-is
  payment_id: "pay_test_" + Date.now(),
  amount: 97.00,
};

// ========================================
// 🚀 DON'T MODIFY BELOW THIS LINE
// ========================================

const WEBHOOK_URL = "http://localhost:3000/api/webhooks";

const payload = {
  action: "payment.failed",
  data: {
    id: TEST_CONFIG.payment_id,
    final_amount: TEST_CONFIG.amount,
    user_id: TEST_CONFIG.user_id,
    membership_id: TEST_CONFIG.membership_id,
    company_id: TEST_CONFIG.company_id,
  }
};

// Validate IDs are filled in
const hasRealIds =
  TEST_CONFIG.company_id.length > 4 &&
  TEST_CONFIG.user_id.length > 5 &&
  TEST_CONFIG.membership_id.length > 4;

if (!hasRealIds) {
  console.error("\n❌ ERROR: You need to fill in real IDs first!\n");
  console.log("📝 Steps:");
  console.log("1. Go to your Whop Dashboard");
  console.log("2. Navigate to Members");
  console.log("3. Click on a member (or create one)");
  console.log("4. Copy these values:");
  console.log("   - Company ID: From URL (biz_XXXXX)");
  console.log("   - User ID: From member page (user_XXXXX)");
  console.log("   - Membership ID: From memberships list (mem_XXXXX)");
  console.log("5. Update TEST_CONFIG in this file");
  console.log("6. Run again: node test-webhook-real.js\n");
  process.exit(1);
}

console.log("\n🧪 Sending REAL webhook test...\n");
console.log("📦 Payload:");
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
      console.log("✅ Webhook processed!\n");
      console.log("✅ What to check:");
      console.log("1. Terminal logs - Look for:");
      console.log("   - 📦 Full webhook payload");
      console.log("   - 💥 Payment failed for user [your-user-id]");
      console.log("   - 💾 Failed payment saved to database");
      console.log("   - 📧 Recovery email sent to: [user's email]");
      console.log("");
      console.log("2. Supabase database:");
      console.log("   - Go to failed_payments table");
      console.log("   - Should see new row with your test data");
      console.log("");
      console.log("3. Email inbox:");
      console.log("   - Check the member's email for recovery email");
      console.log("   - May take 1-2 minutes to arrive");
      console.log("");
      console.log("4. Dashboard:");
      console.log(`   - Go to: http://localhost:3000/dashboard/${TEST_CONFIG.company_id}`);
      console.log("   - Should see the failed payment in the table\n");
    } else {
      const error = await response.text();
      console.log("❌ Webhook failed:");
      console.log(error);
      console.log("\n💡 Common issues:");
      console.log("- User/membership IDs don't exist");
      console.log("- Permissions not approved (member:email:read)");
      console.log("- Dev server not running\n");
    }
  })
  .catch((error) => {
    console.error("\n❌ Connection Error:", error.message);
    console.error("\n💡 Make sure:");
    console.log("1. Dev server is running: npm run dev");
    console.log("2. Server is on http://localhost:3000\n");
  });
