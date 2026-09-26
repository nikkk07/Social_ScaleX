-- Debug queries to check what's happening
-- Run these one by one in Supabase SQL Editor

-- 1. Check if lead_assignments table exists and has data
SELECT 
  COUNT(*) as total_assignments,
  COUNT(DISTINCT member_id) as members_with_assignments,
  COUNT(DISTINCT lead_id) as unique_leads_assigned
FROM lead_assignments;

-- 2. Check Amit's profile and quota
SELECT 
  id,
  email,
  full_name,
  role,
  daily_lead_quota
FROM profiles
WHERE email = 'amit@ssx.com';

-- 3. Check if Amit has any lead assignments
SELECT 
  la.id,
  la.lead_id,
  la.member_id,
  la.assigned_at,
  la.contacted,
  l.brand_name
FROM lead_assignments la
LEFT JOIN leads l ON la.lead_id = l.id
WHERE la.member_id = (SELECT id FROM profiles WHERE email = 'amit@ssx.com')
LIMIT 5;

-- 4. Check total available leads
SELECT COUNT(*) as total_undeleted_leads
FROM leads
WHERE is_deleted = FALSE;

-- 5. Test the assign function manually
-- Replace 'AMIT_ID_HERE' with actual ID from query #2
-- SELECT assign_leads_to_member('AMIT_ID_HERE'::uuid, 10, (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1));
