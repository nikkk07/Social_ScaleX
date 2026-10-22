# Self-serve ₹99 comment-to-DM — owner setup

One-time setup. Do the sections in order. Everything marked **(you)** needs
your login; nothing here is done by customers.

Live URL used below: `https://www.socialscalex.in`

---

## How it works for a customer

1. **Sign up** at `/start` — Google, or email + password.
2. **Connect Instagram** — one button, Instagram's own login screen. Needs an
   Instagram **Professional** account (Business or Creator).
3. **Set up** — pick All posts or specific posts → keyword or every comment →
   optional public reply → the DM.
4. **Pay ₹99** — AutoPay every month, or once for 30 days (Razorpay).
5. **Live** — dashboard shows every comment and whether the DM went out.

Customers never see an API key or token. Each Instagram account is ₹99/month;
inside it, automations, posts, keywords and messages are unlimited.

---

## 1. Supabase (5 min) **(you)**

1. Supabase → SQL Editor → paste and run
   `supabase/migrations/20261023090000_ig_comment_dm.sql`.
2. Authentication → Sign In / Providers → keep **Allow new users to sign up = OFF**
   (the CRM depends on it; the app creates customer accounts itself).
3. Authentication → URL Configuration → Redirect URLs → add
   `https://www.socialscalex.in/dashboard/reset`.
4. Recommended: Authentication → Emails → **SMTP Settings** → connect a mail
   provider (e.g. Resend, free tier). Supabase's built-in mailer sends only a
   few emails an hour, which is too few for "Forgot password".

## 2. Google sign-in (10 min) **(you)**

1. console.cloud.google.com → create a project "Social ScaleX".
2. APIs & Services → OAuth consent screen → External → app name
   "Social ScaleX", support email, authorized domain `socialscalex.in` → Publish.
3. Credentials → Create credentials → OAuth client ID → **Web application**.
   Authorized JavaScript origins: `https://www.socialscalex.in`
   (add `http://localhost:3000` for local testing). No redirect URI needed.
4. Copy the **Client ID** → Vercel env `NEXT_PUBLIC_GOOGLE_CLIENT_ID`.

Without it the page simply shows email sign-up only.

## 3. Meta / Instagram app (30 min + Meta's review time) **(you)**

**a. Business portfolio + verification**
1. business.facebook.com → create a business portfolio "Social ScaleX" if you
   don't have one.
2. Settings → Security Center → **Start verification** (GST certificate,
   Udyam or other registration document). Approval usually takes a few days.

**b. Create the app**
1. developers.facebook.com → My Apps → **Create app**.
2. Use case: **Manage messaging & content on Instagram**. Link your business portfolio.
3. In the app: Instagram → **API setup with Instagram login**.
4. Copy **Instagram app ID** → `IG_APP_ID`, **Instagram app secret** → `IG_APP_SECRET`.

**c. Business login settings** (same page → "Set up Instagram business login")
- OAuth redirect URI: `https://www.socialscalex.in/api/instagram/callback`
- Deauthorize callback URL: `https://www.socialscalex.in/api/instagram/deauthorize`
- Data deletion request URL: `https://www.socialscalex.in/api/instagram/data-deletion`

**d. Webhooks** (same page → "Configure webhooks")
- Callback URL: `https://www.socialscalex.in/api/webhooks/instagram`
- Verify token: the value of `IG_WEBHOOK_VERIFY_TOKEN` (deploy first, see §5)
- Click **Verify and save**, then subscribe to the **comments** field.

**e. App settings → Basic**
- Privacy policy URL: `https://www.socialscalex.in/privacy`
- Terms of service URL: `https://www.socialscalex.in/terms`
- App icon (1024×1024), category "Business and pages", contact email.

**f. Testers (works today, before review)**
App roles → Roles → **Add people → Instagram tester** → enter the Instagram
username. That person accepts in Instagram: Settings → Website permissions →
Apps and websites → **Tester invites**. Only testers can connect until review passes.

**g. App Review (to open it to everyone)**
App Review → Permissions and features → request **Advanced Access** for:
`instagram_business_basic`, `instagram_business_manage_comments`,
`instagram_business_manage_messages`. For each: one sentence on how it is used,
a screen recording of the flow (sign up → connect → set up → a comment getting
the DM), and test login steps for Meta's reviewer. Then switch the app to **Live**.
Meta's docs say webhooks for comments need Advanced Access and a Live app.

## 4. Razorpay (KYC time + 15 min) **(you)**

1. razorpay.com → sign up → complete KYC (PAN, bank account, business proof).
2. Ask Razorpay support to enable **Subscriptions** and **UPI AutoPay** if they
   aren't on already.
3. Account & Settings → API Keys → generate (start in **Test mode**) →
   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`.
4. Account & Settings → Webhooks → Add:
   - URL `https://www.socialscalex.in/api/webhooks/razorpay`
   - Secret: any long random string → `RAZORPAY_WEBHOOK_SECRET`
   - Events: `payment.captured`, `subscription.activated`, `subscription.charged`,
     `subscription.halted`, `subscription.cancelled`, `subscription.completed`,
     `subscription.paused`, `subscription.resumed`, `subscription.pending`
5. The ₹99 monthly plan is created automatically on the first AutoPay checkout.
6. When everything works in Test mode, switch to Live keys and add the webhook
   again in Live mode.

## 5. Vercel environment variables **(you)**

Vercel → project → Settings → Environment Variables → Production (and Preview):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | from §2 |
| `IG_APP_ID`, `IG_APP_SECRET` | from §3b |
| `IG_WEBHOOK_VERIFY_TOKEN` | any long random string |
| `IG_TOKEN_KEY` | run `openssl rand -base64 32` once. **Never change it** (every account would have to reconnect) |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` | from §4 |
| `CRON_SECRET` | run `openssl rand -hex 24` |
| `NEXT_PUBLIC_SELF_SERVE_99` | leave **empty** until Meta approves; then `1` |

Redeploy after adding them. `SUPABASE_SERVICE_ROLE_KEY` is already set for the CRM.

## 6. Test it (tester account, Razorpay Test mode)

Note: Meta's webhook docs say comment notifications need Advanced Access and a
Live app. Sign-up, connecting, the post picker, saving and paying all work
before review; if real comments don't arrive yet, use the **Test** button next
to the `comments` field in Meta's webhook settings to send a sample event, and
expect full end-to-end DMs once App Review passes.

1. Open `/start` → sign up.
2. Connect the tester Instagram account.
3. Create: All posts → keyword `PRICE` → public reply on → DM with a real link.
4. Pay ₹99 with a Razorpay test card / test UPI.
5. From a **different** Instagram account, comment `price?` on any post.
   The DM and public reply should arrive within a minute, and the dashboard
   shows "DM sent".
6. Check: commenting again within 24 h → "Skipped: already sent";
   pausing the automation → "No automation matched".

## 7. Go live

1. Meta App Review approved + app Live, Razorpay Live keys in.
2. Set `NEXT_PUBLIC_SELF_SERVE_99=1` → redeploy. Every "Get it for ₹99"
   button on the site now opens `/start`.
3. Update the ₹99 plan wording in `src/lib/automation.ts` (`PLAN_99.includes`)
   from "done for you" to self-serve, or keep both offers — your call.

---

## What the system handles on its own

| Situation | What happens |
|---|---|
| Same comment delivered twice by Meta | Handled once (unique per comment) |
| Our own public reply triggers a webhook | Ignored, so no reply loops |
| Someone comments the keyword 10 times | One DM per person, per post, per automation, per day |
| Reply inside a thread | Skipped (only new comments trigger) |
| Two automations match one comment | The specific-post one wins, then the keyword one; one DM per comment (Meta's limit) |
| Comment older than 7 days | Instagram refuses the DM; logged with a plain reason |
| Plan expired / not paid | Comment logged as "Plan not active"; no DM |
| AutoPay renewal fails | Runs until the paid date, dashboard asks to pay |
| Customer closes the tab right after paying | Razorpay webhook still switches it on |
| Instagram token about to expire | Refreshed daily by the cron; if Instagram refuses, the dashboard says "Reconnect" |
| Customer removes our app in Instagram | Account marked disconnected, token deleted |
| Instagram data deletion request | Everything for that account deleted, AutoPay cancelled |
| Same Instagram account connected by a second login | Refused, with a clear message |
| Personal (non-professional) Instagram account | Clear message with how to switch |
| Permissions switched off on Instagram's screen | Asked to reconnect with all permissions |
| Removing an account | AutoPay cancelled first, then everything deleted |
| Someone signs up with another person's email | When the real owner signs in with Google, the old password is replaced and all other sessions are signed out |
| Wrong password 5 times | That email is locked for 15 minutes |
| DM template still says `https://` | Can't save until a real link is added or it's removed |
