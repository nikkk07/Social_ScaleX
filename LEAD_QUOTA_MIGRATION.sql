-- ============================================================================
-- Lead Quota System Migration
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- Step 1: Add daily_lead_quota column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS daily_lead_quota INTEGER DEFAULT NULL;

COMMENT ON COLUMN profiles.daily_lead_quota IS 'Daily lead quota for members. NULL means unlimited (for admin/super_admin/owner)';

-- Step 2: Create lead_assignments table to track member lead access
CREATE TABLE IF NOT EXISTS lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID REFERENCES profiles(id),
  notes TEXT,
  UNIQUE(lead_id, member_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_assignments_member ON lead_assignments(member_id, assigned_at);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_assignments_contacted ON lead_assignments(member_id, contacted);

COMMENT ON TABLE lead_assignments IS 'Tracks which leads are assigned to which members and their contact status';

-- Step 3: Create view for member daily lead access
CREATE OR REPLACE VIEW member_daily_leads AS
SELECT 
  la.member_id,
  la.lead_id,
  la.assigned_at,
  la.contacted,
  la.contacted_at,
  l.brand_name,
  l.phone,
  l.email,
  l.status,
  DATE(la.assigned_at) as assignment_date,
  p.daily_lead_quota
FROM lead_assignments la
JOIN leads l ON la.lead_id = l.id
JOIN profiles p ON la.member_id = p.id
WHERE l.is_deleted = FALSE
ORDER BY la.assigned_at ASC;

COMMENT ON VIEW member_daily_leads IS 'View showing all lead assignments with member quota info';

-- Step 4: Create function to get accessible leads for a member
CREATE OR REPLACE FUNCTION get_member_accessible_leads(
  p_member_id UUID,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  lead_id UUID,
  brand_name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT,
  assigned_at TIMESTAMP WITH TIME ZONE,
  contacted BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    la.lead_id,
    l.brand_name,
    l.phone,
    l.email,
    l.status,
    la.assigned_at,
    la.contacted
  FROM lead_assignments la
  JOIN leads l ON la.lead_id = l.id
  WHERE la.member_id = p_member_id
    AND l.is_deleted = FALSE
  ORDER BY la.contacted ASC, la.assigned_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_member_accessible_leads IS 'Returns up to N leads for a member, prioritizing uncontacted leads';

-- Step 5: Create function to assign next batch of leads to a member
CREATE OR REPLACE FUNCTION assign_leads_to_member(
  p_member_id UUID,
  p_quota INTEGER,
  p_assigned_by UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_current_count INTEGER;
  v_needed INTEGER;
  v_assigned INTEGER := 0;
BEGIN
  -- Count currently accessible uncontacted leads
  SELECT COUNT(*) INTO v_current_count
  FROM lead_assignments
  WHERE member_id = p_member_id
    AND contacted = FALSE;
  
  -- Calculate how many more leads needed
  v_needed := p_quota - v_current_count;
  
  IF v_needed <= 0 THEN
    RETURN 0;
  END IF;
  
  -- Assign unassigned leads to this member
  INSERT INTO lead_assignments (lead_id, member_id, assigned_by)
  SELECT l.id, p_member_id, p_assigned_by
  FROM leads l
  WHERE l.is_deleted = FALSE
    AND l.id NOT IN (
      SELECT lead_id FROM lead_assignments WHERE member_id = p_member_id
    )
  ORDER BY l.created_at ASC
  LIMIT v_needed
  ON CONFLICT (lead_id, member_id) DO NOTHING;
  
  GET DIAGNOSTICS v_assigned = ROW_COUNT;
  
  RETURN v_assigned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION assign_leads_to_member IS 'Automatically assigns leads to member up to their daily quota, considering carryover';

-- Step 6: Grant permissions
GRANT SELECT ON member_daily_leads TO authenticated;
GRANT EXECUTE ON FUNCTION get_member_accessible_leads TO authenticated;
GRANT EXECUTE ON FUNCTION assign_leads_to_member TO authenticated;

-- ============================================================================
-- Migration Complete
-- ============================================================================
