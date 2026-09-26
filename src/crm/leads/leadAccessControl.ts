// Lead access control logic based on user role and quota
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/lib/database.types';

export interface LeadAccessInfo {
  canAccessAllLeads: boolean;
  assignedLeadIds: string[] | null;
  dailyQuota: number | null;
  accessibleCount: number;
}

/**
 * Determines what leads a user can access based on their role
 */
export async function getLeadAccessInfo(
  userId: string,
  userRole: AppRole | null
): Promise<LeadAccessInfo> {
  // Super admin, admin, and owner can access all leads
  if (userRole === 'super_admin' || userRole === 'admin' || userRole === 'owner') {
    return {
      canAccessAllLeads: true,
      assignedLeadIds: null,
      dailyQuota: null,
      accessibleCount: 0,
    };
  }

  // Members can only access assigned leads
  if (userRole === 'member') {
    // Get member's quota
    const { data: profile } = await supabase
      .from('profiles')
      .select('daily_lead_quota')
      .eq('id', userId)
      .single();

    // Get assigned leads (up to quota, prioritizing uncontacted)
    const { data: assignments } = await supabase
      .from('lead_assignments')
      .select('lead_id')
      .eq('member_id', userId)
      .order('contacted', { ascending: true })
      .order('assigned_at', { ascending: true })
      .limit(profile?.daily_lead_quota || 10);

    const leadIds = (assignments || []).map(a => a.lead_id);

    return {
      canAccessAllLeads: false,
      assignedLeadIds: leadIds,
      dailyQuota: profile?.daily_lead_quota || null,
      accessibleCount: leadIds.length,
    };
  }

  // Default: no access
  return {
    canAccessAllLeads: false,
    assignedLeadIds: [],
    dailyQuota: null,
    accessibleCount: 0,
  };
}

/**
 * Builds the lead query filter based on access control
 */
export function buildLeadAccessFilter(accessInfo: LeadAccessInfo) {
  if (accessInfo.canAccessAllLeads) {
    // No additional filter needed
    return null;
  }

  if (accessInfo.assignedLeadIds && accessInfo.assignedLeadIds.length > 0) {
    // Filter to only assigned leads
    return { in: { column: 'id', values: accessInfo.assignedLeadIds } };
  }

  // No accessible leads - return impossible filter
  return { in: { column: 'id', values: ['00000000-0000-0000-0000-000000000000'] } };
}

/**
 * Marks a lead as contacted by a member
 */
export async function markLeadContacted(
  leadId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('lead_assignments')
      .update({ 
        contacted: true, 
        contacted_at: new Date().toISOString() 
      })
      .eq('lead_id', leadId)
      .eq('member_id', memberId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err instanceof Error ? err.message : 'Unknown error' 
    };
  }
}
