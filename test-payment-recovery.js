/**
 * Test Payment Recovery Flow
 *
 * This simulates the full recovery flow:
 * 1. Sends payment.failed webhook
 * 2. Waits 5 seconds
 * 3. Sends payment.succeeded webhook
 * 4. Should mark the payment as "recovered"
 *
 * Usage: node test-payment-recovery.js
 */

// ========================================
// 🔧 UPDATE THESE WITH YOUR REAL IDS
// ========================================

const TEST_CONFIG = {
  company_id: "biz_",        // Replace: Your company ID
  user_id: "user_",          // Replace: Member's user ID
  membership_id: "mem_",     // Replace: Membership ID
  amount: 149.00,
};

// ========================================
// 🚀 SCRIPT
// ========================================

const WEBHOOK_URL = "http://localhost:3000/api/webhooks";

// Validate IDs
const hasRealIds =
  TEST_CONFIG.company_id.length > 4 &&
  TEST_CONFIG.user_id.length > 5 &&
  TEST_CONFIG.membership_id.length > 4;

if (!hasRealIds) {
  console.error("\n❌ Fill in real IDs first! See test-webhook-real.js for instructions.\n");
  process.exit(1);
}

async function testRecoveryFlow() {
  const failedPaymentId = "pay_test_failed_" + Date.now();
  const successPaymentId = "pay_test_success_" + Date.now();

  // Step 1: Payment Failed
  console.log("\n📉 Step 1: Sending payment.failed webhook...\n");

  const failedPayload = {
    action: "payment.failed",
    data: {
      id: failedPaymentId,
      final_amount: TEST_CONFIG.amount,
      user_id: TEST_CONFIG.user_id,
      membership_id: TEST_CONFIG.membership_id,
      company_id: TEST_CONFIG.company_id,
    }
  };

  console.log(JSON.stringify(failedPayload, null, 2));

  const failedResponse = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(failedPayload),
  });

  console.log(`\n📥 Response: ${failedResponse.status} ${failedResponse.statusText}`);

  if (!failedResponse.ok) {
    console.error("❌ Failed webhook didn't work!");
    process.exit(1);
  }

  console.log("✅ Payment marked as failed!");
  console.log("\n📧 Check:");
  console.log("- Email should be sent to member");
  console.log("- Database should show status='sent'");
  console.log(`- Dashboard: http://localhost:3000/dashboard/${TEST_CONFIG.company_id}`);

  // Wait
  console.log("\n⏳ Waiting 5 seconds before recovery...\n");
  await new Promise(resolve => setTimeout(resolve, 5000));

  // Step 2: Payment Succeeded
  console.log("📈 Step 2: Sending payment.succeeded webhook...\n");

  const successPayload = {
    action: "payment.succeeded",
    data: {
      id: successPaymentId,
      final_amount: TEST_CONFIG.amount,
      user_id: TEST_CONFIG.user_id,
      membership_id: TEST_CONFIG.membership_id,
      company_id: TEST_CONFIG.company_id,
    }
  };

  console.log(JSON.stringify(successPayload, null, 2));

  const successResponse = await fetch(WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(successPayload),
  });

  console.log(`\n📥 Response: ${successResponse.status} ${successResponse.statusText}`);

  if (!successResponse.ok) {
    console.error("❌ Success webhook didn't work!");
    process.exit(1);
  }

  console.log("\n✅ Payment recovered!\n");
  console.log("🎉 Check:");
  console.log("- Database: status should change from 'sent' to 'recovered'");
  console.log("- Database: recovered_at timestamp should be set");
  console.log("- Dashboard: Should show recovery time (e.g., '5m')");
  console.log(`- Go to: http://localhost:3000/dashboard/${TEST_CONFIG.company_id}\n`);
  console.log("💰 Stats should update:");
  console.log("- Total Recovered: +1");
  console.log(`- Total Saved: +$${TEST_CONFIG.amount.toFixed(2)}`);
  console.log("- Recovery Rate: Updated percentage\n");
}

testRecoveryFlow().catch(error => {
  console.error("\n❌ Error:", error.message);
  console.error("\nMake sure dev server is running: npm run dev\n");
  process.exit(1);
});
