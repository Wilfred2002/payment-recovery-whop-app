# 🔐 Whop Permissions Setup Guide

## ✅ What I Just Fixed

### 1. **SDK Configuration** (`lib/whop-sdk.ts`)
- ✅ Removed hardcoded `onBehalfOfUserId`
- ✅ Removed hardcoded `companyId`
- ✅ Now fully multi-tenant compatible

### 2. **Webhook Handler** (`app/api/webhooks/route.ts`)
- ✅ Removed hardcoded test email `wfnaraga@gmail.com`
- ✅ Now fetches real user email from Whop API
- ✅ Uses `member:email:read` permission
- ✅ Fetches user name dynamically
- ✅ Includes proper error handling if permissions not granted

---

## 🎯 Required Permissions

You MUST request these permissions in your Whop app dashboard:

| Permission | Why You Need It | Required? |
|------------|----------------|-----------|
| `member:basic:read` | Get member name and basic info | ✅ **Required** |
| `member:email:read` | Get member email to send recovery notifications | ✅ **Required** |

---

## 📋 Step-by-Step: Configure Permissions

### **Step 1: Go to Permissions Settings**

1. Go to [Whop Developer Dashboard](https://dash.whop.com)
2. Select your app (Rebound)
3. Click on **"Permissions"** in the sidebar

### **Step 2: Add Required Permissions**

Click **"Add permissions"** and add these:

#### Permission 1: `member:basic:read`
- **Justification:** "We need to access member names to personalize payment recovery emails."
- **Required:** ✅ Yes (check the "Required" box)

#### Permission 2: `member:email:read`
- **Justification:** "We need member email addresses to send payment failure notifications and recovery links."
- **Required:** ✅ Yes (check the "Required" box)

### **Step 3: Save Permissions**

Click **"Save"** at the bottom of the permissions page.

### **Step 4: Re-Approve Permissions (For Your Test Company)**

Since you already installed the app on your company, you need to re-approve the new permissions:

1. Go to your Whop Dashboard
2. Navigate to: **Settings → Authorized apps**
3. Find "Rebound" in the list
4. Click **"Re-approve permissions"**
5. Accept the new permissions

---

## 🧪 Testing the Changes

### **Test 1: Check Permissions Work**

Trigger a test `payment.failed` webhook and check logs:

**✅ Success:**
```
📦 Full webhook payload: { ... }
💥 Payment failed: pay_123 for user user_456, company: comp_789
✅ Fetched company_id from membership: comp_789
📧 Recovery email sent to: real.user@email.com
```

**❌ Error (permissions not granted):**
```
❌ Unable to get user email - check app permissions (member:email:read required)
```

If you see the error, go back to Step 4 and re-approve permissions.

### **Test 2: Verify Real Email Sent**

1. Trigger a test payment failure
2. Check your **Resend dashboard** to see if email was sent
3. Verify email went to the **real user's email**, not `wfnaraga@gmail.com`

### **Test 3: Multi-Company Test**

1. Install app on a second test company (Company B)
2. Trigger payment failure for Company B
3. Verify:
   - Email goes to Company B's user
   - Data is isolated (Company A dashboard doesn't show Company B's data)
   - Both companies can configure their own email templates

---

## 🚨 Common Errors & Fixes

### Error: `"member:email:read permission required"`
**Fix:** You didn't approve the permissions. Go to Settings → Authorized apps → Re-approve.

### Error: `"Unauthorized: Admin access required"`
**Fix:** You're not an admin of the company. Only company admins can access the dashboard.

### Error: `"company_id is required"`
**Fix:** The webhook payload doesn't include company_id, and the fallback fetch failed. Check webhook payload logs.

---

## 📝 What Changed in the Code

### Before (Broken - Single Tenant):
```typescript
// lib/whop-sdk.ts
export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: process.env.WHOP_API_KEY,
  onBehalfOfUserId: process.env.NEXT_PUBLIC_WHOP_AGENT_USER_ID, // ❌ Hardcoded
  companyId: process.env.NEXT_PUBLIC_WHOP_COMPANY_ID, // ❌ Hardcoded
});

// app/api/webhooks/route.ts
const userEmail = "wfnaraga@gmail.com"; // ❌ Hardcoded test email
const user = await whopSdk.users.getUser({ userId }); // ❌ Doesn't return email
```

### After (Working - Multi-Tenant):
```typescript
// lib/whop-sdk.ts
export const whopSdk = WhopServerSdk({
  appId: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  appApiKey: process.env.WHOP_API_KEY,
  // ✅ No hardcoded values - fully dynamic
});

// app/api/webhooks/route.ts
// ✅ Get real user email using permissions
const member = await whopSdk.companies.getMember({
  companyId: resolvedCompanyId,
  companyMemberId: membership?.company_member_id || `${userId}_${resolvedCompanyId}`,
});

const userEmail = member.user.email; // ✅ Real user email
const userName = member.user.name || member.user.username || "there"; // ✅ Real name

if (!userEmail) {
  console.error("❌ Unable to get user email - check app permissions");
  return;
}
```

---

## 🎯 Next Steps

1. **Configure Permissions in Whop Dashboard** (see Step 1-3 above)
2. **Re-approve Permissions** on your test company (see Step 4 above)
3. **Test with Real Payment Failure** (see Testing section above)
4. **Deploy to Production** once tests pass
5. **Publish to Whop App Store** - other creators can now install!

---

## 🚀 Production Checklist

Before publishing your app:

- [ ] Permissions configured in Whop dashboard
- [ ] Permissions re-approved on your test company
- [ ] Test payment failure sends to **real user email** (not test email)
- [ ] Multi-company test passes (data isolation verified)
- [ ] Email templates work correctly
- [ ] Settings page saves per-company configuration
- [ ] Dashboard shows only relevant company data
- [ ] All hardcoded values removed from code

---

## 💡 Why This Matters

**Before:** Your app only worked for YOU with hardcoded values.

**After:** Your app works for ANY creator who installs it:
- ✅ Each company gets their own dashboard
- ✅ Each company configures their own email templates
- ✅ Recovery emails go to real users, not test emails
- ✅ Data is completely isolated between companies
- ✅ Ready to publish to Whop App Store

---

## 📚 Resources

- [Whop Permissions Docs](https://docs.whop.com/sdk/build-apps/permissions)
- [Whop SDK Reference](https://docs.whop.com/sdk/reference)
- [Whop Developer Dashboard](https://dash.whop.com)

---

**Questions?** Check the webhook logs when testing. They'll tell you exactly what's wrong!
