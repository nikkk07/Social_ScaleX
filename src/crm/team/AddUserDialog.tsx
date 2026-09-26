'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import type { AppRole } from '@/lib/database.types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddUserDialog({ open, onClose, onSuccess }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    full_name: '',
    password: '',
    role: 'member' as AppRole,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email && !formData.phone) {
      toast.error('Email or phone is required');
      return;
    }

    if (!formData.password || formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSubmitting(true);

    try {
      // Call API route to create user
      const response = await fetch('/api/crm/create-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user');
      }

      toast.success('User created successfully!');
      setFormData({
        email: '',
        phone: '',
        full_name: '',
        password: '',
        role: 'member',
      });
      onSuccess();
    } catch (error) {
      console.error('Create user error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-[var(--border)] bg-[var(--input-background)] px-3 py-2 text-sm text-[var(--color-ink)] placeholder:text-white/30 outline-none transition focus-visible:border-[var(--color-violet-light)] focus-visible:ring-2 focus-visible:ring-[var(--color-violet-light)]';

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="crm-root dark max-w-md">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Create a new user account. They&apos;ll be able to log in with email or phone.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Full Name <span className="text-[var(--destructive)]">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className={inputClass}
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={inputClass}
              placeholder="user@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Phone (10 digits)
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={inputClass}
              placeholder="9876543210"
              pattern="[0-9]{10}"
            />
            <p className="mt-1 text-xs text-white/40">Will be stored as +91XXXXXXXXXX</p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Password <span className="text-[var(--destructive)]">*</span>
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={inputClass}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-white/80">
              Role <span className="text-[var(--destructive)]">*</span>
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as AppRole })}
              className={inputClass}
            >
              <option value="member">Member</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-white/80 hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-violet-cta)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
