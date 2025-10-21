/**
 * Simple Webhook Test - No setup required!
 *
 * This simulates a payment.failed webhook with fake data
 * to test that your webhook handler works.
 *
 * Usage: node test-webhook-simple.js
 */

const WEBHOOK_URL = "http://localhost:3000/api/webhooks";

// Fake but valid-looking test data
const payload = {
  action: "payment.failed",
  data: {
    id: "pay_test_" + Date.now(),
    final_amount: 97.00,
    user_id: "user_test_12345",
    membership_id: "mem_test_67890",
    company_id: "comp_test_abc", // Fake company ID
  }
};

console.log("\n🧪 Sending test payment.failed webhook...\n");
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
      console.log("Check your terminal for webhook processing logs.");
      console.log("Look for:");
      console.log("  - 📦 Full webhook payload");
      console.log("  - 💥 Payment failed message");
      console.log("  - Error messages if permissions not configured\n");
    } else {
      const error = await response.text();
      console.log("❌ Webhook failed:");
      console.log(error);
    }
  })
  .catch((error) => {
    console.error("\n❌ Error:", error.message);
    console.error("\nMake sure your dev server is running: npm run dev\n");
  });
