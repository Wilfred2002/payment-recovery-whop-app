/**
 * Test with YOUR real company ID
 *
 * This uses your actual company ID but fake member data.
 * It will show you what errors occur when member doesn't exist.
 */

const WEBHOOK_URL = "http://localhost:3000/api/webhooks";

const payload = {
  action: "payment.failed",
  data: {
    id: "pay_test_" + Date.now(),
    final_amount: 97.00,
    user_id: "user_test_12345",           // Fake - won't exist
    membership_id: "mem_test_67890",      // Fake - won't exist
    company_id: "biz_OcALrGzGNTqHU0",     // REAL - your actual company
  }
};

console.log("\n🧪 Testing with YOUR real company ID...\n");
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
      console.log("✅ Webhook accepted!\n");
      console.log("⚠️  Check server logs for errors like:");
      console.log("   - 'Membership not found' (expected - using fake IDs)");
      console.log("   - 'Unable to get user email'");
      console.log("");
      console.log("💡 To test for REAL:");
      console.log("1. Go to https://whop.com/hub/biz_OcALrGzGNTqHU0/members");
      console.log("2. Create a test member (or use existing)");
      console.log("3. Get the real user_id and membership_id");
      console.log("4. Update test-webhook-real.js with those IDs");
      console.log("5. Run: node test-webhook-real.js\n");
    } else {
      const error = await response.text();
      console.log("❌ Webhook failed:");
      console.log(error);
    }
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
  });
