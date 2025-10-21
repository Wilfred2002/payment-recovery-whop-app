# 🧪 Webhook Testing Scripts

I created 3 test scripts to help you test webhooks without real users.

---

## 📁 **Available Scripts**

| Script | Use When | Needs Setup? |
|--------|----------|--------------|
| `test-webhook-simple.js` | Quick smoke test | ❌ No |
| `test-webhook-real.js` | Test with real member | ✅ Yes |
| `test-payment-recovery.js` | Test full recovery flow | ✅ Yes |

---

## 🚀 **1. Quick Test (No Setup Required)**

**File:** `test-webhook-simple.js`

**What it does:**
- Sends a fake `payment.failed` webhook
- Uses fake IDs (won't actually send email)
- Tests that webhook endpoint works

**When to use:**
- First time testing
- Just want to see if webhook receives data
- Don't have members set up yet

**How to run:**
```bash
# Make sure dev server is running
npm run dev

# In another terminal
node test-webhook-simple.js
```

**Expected result:**
```
📦 Full webhook payload: { ... }
💥 Payment failed: pay_test_xxx for user user_test_12345
🔍 company_id not in payload, fetching from membership...
❌ Membership not found (expected - using fake IDs)
```

---

## ✅ **2. Real Test (With Actual Member)**

**File:** `test-webhook-real.js`

**What it does:**
- Sends webhook with REAL member IDs
- Actually fetches member data from Whop
- Actually sends recovery email
- Saves to database

**Setup required:**

### Step 1: Create a Test Member

1. Go to your Whop company dashboard
2. **Products** → Create a test product:
   - Name: "Test Subscription"
   - Price: $10/month
   - Type: Recurring

3. **Members** → Add member:
   - Use your email (or `youremail+test@gmail.com`)
   - Assign to test product
   - This creates a real membership!

### Step 2: Get the IDs

After creating the member:

1. Go to **Members** page
2. Click on the member you created
3. Look at the URL and page:
   - **Company ID**: From URL `https://whop.com/hub/biz_XXXXX/...`
   - **User ID**: On member page or in URL (starts with `user_`)
   - **Membership ID**: In memberships section (starts with `mem_`)

### Step 3: Update the Script

Open `test-webhook-real.js` and update:

```javascript
const TEST_CONFIG = {
  company_id: "biz_abc123xyz",    // ← Your real company ID
  user_id: "user_def456abc",       // ← Real user ID from step 2
  membership_id: "mem_ghi789def",  // ← Real membership ID from step 2
  payment_id: "pay_test_" + Date.now(),
  amount: 97.00,
};
```

### Step 4: Run It

```bash
node test-webhook-real.js
```

**Expected result:**
```
✅ Webhook processed!

✅ What to check:
1. Terminal logs - Look for:
   - 📦 Full webhook payload
   - 💥 Payment failed for user user_def456abc
   - 💾 Failed payment saved to database
   - 📧 Recovery email sent to: youremail@gmail.com

2. Supabase database:
   - Go to failed_payments table
   - Should see new row with your test data

3. Email inbox:
   - Check for recovery email
   - May take 1-2 minutes

4. Dashboard:
   - Go to: http://localhost:3000/dashboard/biz_abc123xyz
   - Should see failed payment in table
```

---

## 🎯 **3. Test Full Recovery Flow**

**File:** `test-payment-recovery.js`

**What it does:**
1. Sends `payment.failed` webhook
2. Waits 5 seconds
3. Sends `payment.succeeded` webhook
4. Verifies payment marked as "recovered"

**Setup:** Same as `test-webhook-real.js` above

**How to run:**
```bash
node test-payment-recovery.js
```

**Expected result:**
```
📉 Step 1: Sending payment.failed webhook...
✅ Payment marked as failed!
📧 Email sent to member

⏳ Waiting 5 seconds before recovery...

📈 Step 2: Sending payment.succeeded webhook...
✅ Payment recovered!

🎉 Check:
- Database: status changed from 'sent' to 'recovered'
- Dashboard: Shows recovery time (e.g., '5m')
- Stats updated: +1 recovered, +$149.00 saved
```

---

## 🐛 **Troubleshooting**

### "Connection refused" or "ECONNREFUSED"

**Cause:** Dev server not running

**Fix:**
```bash
npm run dev
```

### "Unable to get user email - check app permissions"

**Cause:** Permissions not approved or member doesn't exist

**Fix:**
1. Check member exists in Whop dashboard
2. Verify IDs are correct in script
3. Re-approve permissions: Settings → Authorized apps → Rebound

### "Membership not found"

**Cause:** Wrong `membership_id`

**Fix:**
1. Go to Whop → Members → Click member
2. Find memberships list
3. Copy the correct `mem_XXXXX` ID

### Email not received

**Check:**
1. Spam folder
2. Resend dashboard for delivery status
3. "Recovery Emails" toggle is ON in settings
4. Correct email in member profile

### Webhook returns 500 error

**Check terminal logs** for the actual error:
- Database connection issue?
- Missing environment variables?
- Supabase table doesn't exist?

---

## 📊 **Testing Checklist**

### Basic Functionality
- [ ] `test-webhook-simple.js` runs without errors
- [ ] Webhook endpoint receives data
- [ ] Logs appear in terminal

### With Real Member
- [ ] Created test member in Whop
- [ ] Updated `test-webhook-real.js` with real IDs
- [ ] Webhook processes successfully
- [ ] Email sent to member's inbox
- [ ] Database row created in `failed_payments`
- [ ] Dashboard shows failed payment

### Recovery Flow
- [ ] Updated `test-payment-recovery.js` with real IDs
- [ ] Failed webhook works
- [ ] Success webhook works
- [ ] Status changes to "recovered"
- [ ] Recovery time calculated
- [ ] Dashboard stats update

### Multi-Tenant
- [ ] Created members in both companies
- [ ] Tested both companies separately
- [ ] Verified data isolation (Company A can't see Company B)
- [ ] Each company has separate settings

---

## 🎓 **Understanding the Flow**

### Real-World Flow:
```
1. Member's card declined
   ↓
2. Whop fires payment.failed webhook
   ↓
3. Your app receives webhook
   ↓
4. Fetches member email from Whop API
   ↓
5. Saves to database (status: "sent")
   ↓
6. Sends recovery email via Resend
   ↓
7. Member updates payment method
   ↓
8. Payment succeeds
   ↓
9. Whop fires payment.succeeded webhook
   ↓
10. Your app marks payment as "recovered"
   ↓
11. Dashboard shows recovery stats
```

### Test Flow (Simulated):
```
1. Run test script
   ↓
2. Script sends fake webhook to your local server
   ↓
3-11. Same as real flow
```

The only difference: You're triggering step 1 manually instead of waiting for real payment failures.

---

## 💡 **Pro Tips**

### Use Multiple Test Emails (Gmail Trick)

All these go to the same inbox:
- `youremail+companyA@gmail.com`
- `youremail+companyB@gmail.com`
- `youremail+test1@gmail.com`

Create multiple "members" without multiple email accounts!

### Test Different Scenarios

```javascript
// High-ticket recovery
amount: 297.00,

// Low-ticket recovery
amount: 9.99,

// Subscription renewal
amount: 49.00,
```

### Monitor Everything

When testing, keep these open:
1. Terminal with dev server logs
2. Supabase dashboard (failed_payments table)
3. Resend dashboard (email delivery logs)
4. Email inbox
5. App dashboard (`/dashboard/biz_xxx`)

---

## ✅ **You're Ready!**

Start with `test-webhook-simple.js` to verify everything works, then move to `test-webhook-real.js` once you have a member set up.

**Next:** Deploy to production and point Whop's real webhook URL to your Vercel app! 🚀
