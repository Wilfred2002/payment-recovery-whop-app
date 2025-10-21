# Rebound - Setup & Testing Guide

## ✅ What We've Built

You now have a complete payment recovery system with:

### Features Implemented
- ✅ **Landing Page** - Beautiful, minimalistic design with Space Mono font
- ✅ **Dashboard** - Sidebar + Stripe-style table showing failed payments and recovery stats
- ✅ **Settings Page** - Email template customization with live preview
- ✅ **Navigation** - Header with Dashboard + Settings links (shows when user has access)
- ✅ **Email System** - Custom templates with variable replacement
- ✅ **Webhook Integration** - Checks settings before sending emails
- ✅ **Loading States** - Dashboard loading skeleton
- ✅ **Toast Notifications** - Success/error messages throughout app
- ✅ **Confirmation Modals** - "Are you sure?" before disabling emails
- ✅ **Consistent Design** - Header and footer on all pages with mint color scheme

---

## 🗄️ Database Setup

### Step 1: Create the `creator_settings` Table in Supabase

1. Go to your Supabase project: https://supabase.com
2. Navigate to **SQL Editor**
3. Run the SQL file: `supabase-migration-creator-settings.sql`

```sql
-- The file is located at: /Users/wilfrednaraga/whop-app/supabase-migration-creator-settings.sql
-- Copy and paste the entire contents into Supabase SQL Editor and run it
```

This will create:
- `creator_settings` table with email configuration
- Indexes for performance
- Trigger to auto-update `updated_at` timestamp

### Step 2: Verify Tables Exist

Run this query in Supabase to verify both tables:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('failed_payments', 'creator_settings');
```

You should see both tables listed.

---

## 🧪 Testing Checklist

### 1. Test Navigation
- [ ] Visit `localhost:3000`
- [ ] Click "DASHBOARD →" button
- [ ] Verify you see Dashboard and Settings links in header
- [ ] Click Settings link
- [ ] Verify Settings page loads
- [ ] Click REBOUND logo to return home

### 2. Test Settings Page
- [ ] Go to `localhost:3000/settings`
- [ ] Toggle "Recovery Emails" off
- [ ] Confirm modal appears: "Disable Recovery Emails?"
- [ ] Click "Yes, Disable"
- [ ] Verify toast: "Recovery emails disabled"
- [ ] Toggle back on
- [ ] Verify toast: "Recovery emails enabled"
- [ ] Edit email subject line
- [ ] Edit email body
- [ ] Verify preview updates in real-time
- [ ] Click "Save Changes"
- [ ] Verify toast: "Settings saved successfully!"
- [ ] Refresh page - settings should persist
- [ ] Click "Reset" button
- [ ] Verify default template is restored

### 3. Test Webhook Flow

**Option A: Use Test Script**
```bash
node test-webhook.js
```

This will simulate a `payment.failed` event.

**Option B: Trigger Real Webhook from Whop**
1. Configure webhook URL in Whop dashboard
2. Trigger a test payment failure
3. Check console logs for "💥 Payment failed"

**What to verify:**
- [ ] Failed payment appears in dashboard
- [ ] If emails are enabled: "📧 Recovery email sent"
- [ ] If emails are disabled: "⏸️  Recovery emails are disabled"
- [ ] Custom email template is used (if you changed it)
- [ ] Email contains correct {name}, {amount}, {updateLink} replacements

### 4. Test Email Variables
- [ ] In Settings, add test text with all variables:
  ```
  Hi {name}, your payment of {amount} failed.
  Click here to update: {updateLink}
  ```
- [ ] Save settings
- [ ] Trigger test webhook
- [ ] Verify email replaces variables correctly

### 5. Test Dashboard Loading State
- [ ] Clear browser cache
- [ ] Visit dashboard with throttled network (Chrome DevTools)
- [ ] Verify loading skeleton appears
- [ ] Verify data loads correctly after

### 6. Test Mobile Responsiveness
- [ ] Open DevTools mobile view
- [ ] Test landing page on mobile
- [ ] Test dashboard on mobile (sidebar stacks on top)
- [ ] Test settings page on mobile
- [ ] Verify navigation works on mobile

---

## 🚀 Pre-Production Checklist

Before deploying to production, complete these tasks:

### Required Tasks
- [ ] **Run SQL migration** in Supabase (creator_settings table)
- [ ] **Verify domain in Resend**
  - Currently emails only go to `wfnaraga@gmail.com` (test mode)
  - Add and verify your domain in Resend dashboard
  - Update `from` address in `lib/email.ts`
- [ ] **Update email recipient**
  - Remove hardcoded `wfnaraga@gmail.com` in `app/api/webhooks/route.ts:65`
  - Use actual `user.email` from Whop API
- [ ] **Test with real payment** failure on Whop
- [ ] **Set up production webhook** URL in Whop
  - Format: `https://your-domain.vercel.app/api/webhooks`
- [ ] **Update app metadata** (optional)
  - Change title in `app/layout.tsx` from "Whop App" to "Rebound"
  - Add favicon

### Environment Variables for Production (Vercel)
```
WHOP_API_KEY=
WHOP_WEBHOOK_SECRET=
NEXT_PUBLIC_WHOP_APP_ID=
NEXT_PUBLIC_WHOP_AGENT_USER_ID=
NEXT_PUBLIC_WHOP_COMPANY_ID=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RESEND_API_KEY=
```

---

## 📝 Files Created/Modified

### New Files
- `app/components/Header.tsx` - Navigation header component
- `app/components/Footer.tsx` - Footer component
- `app/settings/page.tsx` - Settings page with email customization
- `app/api/settings/route.ts` - API for GET/POST settings
- `app/dashboard/[companyId]/loading.tsx` - Loading skeleton
- `supabase-migration-creator-settings.sql` - Database migration
- `SETUP-GUIDE.md` - This file

### Modified Files
- `app/page.tsx` - Updated with new layout, Header/Footer
- `app/dashboard/[companyId]/page.tsx` - Updated with new design, Header/Footer, navigation
- `app/layout.tsx` - Added Space Mono font
- `app/globals.css` - Added mint color palette
- `lib/supabase.ts` - Added CreatorSettings type
- `lib/email.ts` - Added custom template support
- `app/api/webhooks/route.ts` - Check settings before sending emails
- `package.json` - Added react-hot-toast

---

## 🐛 Troubleshooting

### Settings not saving
- Check Supabase table was created correctly
- Check browser console for API errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is set

### Emails not sending
- Check if "Recovery Emails" toggle is ON in settings
- Check Resend API key is valid
- Check console logs for email errors
- Verify email is going to test email (wfnaraga@gmail.com)

### Webhook not triggering
- Check `WHOP_WEBHOOK_SECRET` matches Whop dashboard
- In development, signature validation is skipped
- Check console for webhook logs

### Navigation not showing
- Verify you're logged in as admin on Whop
- Check `NEXT_PUBLIC_WHOP_COMPANY_ID` is set
- Check user has access to company

---

## 📊 What's Next?

After testing everything above:

1. **Deploy to Vercel**
   ```bash
   git add .
   git commit -m "Complete MVP: Settings, navigation, email templates"
   git push
   ```

2. **Configure Production**
   - Set environment variables in Vercel
   - Update webhook URL in Whop
   - Verify domain in Resend

3. **Final Testing**
   - Test with real payment failure
   - Verify emails send to actual users
   - Check recovery tracking works

4. **Launch!**
   - Submit to Whop App Store
   - Monitor for errors
   - Gather user feedback

---

## 💡 Tips

- **Test email templates** thoroughly before going live
- **Monitor webhook logs** in production
- **Keep settings simple** - too many options confuse users
- **Check Resend delivery stats** to ensure emails aren't bouncing
- **Set up error monitoring** (Sentry, LogRocket, etc.) for production

---

You now have a fully functional payment recovery system ready for production! 🎉
