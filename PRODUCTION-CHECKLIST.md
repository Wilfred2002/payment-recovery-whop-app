# ✅ Production Deployment Checklist

Use this checklist before and after deploying to production.

---

## 🔍 Pre-Deployment Verification

### Local Testing ✅ COMPLETED
- [x] Dev server running successfully
- [x] Test webhooks processed (200 OK)
- [x] Email sent and received
- [x] Database updated correctly
- [x] Payment recovery flow tested
- [x] Dashboard displays data
- [x] Settings page functional

### Code Quality
- [x] No console errors in browser
- [x] No TypeScript errors
- [x] All pages render correctly
- [x] Mobile responsive (test on phone)
- [x] Dev mode properly gitignored

### Database
- [ ] Supabase migration run successfully
- [ ] `failed_payments` table exists
- [ ] `creator_settings` table exists
- [ ] Test data visible in Supabase
- [ ] Database connection string correct

### API Keys & Secrets
- [ ] Whop API key valid
- [ ] Whop webhook secret obtained
- [ ] Supabase service role key copied
- [ ] Resend API key valid
- [ ] All env vars documented

### Whop Configuration
- [ ] App installed on your company
- [ ] Permissions approved:
  - [ ] `member:basic:read`
  - [ ] `member:email:read`
- [ ] Company ID confirmed: `biz_OcALrGzGNTqHU0`

---

## 📦 Git & Deployment

### Before Commit
- [ ] Run `git status` - check what will be committed
- [ ] Verify dev files are gitignored:
  - [ ] `test-*.js` NOT in git status
  - [ ] `DEV-MODE-README.md` NOT in git status
  - [ ] `.env.development.local` NOT in git status
- [ ] All production code ready

### Commit & Push
```bash
# Verify files
git status

# Add everything
git add .

# Commit
git commit -m "feat: payment recovery app ready for production"

# Push
git push origin main
```

- [ ] Code committed
- [ ] Pushed to GitHub
- [ ] GitHub shows latest commit

---

## 🌐 Vercel Deployment

### Initial Setup
- [ ] Vercel account created
- [ ] GitHub repository connected
- [ ] Project imported to Vercel

### Environment Variables
Add these to Vercel (Settings → Environment Variables):

**Whop:**
- [ ] `WHOP_API_KEY`
- [ ] `WHOP_WEBHOOK_SECRET`
- [ ] `NEXT_PUBLIC_WHOP_APP_ID`
- [ ] `NEXT_PUBLIC_WHOP_AGENT_USER_ID`
- [ ] `NEXT_PUBLIC_WHOP_COMPANY_ID`

**Supabase:**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`

**Resend:**
- [ ] `RESEND_API_KEY`

**Verify:**
- [ ] ❌ `DEV_MODE_BYPASS_WHOP_API` NOT added (dev only!)
- [ ] ❌ `DEV_MODE_TEST_EMAIL` NOT added (dev only!)
- [ ] `NODE_ENV` = "production" (automatic in Vercel)

### Deploy
- [ ] Click "Deploy" in Vercel
- [ ] Build succeeds (no errors)
- [ ] Deployment URL received
- [ ] Preview URL accessible

---

## 🧪 Post-Deployment Testing

### Frontend Tests

Visit: `https://your-app.vercel.app`

- [ ] Home page loads
- [ ] `/discover` page works
- [ ] `/discover/dashboard` shows demo data
- [ ] `/discover/settings` interactive and working
- [ ] No console errors (check browser dev tools)
- [ ] Mobile view looks good

### Dashboard Test

Visit: `https://your-app.vercel.app/dashboard/biz_OcALrGzGNTqHU0`

- [ ] Redirects to Whop login (if not authenticated)
- [ ] After login, dashboard loads
- [ ] Shows "No failed payments yet" (if no data)
- [ ] Navigation links work
- [ ] Settings link goes to `/settings/biz_OcALrGzGNTqHU0`

### Settings Test

Visit: `https://your-app.vercel.app/settings/biz_OcALrGzGNTqHU0`

- [ ] Page loads (requires auth)
- [ ] Email toggle works
- [ ] Template editing works
- [ ] Preview updates in real-time
- [ ] Save button functional

### Logs Check

Run: `vercel logs --follow`

Look for:
- [ ] ✅ No "DEV MODE ACTIVE" warnings
- [ ] ✅ No errors on page loads
- [ ] ✅ Server starts successfully
- [ ] ✅ API routes respond

---

## 🔗 Webhook Configuration

### Add Webhook to Whop

1. Go to: https://dash.whop.com
2. Select your app
3. Go to **Webhooks**
4. Click **"Add webhook"**

**Configuration:**
- [ ] URL: `https://your-app.vercel.app/api/webhooks`
- [ ] Events subscribed:
  - [ ] `payment.failed`
  - [ ] `payment.succeeded`
- [ ] Webhook secret matches `WHOP_WEBHOOK_SECRET` in Vercel
- [ ] Webhook status: Active

### Test Webhook

Option A: Send test event from Whop dashboard
- [ ] Whop Dashboard → Webhooks → "Send test event"
- [ ] Select `payment.failed`
- [ ] Click "Send"

Option B: Wait for real payment failure
- [ ] Real payment fails
- [ ] Webhook triggers automatically

**Verify in Vercel logs:**
- [ ] `📦 Full webhook payload:` appears
- [ ] `💥 Payment failed:` message shows
- [ ] `💾 Failed payment saved to database` logged
- [ ] `📧 Recovery email sent to:` shows real user email
- [ ] No errors

---

## 📧 Email Verification

### Resend Dashboard
Visit: https://resend.com/emails

- [ ] Email sent successfully
- [ ] Delivery status: "delivered"
- [ ] No bounces
- [ ] Correct recipient email

### Email Content
Check the actual email:
- [ ] Subject line correct
- [ ] User name personalized
- [ ] Amount shows correctly
- [ ] "Update Payment Method" button works
- [ ] Email looks professional

---

## 💾 Database Verification

### Supabase Dashboard
Visit: https://supabase.com

1. Go to Table Editor → `failed_payments`

**Check:**
- [ ] New row created
- [ ] `company_id` = `biz_OcALrGzGNTqHU0`
- [ ] `user_email` = real user email (not test email!)
- [ ] `status` = "sent"
- [ ] `email_sent_at` timestamp set
- [ ] Amount correct

2. Go to Table Editor → `creator_settings`

**Check:**
- [ ] Row exists for your company
- [ ] `email_enabled` = true (or your setting)
- [ ] Custom templates saved (if you set them)

---

## 🎯 Success Metrics

### After First Real Payment Failure

**Immediate (within 5 minutes):**
- [ ] Webhook received in Vercel logs
- [ ] Database row created
- [ ] Email sent and delivered
- [ ] Customer receives email
- [ ] Dashboard shows the failure

**After Customer Updates Payment (if they do):**
- [ ] `payment.succeeded` webhook received
- [ ] Status changes to "recovered"
- [ ] `recovered_at` timestamp set
- [ ] Recovery time calculated
- [ ] Dashboard stats update:
  - [ ] Total Recovered +1
  - [ ] Total Saved +$amount
  - [ ] Recovery Rate updated

---

## 🐛 Troubleshooting Checklist

If something doesn't work, check these:

### Webhook Not Received
- [ ] Webhook URL correct in Whop dashboard
- [ ] Webhook events subscribed correctly
- [ ] `WHOP_WEBHOOK_SECRET` matches
- [ ] Vercel deployment successful
- [ ] API route exists at `/api/webhooks`

### Email Not Sending
- [ ] `RESEND_API_KEY` correct in Vercel
- [ ] User email fetched successfully (check logs)
- [ ] No errors in Vercel logs
- [ ] Resend dashboard shows attempt
- [ ] Domain verified in Resend (if using custom domain)

### Database Not Updating
- [ ] Supabase tables exist
- [ ] `SUPABASE_SERVICE_ROLE_KEY` correct
- [ ] Database connection successful (check logs)
- [ ] No foreign key errors

### "Unable to get user email" Error
- [ ] Permissions approved in Whop
- [ ] `member:email:read` permission granted
- [ ] User/membership actually exists
- [ ] Not in dev mode (check for warnings)

### Dev Mode Still Active (Should Be Impossible)
- [ ] Vercel env vars - NO `DEV_MODE_BYPASS_WHOP_API`
- [ ] `NODE_ENV` = "production" (automatic)
- [ ] Latest code deployed
- [ ] No dev mode warnings in logs

---

## 📊 Monitoring Setup

### Vercel
- [ ] Enable error alerts
- [ ] Monitor function invocations
- [ ] Track deployment history
- [ ] Set up Slack/email notifications

### Supabase
- [ ] Monitor database size
- [ ] Track query performance
- [ ] Set up backup schedule

### Resend
- [ ] Check delivery rate daily (first week)
- [ ] Monitor bounce rate
- [ ] Track open rates (optional)

---

## 🎉 Launch Day Checklist

Everything above is complete? Great! Here's what to expect:

### First Hour
- [ ] Monitor Vercel logs actively
- [ ] Check for any errors
- [ ] Verify app is responsive

### First Day
- [ ] Check for any webhook failures
- [ ] Monitor email delivery rate
- [ ] Respond to any errors quickly

### First Week
- [ ] Daily log checks
- [ ] Monitor recovery rate
- [ ] Gather initial metrics:
  - Total failed payments
  - Total recovered
  - Average recovery time
  - Recovery rate percentage

### First Month
- [ ] Calculate total revenue recovered
- [ ] Analyze recovery patterns
- [ ] Optimize email templates if needed
- [ ] Consider adding features based on usage

---

## 🚀 You're Live!

Once all checkboxes are checked, you have a **production payment recovery system** running!

**What happens automatically now:**

1. ⚡ Payment fails → Webhook fires
2. 📧 Recovery email sent to customer
3. 💾 Data saved to database
4. 📊 Dashboard shows stats
5. ✅ Payment succeeds → Marked as recovered
6. 💰 Revenue recovered!

**Congratulations!** 🎉

---

## 📝 Quick Reference

**Your URLs:**
- Production: `https://your-app.vercel.app`
- Dashboard: `https://your-app.vercel.app/dashboard/biz_OcALrGzGNTqHU0`
- Settings: `https://your-app.vercel.app/settings/biz_OcALrGzGNTqHU0`
- Webhook: `https://your-app.vercel.app/api/webhooks`
- Discover: `https://your-app.vercel.app/discover`

**Important Links:**
- Vercel Dashboard: https://vercel.com
- Whop Dashboard: https://dash.whop.com
- Supabase Dashboard: https://supabase.com
- Resend Dashboard: https://resend.com

**Quick Commands:**
```bash
# View logs
vercel logs --follow

# Redeploy
vercel --prod --force

# Check status
vercel ls
```

---

**Print this checklist and check items off as you go!** ✓
