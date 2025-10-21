# 🧪 Testing Guide: How to Test Without Real Users

## The Problem
You have 2 test companies but no real users with failed payments. Here's how to test anyway.

---

## ✅ **Option 1: Quick Test with Fake Data (Fast)**

If you just want to see if the code works, you can skip permissions temporarily and test with fake data:

1. **Temporarily comment out the permission check** in `app/api/webhooks/route.ts`:

```typescript
// TEMPORARY: For testing only - remove before production!
const userEmail = "your.test.email@gmail.com"; // Your real email
const userName = "Test User";

// Comment out the real code:
// const member = await whopSdk.companies.getMember({...});
// const userEmail = member.user.email;
// ...
```

2. Run the test script:
```bash
node test-payment-failed.js 1
```

3. Check your email inbox for the recovery email

4. **IMPORTANT:** Undo this change before deploying to production!

---

## ✅ **Option 2: Create Real Test Memberships (Recommended)**

This tests the full flow with real Whop data.

### **Step 1: Find Your Company IDs**

1. Go to [Whop Dashboard](https://whop.com)
2. Switch to Company A
3. Look at the URL: `https://whop.com/hub/biz_XXXXX/...`
4. Copy the `biz_XXXXX` part - this is your `company_id`
5. Repeat for Company B

### **Step 2: Create Test Products**

For **both** companies:

1. In Whop dashboard → **Products**
2. Click **"Create product"**
3. Fill in:
   - Name: "Test Membership"
   - Price: $10/month
   - Type: Recurring subscription
4. Click **Create**

### **Step 3: Create Test Members**

For **both** companies:

1. Go to **Members** page
2. Click **"Add member"** or **"Invite member"**
3. Use your email or a test email (like `youremail+companyA@gmail.com`)
4. Assign them to your test product
5. This creates a real membership!

### **Step 4: Get the Real IDs**

After creating members:

1. Go to **Members** page
2. Click on the member you just created
3. You'll see a page with all their info
4. Look for:
   - **User ID**: `user_XXXXX` (in the URL or user info)
   - **Membership ID**: `mem_XXXXX` (in the memberships list)
5. Copy these IDs

### **Step 5: Update Test Script**

Open `test-payment-failed.js` and replace the fake values:

```javascript
const TEST_DATA = {
  companyA: {
    company_id: "biz_abc123",           // ← From Step 1
    user_id: "user_xyz789",             // ← From Step 4
    membership_id: "mem_def456",        // ← From Step 4
    payment_id: "pay_test_12345",       // ← Keep this fake
    amount: 97.00,
    user_email: "youremail@gmail.com"   // ← Your real email
  },
  // ... same for companyB
};
```

### **Step 6: Run the Test**

Make sure your dev server is running:
```bash
npm run dev
```

In another terminal:
```bash
node test-payment-failed.js 1  # Test Company A
```

---

## 📊 **What to Check**

### ✅ Terminal Logs (Server)
You should see:
```
📦 Full webhook payload: { ... }
💥 Payment failed: pay_test_12345 for user user_xyz789, company: biz_abc123
✅ Fetched company_id from membership: biz_abc123
💾 Failed payment saved to database: uuid-here
📧 Recovery email sent to: youremail@gmail.com
```

### ✅ Supabase Database
1. Go to Supabase → **Table Editor** → `failed_payments`
2. You should see a new row with:
   - `company_id`: Your company ID
   - `user_email`: Your email
   - `amount`: 97.00
   - `status`: "sent"

### ✅ Your Email Inbox
You should receive an email with:
- Subject: "⚠️ Your payment failed - Update needed"
- Body: Personalized with your name and amount
- Button: "Update Payment Method"

### ✅ Dashboard
1. Go to `http://localhost:3000/dashboard/biz_abc123` (use your real company ID)
2. You should see the failed payment in the table

---

## 🎯 **Test Multi-Tenant Isolation**

Run both tests:
```bash
node test-payment-failed.js 3  # Tests both companies
```

**Verify:**
- Company A's dashboard shows only Company A's data
- Company B's dashboard shows only Company B's data
- Each company has separate email settings
- Data doesn't leak between companies

---

## 🐛 **Common Issues**

### "Unable to get user email - check app permissions"

**Fix:** The membership doesn't exist or you don't have the right permissions.

**Solutions:**
1. Make sure you created a real member in Step 3
2. Check that you approved `member:email:read` permission
3. Use Option 1 (fake data) for quick testing

### "company_id is required"

**Fix:** You didn't include `company_id` in the test payload.

**Solution:** Make sure `TEST_DATA.companyA.company_id` is filled in.

### "Membership not found"

**Fix:** The `membership_id` you provided doesn't exist.

**Solution:**
1. Go to Whop dashboard → Members
2. Find the real membership ID
3. Update `test-payment-failed.js`

### No email received

**Possible causes:**
1. Email went to spam - check spam folder
2. Resend domain not verified - check Resend dashboard
3. Wrong email address in test script
4. Recovery emails disabled in settings

**Fix:**
- Check Resend dashboard for delivery logs
- Verify `user_email` in test script is correct
- Go to `/settings/biz_abc123` and make sure "Recovery Emails" is ON

---

## 🚀 **Production Testing**

Once you deploy to production (Vercel):

1. Set up **real** webhook in Whop dashboard
2. Point it to: `https://your-app.vercel.app/api/webhooks`
3. Create a real test membership
4. Trigger an actual payment failure (or use Stripe test mode to decline a card)
5. Verify the flow works end-to-end

---

## 💡 **Pro Tip: Use Multiple Test Emails**

Gmail trick - all these go to the same inbox:
- `youremail+companyA@gmail.com`
- `youremail+companyB@gmail.com`
- `youremail+test1@gmail.com`

This way you can test multiple "users" without creating multiple email accounts!

---

## 📝 **Quick Test Checklist**

- [ ] Created test products in both companies
- [ ] Created test members in both companies
- [ ] Found real `company_id`, `user_id`, `membership_id`
- [ ] Updated `test-payment-failed.js` with real IDs
- [ ] Dev server running (`npm run dev`)
- [ ] Ran test script (`node test-payment-failed.js 1`)
- [ ] Checked terminal logs for success
- [ ] Verified database row in Supabase
- [ ] Received recovery email in inbox
- [ ] Checked dashboard shows the failed payment
- [ ] Tested both companies for data isolation

---

**You're ready to test!** 🎉

Start with Option 1 for quick validation, then do Option 2 for full testing with real Whop data.
