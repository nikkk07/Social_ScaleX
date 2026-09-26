'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthProvider';
import type { AppRole } from '@/lib/database.types';

interface TeamMember {
  id: string;
  email: string;
  phone: string | null;
  full_name: string | null;
  role: AppRole;
  daily_lead_quota: number | null;
  created_at: string;
}

export function TeamList() {
  const { user, role } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editingQuota, setEditingQuota] = useState<string | null>(null);
  const [quotaValues, setQuotaValues] = useState<Record<string, number | null>>({});

  const canManageUsers = role === 'owner' || role === 'admin' || role === 'super_admin';

  useEffect(() => {
    loadTeam();
  }, []);

  async function loadTeam() {
    try {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('profiles')
        .select('id, email, phone, full_name, role, daily_lead_quota, created_at')
        .order('created_at', { ascending: false });

      if (err) {
        // Check if error is due to missing column
        if (err.message?.includes('daily_lead_quota') || err.code === '42703') {
          console.warn('daily_lead_quota column not found - migration may not be run yet');
          // Fallback: load without daily_lead_quota
          const { data: fallbackData, error: fallbackErr } = await supabase
            .from('profiles')
            .select('id, email, phone, full_name, role, created_at')
            .order('created_at', { ascending: false });
          
          if (fallbackErr) throw fallbackErr;
          
          // Add daily_lead_quota as null
          const membersWithQuota = (fallbackData || []).map(m => ({
            ...m,
            daily_lead_quota: null
          }));
          
          setMembers(membersWithQuota);
          
          // Initialize quota values
          const quotas: Record<string, number | null> = {};
          membersWithQuota.forEach(m => {
            quotas[m.id] = null;
          });
          setQuotaValues(quotas);
          
          setError('⚠️ Migration not run yet. Run LEAD_QUOTA_MIGRATION.sql to enable quota features.');
          setLoading(false);
          return;
        }
        throw err;
      }
      
      setMembers(data || []);
      
      // Initialize quota values
      const quotas: Record<string, number | null> = {};
      (data || []).forEach(m => {
        quotas[m.id] = m.daily_lead_quota;
      });
      setQuotaValues(quotas);
      
      setError(null);
    } catch (err) {
      console.error('Failed to load team:', err);
      setError('Failed to load team members');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteUser(userId: string, memberName: string) {
    // Prevent deleting yourself
    if (userId === user?.id) {
      alert("You cannot delete your own account");
      return;
    }

    if (!confirm(`Are you sure you want to delete ${memberName}? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeleting(userId);
      const response = await fetch(`/api/crm/delete-user?id=${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete user');
      }

      // Refresh the list
      await loadTeam();
    } catch (err) {
      console.error('Delete user error:', err);
      alert(err instanceof Error ? err.message : 'Failed to delete user');
    } finally {
      setDeleting(null);
    }
  }

  async function handleUpdateQuota(memberId: string) {
    try {
      const newQuota = quotaValues[memberId];
      
      const response = await fetch('/api/crm/update-quota', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          daily_lead_quota: newQuota,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update quota');
      }

      // Update local state
      setMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, daily_lead_quota: newQuota || null } : m
      ));
      
      setEditingQuota(null);
      
      // Auto-assign leads if quota is set
      if (newQuota && newQuota > 0) {
        await handleAssignLeads(memberId, newQuota);
      }
    } catch (err) {
      console.error('Update quota error:', err);
      alert(err instanceof Error ? err.message : 'Failed to update quota');
    }
  }

  async function handleAssignLeads(memberId: string, quota: number) {
    try {
      const response = await fetch('/api/crm/assign-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: memberId,
          quota,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to assign leads');
      }

      const result = await response.json();
      if (result.assigned_count > 0) {
        alert(`Successfully assigned ${result.assigned_count} leads`);
      }
    } catch (err) {
      console.error('Assign leads error:', err);
      alert(err instanceof Error ? err.message : 'Failed to assign leads');
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            <Skeleton className="h-4 w-48 mb-2" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--color-amber)]/30 bg-[var(--color-amber)]/10 p-4">
          <p className="text-sm text-[var(--color-amber)] mb-2">{error}</p>
          {error.includes('Migration') && (
            <div className="text-xs text-white/60 space-y-1">
              <p>To enable the daily lead quota system:</p>
              <ol className="list-decimal list-inside ml-2 space-y-1">
                <li>Open Supabase Dashboard → SQL Editor</li>
                <li>Run the file: <code className="bg-black/30 px-1 py-0.5 rounded">LEAD_QUOTA_MIGRATION.sql</code></li>
                <li>Refresh this page</li>
              </ol>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={loadTeam}
          className="text-sm text-[var(--color-violet-light)] hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (members.length === 0) {
    return (
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-8 text-center">
        <p className="text-sm text-white/50">No team members found</p>
      </div>
    );
  }

  const roleBadgeColors: Record<AppRole, string> = {
    owner: 'bg-[var(--color-violet-cta)] text-white',
    admin: 'bg-[var(--color-emerald)]/20 text-[var(--color-emerald)]',
    member: 'bg-[var(--accent)] text-white/80',
    super_admin: 'bg-[var(--color-amber)]/20 text-[var(--color-amber)]',
  };

  return (
    <div className="space-y-3">
      {members.map(member => {
        const isCurrentUser = member.id === user?.id;
        const canDelete = canManageUsers && !isCurrentUser;
        const isMember = member.role === 'member';
        const isEditingThisQuota = editingQuota === member.id;

        return (
          <div
            key={member.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-white/90">
                    {member.full_name || member.email}
                    {isCurrentUser && <span className="text-white/40 text-sm ml-1">(You)</span>}
                  </span>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs ${roleBadgeColors[member.role]}`}>
                    {member.role}
                  </span>
                </div>
                {member.email && <p className="text-sm text-white/60 mt-1">{member.email}</p>}
                {member.phone && <p className="text-sm text-white/60">{member.phone}</p>}
                
                {/* Daily Quota for Members */}
                {isMember && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-white/40">Daily Quota:</span>
                    {isEditingThisQuota ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={quotaValues[member.id] ?? ''}
                          onChange={(e) => setQuotaValues(prev => ({
                            ...prev,
                            [member.id]: e.target.value ? parseInt(e.target.value) : null
                          }))}
                          className="w-20 rounded border border-[var(--border)] bg-[var(--input-background)] px-2 py-1 text-xs text-white"
                          placeholder="10"
                        />
                        <button
                          onClick={() => handleUpdateQuota(member.id)}
                          className="text-xs text-[var(--color-emerald)] hover:underline"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingQuota(null);
                            setQuotaValues(prev => ({
                              ...prev,
                              [member.id]: member.daily_lead_quota
                            }));
                          }}
                          className="text-xs text-white/50 hover:underline"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-sm text-white/80">
                          {member.daily_lead_quota ?? 'Not Set'}
                          {member.daily_lead_quota && ' leads/day'}
                        </span>
                        {canManageUsers && (
                          <button
                            onClick={() => setEditingQuota(member.id)}
                            className="text-xs text-[var(--color-violet-light)] hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {canManageUsers && member.daily_lead_quota && (
                          <button
                            onClick={() => handleAssignLeads(member.id, member.daily_lead_quota!)}
                            className="text-xs text-[var(--color-emerald)] hover:underline"
                          >
                            Assign Leads Now
                          </button>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                <p className="text-xs text-white/40 mt-1">
                  Joined {new Date(member.created_at).toLocaleDateString()}
                </p>
              </div>
              
              {canDelete && (
                <button
                  type="button"
                  onClick={() => handleDeleteUser(member.id, member.full_name || member.email)}
                  disabled={deleting === member.id}
                  className="inline-flex items-center gap-2 rounded-lg border border-[var(--destructive)]/30 bg-[var(--destructive)]/10 px-3 py-2 text-sm text-[var(--destructive)] transition-colors hover:bg-[var(--destructive)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {deleting === member.id ? 'Removing...' : 'Remove'}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
