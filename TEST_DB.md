# Database Setup Checklist

Run these steps IN ORDER in your Supabase SQL Editor:

## Step 1: Check if tables exist
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;
```

**Expected output**: Should show: `allowed_emails`, `inbound_enquiries`, `keepalive`, `lead_activities`, `lead_contacts`, `lead_phones`, `leads`, `profiles`

If you DON'T see these tables, continue to Step 2.
If you DO see them, skip to Step 4.

---

## Step 2: Run the full schema (ONLY if tables don't exist)

Copy ALL content from `SETUP_RUN_ME.sql` and paste into SQL Editor, then click Run.

---

## Step 3: Create your first user in Supabase Auth

1. Go to **Authentication** → **Users**
2. Click **"Add user"** → **"Create new user"**
3. Email: `07nikhilbisht@gmail.com`
4. Password: (choose a secure password)
5. Click **"Create user"**

---

## Step 4: Add yourself to allowed_emails

```sql
-- Check if you're in allowed_emails
SELECT * FROM allowed_emails WHERE email = '07nikhilbisht@gmail.com';

-- If no results, add yourself:
INSERT INTO public.allowed_emails (email, role)
VALUES ('07nikhilbisht@gmail.com', 'owner')
ON CONFLICT (email) DO NOTHING;
```

---

## Step 5: Create your profile

```sql
-- Get your user ID
SELECT id, email FROM auth.users WHERE email = '07nikhilbisht@gmail.com';

-- Copy the ID from above, then run:
INSERT INTO public.profiles (id, email, full_name, role)
VALUES (
  'YOUR-USER-ID-HERE',  -- Replace with actual ID from query above
  '07nikhilbisht@gmail.com',
  'Nikhil Bisht',
  'owner'
)
ON CONFLICT (id) DO NOTHING;
```

---

## Step 6: Test lead insertion

```sql
-- This should work now:
INSERT INTO public.leads (brand_name, source)
VALUES ('Test Company', 'manual')
RETURNING *;
```

If this works, your database is ready!

---

## Step 7: Test in browser

1. Go to http://localhost:3000/login
2. Login with your email and password
3. You should see the CRM dashboard
4. Try importing your CSV

---

## Troubleshooting

### Error: "permission denied for table leads"
**Solution**: Your user is not in the profiles table or doesn't have a role. Repeat Steps 4-5.

### Error: "Could not find the 'brand_name' column"
**Solution**: The leads table doesn't exist. Run Step 2.

### Error: "Signup blocked: email is not on the invite allowlist"
**Solution**: Add your email to allowed_emails (Step 4).

### Still can't see leads after import
**Solution**: Check RLS policies:
```sql
-- Verify you have staff access
SELECT public.is_staff();  -- Should return 'true'

-- Check your role
SELECT public.current_app_role();  -- Should return 'owner'
```
