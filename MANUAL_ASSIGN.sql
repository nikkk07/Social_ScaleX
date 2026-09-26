-- Manual lead assignment for Amit
-- This bypasses the API and assigns leads directly in the database

-- Step 1: Get Amit's ID (run this first to see his ID)
SELECT id, email, full_name, role, daily_lead_quota
FROM profiles
WHERE email = 'amit@ssx.com';

-- Step 2: After you see Amit's ID above, replace 'AMIT_USER_ID' below with his actual ID
-- and uncomment the INSERT statement below:

/*
INSERT INTO lead_assignments (lead_id, member_id, assigned_by, contacted)
SELECT 
  l.id as lead_id,
  'AMIT_USER_ID'::uuid as member_id,
  (SELECT id FROM profiles WHERE role = 'super_admin' LIMIT 1) as assigned_by,
  FALSE as contacted
FROM leads l
WHERE l.is_deleted = FALSE
  AND l.id NOT IN (SELECT lead_id FROM lead_assignments)
ORDER BY l.created_at ASC
LIMIT 10;
*/

-- Step 3: After running the INSERT, verify it worked:
SELECT COUNT(*) as assigned_count
FROM lead_assignments
WHERE member_id = (SELECT id FROM profiles WHERE email = 'amit@ssx.com');

-- Step 4: View the actual leads assigned to Amit
SELECT 
  l.id,
  l.brand_name,
  l.phone,
  l.email,
  l.status,
  la.assigned_at,
  la.contacted
FROM lead_assignments la
JOIN leads l ON la.lead_id = l.id
WHERE la.member_id = (SELECT id FROM profiles WHERE email = 'amit@ssx.com')
ORDER BY la.assigned_at ASC;
