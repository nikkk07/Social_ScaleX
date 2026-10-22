// Row shapes of the self-serve comment-to-DM tables
// (supabase/migrations/20261023090000_ig_comment_dm.sql).

export interface IgAccountRow {
  id: string;
  user_id: string;
  ig_user_id: string;
  ig_scoped_id: string | null;
  username: string;
  name: string | null;
  avatar_url: string | null;
  account_type: string | null;
  token_enc: string | null;
  token_expires_at: string | null;
  token_refreshed_at: string | null;
  permissions: string[];
  status: 'connected' | 'reconnect' | 'disconnected';
  last_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface MediaMeta {
  id: string;
  thumb: string | null;
  caption: string | null;
  permalink: string | null;
}

export interface IgAutomationRow {
  id: string;
  account_id: string;
  name: string;
  media_scope: 'all' | 'selected';
  media_ids: string[];
  media_meta: MediaMeta[];
  trigger_mode: 'any' | 'keywords';
  keywords: string[];
  public_replies: string[];
  dm_text: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface IgBillingRow {
  account_id: string;
  user_id: string;
  mode: 'autopay' | 'once' | null;
  rzp_subscription_id: string | null;
  rzp_status: string | null;
  paid_until: string | null;
  updated_at: string;
}

export interface IgEventRow {
  id: number;
  account_id: string;
  automation_id: string | null;
  comment_id: string;
  media_id: string | null;
  commenter_id: string | null;
  commenter_username: string | null;
  comment_text: string | null;
  status: 'pending' | 'sent' | 'skipped' | 'failed';
  detail: string | null;
  dm_sent: boolean;
  reply_sent: boolean;
  created_at: string;
}

/** The account as the browser sees it: never the token. */
export const ACCOUNT_PUBLIC_COLUMNS =
  'id, ig_user_id, username, name, avatar_url, account_type, status, last_error, permissions, created_at';
