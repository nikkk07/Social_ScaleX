-- Add a profile for your authenticated user
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/hendwoizaxjhpwyaumsh/editor

-- First, check your user ID from auth.users
-- SELECT id, email, phone FROM auth.users;

-- Then insert a profile (replace USER_ID with your actual user ID from above)
-- Replace 'YOUR_USER_ID_HERE' with the actual UUID from auth.users

INSERT INTO public.profiles (id, email, full_name, role, is_active, daily_lead_quota, created_at, updated_at)
VALUES (
  'YOUR_USER_ID_HERE',  -- Replace with your user ID from auth.users
  'nikhil@example.com', -- Your email (or use the one from auth.users)
  'Nikhil Bisht',       -- Your full name
  'owner',              -- Role: 'owner', 'admin', or 'member'
  true,                 -- is_active
  10,                   -- daily_lead_quota (for members)
  now(),
  now()
)
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- After running this, refresh your CRM page
