-- Quick migration - just the essential tables
-- Copy and paste this entire block into Supabase SQL Editor

-- Step 1: Add daily_lead_quota to profiles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'daily_lead_quota'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_lead_quota INTEGER DEFAULT NULL;
  END IF;
END $$;

-- Step 2: Create lead_assignments table
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_assignments') THEN
    CREATE TABLE lead_assignments (
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
    
    CREATE INDEX idx_lead_assignments_member ON lead_assignments(member_id, assigned_at);
    CREATE INDEX idx_lead_assignments_contacted ON lead_assignments(member_id, contacted);
  END IF;
END $$;

-- Step 3: Create function to assign leads
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

-- Step 4: Grant permissions
DO $$
BEGIN
  EXECUTE 'GRANT EXECUTE ON FUNCTION assign_leads_to_member TO authenticated';
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;
