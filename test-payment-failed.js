/**
 * Test Script: Simulate payment.failed webhook
 *
 * Usage:
 * 1. Update the values below with REAL data from your Whop companies
 * 2. Run: node test-payment-failed.js
 *
 * This will send a fake payment.failed webhook to your local server
 */

// ========================================
// 🔧 CONFIGURE THESE VALUES
// ========================================

const WEBHOOK_URL = "http://localhost:3000/api/webhooks"; // Your local webhook endpoint

// Get these from your Whop dashboard → Members
const TEST_DATA = {
  // Company A test
  companyA: {
    company_id: "comp_YOUR_COMPANY_A_ID", // Replace with real company ID
    user_id: "user_YOUR_TEST_USER_ID",    // Replace with real user ID from Members page
    membership_id: "mem_YOUR_MEMBERSHIP_ID", // Replace with real membership ID
    payment_id: "pay_test_12345",           // Fake payment ID (doesn't need to be real)
    amount: 97.00,
    user_email: "your.test.email@gmail.com" // Your test email
  },

  // Company B test
  companyB: {
    company_id: "comp_YOUR_COMPANY_B_ID",
    user_id: "user_YOUR_TEST_USER_ID_B",
    membership_id: "mem_YOUR_MEMBERSHIP_ID_B",
    payment_id: "pay_test_67890",
    amount: 149.00,
    user_email: "your.second.test.email@gmail.com"
  }
};

// ========================================
// 🚀 RUN TEST
// ========================================

async function testPaymentFailed(testData) {
  const payload = {
    action: "payment.failed",
    data: {
      id: testData.payment_id,
      final_amount: testData.amount,
      user_id: testData.user_id,
      membership_id: testData.membership_id,
      company_id: testData.company_id,
    }
  };

  console.log("\n📤 Sending test webhook:");
  console.log(JSON.stringify(payload, null, 2));

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    console.log(`\n✅ Response: ${response.status} ${response.statusText}`);

    if (response.ok) {
      console.log("✅ Webhook processed successfully!");
      console.log("\nCheck your:");
      console.log("1. Terminal logs for webhook processing");
      console.log("2. Supabase dashboard for new failed_payments record");
      console.log("3. Email inbox for recovery email");
    } else {
      const error = await response.text();
      console.error("❌ Webhook failed:", error);
    }
  } catch (error) {
    console.error("❌ Error sending webhook:", error.message);
  }
}

// ========================================
// 📋 MENU
// ========================================

async function main() {
  console.log("\n🧪 Payment Failed Webhook Tester\n");
  console.log("Choose a test:");
  console.log("1. Test Company A");
  console.log("2. Test Company B");
  console.log("3. Test Both Companies\n");

  const args = process.argv.slice(2);
  const choice = args[0] || "1";

  switch (choice) {
    case "1":
      console.log("\n🏢 Testing Company A...");
      await testPaymentFailed(TEST_DATA.companyA);
      break;

    case "2":
      console.log("\n🏢 Testing Company B...");
      await testPaymentFailed(TEST_DATA.companyB);
      break;

    case "3":
      console.log("\n🏢 Testing Company A...");
      await testPaymentFailed(TEST_DATA.companyA);

      console.log("\n⏳ Waiting 2 seconds...\n");
      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("🏢 Testing Company B...");
      await testPaymentFailed(TEST_DATA.companyB);
      break;

    default:
      console.log("❌ Invalid choice. Use: node test-payment-failed.js [1|2|3]");
  }
}

main();
