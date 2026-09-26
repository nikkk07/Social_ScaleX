-- Drop and recreate lead_assignments table cleanly
-- Run this in Supabase SQL Editor

-- Drop table if it exists (safely)
DROP TABLE IF EXISTS lead_assignments CASCADE;

-- Create the table fresh
CREATE TABLE lead_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL,
  member_id UUID NOT NULL,
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  contacted BOOLEAN DEFAULT FALSE,
  contacted_at TIMESTAMP WITH TIME ZONE,
  assigned_by UUID,
  notes TEXT,
  CONSTRAINT lead_assignments_lead_fkey FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  CONSTRAINT lead_assignments_member_fkey FOREIGN KEY (member_id) REFERENCES profiles(id) ON DELETE CASCADE,
  CONSTRAINT lead_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES profiles(id),
  CONSTRAINT lead_assignments_unique UNIQUE(lead_id, member_id)
);

-- Create indexes
CREATE INDEX idx_lead_assignments_member ON lead_assignments(member_id, assigned_at);
CREATE INDEX idx_lead_assignments_lead ON lead_assignments(lead_id);
CREATE INDEX idx_lead_assignments_contacted ON lead_assignments(member_id, contacted);

-- Drop function if exists
DROP FUNCTION IF EXISTS assign_leads_to_member(UUID, INTEGER, UUID);

-- Create the function
CREATE FUNCTION assign_leads_to_member(
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

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON lead_assignments TO authenticated;
GRANT EXECUTE ON FUNCTION assign_leads_to_member(UUID, INTEGER, UUID) TO authenticated;

-- Confirm it worked
SELECT 'Migration completed successfully!' as status;
