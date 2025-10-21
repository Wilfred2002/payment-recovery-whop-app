# 🚀 Production Deployment Guide

Complete guide to deploying Rebound to Vercel and going live.

---

## ✅ Pre-Deployment Checklist

### 1. Local Testing Complete
- [x] Dev mode tests passed
- [x] Email flow working (check your inbox)
- [x] Database updates verified
- [x] Dashboard displays data correctly
- [x] Recovery flow tested

### 2. Database Setup
- [ ] Supabase migration run (`supabase-migration-creator-settings.sql`)
- [ ] Both tables exist: `failed_payments` and `creator_settings`
- [ ] Test data visible in Supabase dashboard

### 3. Whop Configuration
- [ ] Permissions approved in Whop dashboard
  - `member:basic:read` ✅
  - `member:email:read` ✅
- [ ] App installed on your company
- [ ] Company ID confirmed: `biz_OcALrGzGNTqHU0`

### 4. Email Setup
- [ ] Resend API key valid
- [ ] Test email received in development
- [ ] (Optional) Custom domain verified in Resend

---

## 📋 Step 1: Run Supabase Migration

If you haven't already, run the database migration:

### Option A: Supabase Dashboard
1. Go to https://supabase.com
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy contents of `supabase-migration-creator-settings.sql`
6. Paste and click **Run**

### Option B: Supabase CLI
```bash
supabase db push
```

### Verify Migration
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('failed_payments', 'creator_settings');
```

Should return both tables.

---

## 🔐 Step 2: Prepare Environment Variables

Create a list of your production environment variables (for Vercel):

```bash
# Whop
WHOP_API_KEY=9QB3XpSFkEFhccjJqtJQrOGciwyJlEizdutN8c7j9Do
WHOP_WEBHOOK_SECRET=ws_a0ba69538506530afa5ffc1ec0f95473c327fbf885967831be4e5b137773cd4b
NEXT_PUBLIC_WHOP_APP_ID=app_Yvs1M2hYeMKe0a
NEXT_PUBLIC_WHOP_AGENT_USER_ID=user_SDLnd97tckmBe
NEXT_PUBLIC_WHOP_COMPANY_ID=biz_OcALrGzGNTqHU0

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://cvsrafokutxgpdosuvdl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3JhZm9rdXR4Z3Bkb3N1dmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA5MzkyODUsImV4cCI6MjA3NjUxNTI4NX0.0soMomPOCs_halGfvgSFZs7PxIcN0kptTimDR1zr6w8
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2c3JhZm9rdXR4Z3Bkb3N1dmRsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MDkzOTI4NSwiZXhwIjoyMDc2NTE1Mjg1fQ.-8hFVQDhLlSLyv2JkbUbIdqxC7rQLYfbu13bt2ZEez8

# Resend
RESEND_API_KEY=re_7C74Er9g_NKTP5KmZkUnfJNAYCitSLPGf
```

**Important Notes:**
- ❌ **DO NOT** include `DEV_MODE_BYPASS_WHOP_API` (dev only)
- ❌ **DO NOT** include `DEV_MODE_TEST_EMAIL` (dev only)
- ✅ Include all WHOP, Supabase, and Resend keys
- ✅ `NODE_ENV` is automatically set to "production" by Vercel

---

## 📦 Step 3: Commit Your Changes

```bash
# Check what will be committed
git status

# Add all changes
git add .

# Verify dev files are NOT included
git status
# Should NOT see:
# - test-*.js files
# - DEV-MODE-README.md
# - .env.development.local

# Commit
git commit -m "feat: payment recovery app ready for production

- Multi-tenant support with dynamic company_id
- Email recovery system with custom templates
- Settings page for email configuration
- Dashboard with recovery stats
- Discover mode for marketing
- Dev mode for local testing (gitignored)"

# Push to GitHub
git push origin main
```

---

## 🌐 Step 4: Deploy to Vercel

### Option A: Vercel Dashboard (Recommended)

1. **Go to Vercel**
   - Visit: https://vercel.com
   - Sign in with GitHub

2. **Import Project**
   - Click **"Add New"** → **"Project"**
   - Select your GitHub repository: `whop-app`
   - Click **"Import"**

3. **Configure Project**
   - **Framework Preset:** Next.js (auto-detected)
   - **Root Directory:** `./` (default)
   - **Build Command:** `npm run build` (default)
   - **Output Directory:** `.next` (default)

4. **Add Environment Variables**
   - Click **"Environment Variables"**
   - Add each variable from Step 2 above
   - Make sure to add them for **Production** environment
   - Click **"Add"** for each one

5. **Deploy**
   - Click **"Deploy"**
   - Wait 2-3 minutes for build
   - You'll get a URL like: `https://whop-app-xxx.vercel.app`

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project? No
# - Project name: whop-app
# - Directory: ./
# - Override settings? No

# Add environment variables
vercel env add WHOP_API_KEY
# Paste the value, press Enter
# Repeat for all env vars from Step 2

# Deploy to production
vercel --prod
```

---

## 🧪 Step 5: Test Preview Deployment

After deployment, Vercel gives you a preview URL.

### A. Test the Frontend

Visit your preview URL: `https://whop-app-xxx.vercel.app`

**Check:**
- [ ] Home page loads
- [ ] `/discover` page works
- [ ] `/discover/dashboard` shows demo data
- [ ] `/discover/settings` works
- [ ] No console errors

### B. Test Dashboard (Requires Auth)

1. Go to: `https://whop-app-xxx.vercel.app/dashboard/biz_OcALrGzGNTqHU0`
2. You might get redirected to Whop login
3. After login, dashboard should load
4. Should show "No failed payments yet" (if no real data)

### C. Test Webhook Endpoint

**Important:** You can't test webhooks in preview mode easily because:
- Whop webhooks go to a fixed URL (not preview URLs)
- We'll test webhooks after moving to production domain

---

## 🎯 Step 6: Configure Production Webhook

### 1. Get Your Production URL

After deploying to production, Vercel gives you:
- Default: `https://whop-app-xxx.vercel.app`
- Or custom domain: `https://your-domain.com`

Your webhook URL will be:
```
https://whop-app-xxx.vercel.app/api/webhooks
```

### 2. Add Webhook in Whop Dashboard

1. Go to: https://dash.whop.com
2. Select your app
3. Go to **Webhooks** section
4. Click **"Add webhook"**
5. Enter your webhook URL:
   ```
   https://whop-app-xxx.vercel.app/api/webhooks
   ```
6. Select events to subscribe to:
   - ✅ `payment.failed`
   - ✅ `payment.succeeded`
7. Save

### 3. Verify Webhook Secret Matches

The `WHOP_WEBHOOK_SECRET` in Vercel must match the one shown in Whop dashboard.

---

## ✅ Step 7: Production Testing

### Test 1: Check Environment

Visit your production URL and check Vercel logs:

```bash
# View logs in real-time
vercel logs --follow
```

**Look for:**
- ✅ No dev mode warnings (good!)
- ✅ No "DEV MODE ACTIVE" messages
- ✅ Server starts successfully

### Test 2: Manual Webhook Test

You can send a test webhook from Whop dashboard:

1. Whop Dashboard → Your App → Webhooks
2. Click **"Send test event"**
3. Select `payment.failed`
4. Click **"Send"**

**Check Vercel logs:**
```bash
vercel logs --follow
```

**Should see:**
- `📦 Full webhook payload:`
- `💥 Payment failed: ...`
- `💾 Failed payment saved to database`
- `📧 Recovery email sent to: ...`

### Test 3: Real Payment Failure

The ultimate test! When a real payment fails:

1. It triggers Whop webhook
2. Your app receives it
3. Email sent to the actual customer
4. Dashboard shows the failure
5. When they pay, status changes to "recovered"

---

## 🐛 Troubleshooting Production Issues

### Issue: "Unable to get user email"

**Cause:** Permissions not approved or membership doesn't exist

**Fix:**
1. Check Whop dashboard → Permissions
2. Ensure `member:email:read` is approved
3. Check the user/membership actually exists

### Issue: "Webhook signature invalid"

**Cause:** `WHOP_WEBHOOK_SECRET` mismatch

**Fix:**
1. Get secret from Whop dashboard → Webhooks
2. Update in Vercel → Settings → Environment Variables
3. Redeploy: `vercel --prod`

### Issue: "Database connection failed"

**Cause:** Supabase env vars incorrect

**Fix:**
1. Verify `SUPABASE_SERVICE_ROLE_KEY` in Vercel
2. Check Supabase project is running
3. Check IP allowlist in Supabase (should allow all for Vercel)

### Issue: "Email not sending"

**Cause:** Resend API key or domain issue

**Fix:**
1. Check `RESEND_API_KEY` is correct in Vercel
2. Verify sending domain in Resend dashboard
3. Check Resend logs for delivery errors

### Issue: Dev mode still active in production

**This should be IMPOSSIBLE if you followed this guide, but if it happens:**

**Check:**
1. Vercel logs - look for "DEV MODE ACTIVE" warnings
2. Vercel env vars - should NOT have `DEV_MODE_BYPASS_WHOP_API`
3. Check `NODE_ENV` is "production" (automatic in Vercel)

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Delete `DEV_MODE_BYPASS_WHOP_API` if it exists
3. Redeploy

---

## 🎉 Step 8: Verify Everything Works

### Production Checklist

- [ ] App deployed to Vercel
- [ ] Custom domain configured (optional)
- [ ] All environment variables set
- [ ] Webhook configured in Whop
- [ ] Test webhook received successfully
- [ ] Database connection working
- [ ] Emails sending to real users
- [ ] Dashboard accessible
- [ ] Settings page working
- [ ] Discover pages public and working
- [ ] No dev mode warnings in logs
- [ ] Supabase tables populated correctly

### Monitor These

**Vercel Dashboard:**
- Build logs (should be successful)
- Function logs (webhook processing)
- Error rate (should be low)

**Supabase Dashboard:**
- Table row count increasing
- No connection errors

**Resend Dashboard:**
- Email delivery rate
- Bounce rate
- Open rate (if tracking enabled)

**Whop Dashboard:**
- Webhook delivery success rate
- Event subscriptions active

---

## 🔄 Step 9: Continuous Deployment

After initial deployment, every time you push to `main`:

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
```

Vercel automatically:
1. Detects the push
2. Builds your app
3. Runs tests
4. Deploys to production
5. Keeps previous deployment as backup

**Preview Deployments:**
- Every PR creates a preview URL
- Test changes before merging
- Safe to experiment

---

## 📊 Post-Deployment Monitoring

### Week 1: Active Monitoring

Check daily:
- Vercel error logs
- Failed payment count in database
- Email delivery success rate
- Recovery rate percentage

### Week 2+: Passive Monitoring

Set up alerts:
- Vercel: Error rate > 5%
- Resend: Delivery rate < 95%
- Supabase: No new data in 7 days (might indicate webhook issue)

---

## 🚀 Optional: Custom Domain

### 1. Buy Domain
- Namecheap, GoDaddy, etc.
- Example: `rebound-payments.com`

### 2. Add to Vercel
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your domain
3. Follow DNS configuration instructions

### 3. Update Webhook URL
1. Whop Dashboard → Webhooks
2. Update URL to: `https://your-domain.com/api/webhooks`

---

## 📝 Production Environment Variables Reference

Copy this to Vercel Environment Variables page:

```env
# Required for Vercel
WHOP_API_KEY=your_whop_api_key
WHOP_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_WHOP_APP_ID=your_app_id
NEXT_PUBLIC_WHOP_AGENT_USER_ID=your_agent_user_id
NEXT_PUBLIC_WHOP_COMPANY_ID=your_company_id
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_key

# These are automatically set by Vercel:
# NODE_ENV=production (automatic)
# VERCEL=1 (automatic)
# VERCEL_ENV=production (automatic)

# DO NOT ADD (dev only, gitignored):
# DEV_MODE_BYPASS_WHOP_API
# DEV_MODE_TEST_EMAIL
# DEV_MODE_TEST_NAME
```

---

## 🎯 Success Criteria

Your deployment is successful when:

✅ **Frontend Works**
- Public pages load without errors
- Discover pages show demo data
- Dashboard accessible to authenticated users

✅ **Backend Works**
- Webhooks receive and process successfully
- Database saves failed payments
- Emails send to real users
- Recovery status updates correctly

✅ **Monitoring Clean**
- No errors in Vercel logs
- No failed webhooks in Whop dashboard
- Email delivery rate > 95%
- Database updates in real-time

✅ **Dev Mode Disabled**
- No "DEV MODE ACTIVE" warnings
- Production logs show real Whop API calls
- Real member emails being fetched

---

## 🎉 You're Live!

Once all checks pass, your payment recovery app is live and working!

**What happens next:**
1. Real payments fail → Webhook fires
2. Your app processes it
3. Recovery email sent
4. Customer updates payment
5. Payment succeeds → Status changes to "recovered"
6. You see stats in dashboard

**Congrats! You've deployed a production SaaS app!** 🚀

---

## 📚 Quick Commands Reference

```bash
# Deploy to Vercel
vercel --prod

# View logs
vercel logs --follow

# Check build status
vercel ls

# Add env var
vercel env add VAR_NAME

# Redeploy (after env change)
vercel --prod --force

# Git workflow
git add .
git commit -m "your message"
git push origin main
```

---

## 🆘 Need Help?

- **Vercel Issues:** https://vercel.com/docs
- **Supabase Issues:** https://supabase.com/docs
- **Whop Issues:** https://docs.whop.com
- **Check logs:** `vercel logs --follow`

---

**Ready to deploy?** Start with Step 1! 🚀
