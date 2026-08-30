// Staff list for the owner filter dropdown. RLS lets a provisioned staff user
// read all profiles (profiles_select → is_staff()). Best-effort: if it fails,
// the owner filter simply has no options rather than breaking the list.
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export interface ProfileOption {
  id: string;
  label: string;
}

export function useProfiles(): ProfileOption[] {
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);

  useEffect(() => {
    let active = true;
    supabase
      .from('profiles')
      .select('id, full_name, email')
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        if (!active || !data) return;
        setProfiles(
          data.map((p) => ({ id: p.id, label: p.full_name || p.email })),
        );
      });
    return () => {
      active = false;
    };
  }, []);

  return profiles;
}
